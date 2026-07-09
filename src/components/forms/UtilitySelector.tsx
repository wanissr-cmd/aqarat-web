'use client'

import { useContractStore } from '@/stores/contractStore'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Zap, Droplets } from 'lucide-react'
import type { UtilityParty } from '@/types/contract'
import { buildUtilityText } from '@/lib/contract-engine'

export function UtilitySelector() {
  const { form, setField } = useContractStore()

  const utilityText = buildUtilityText(form.electricityOn, form.waterOn)

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">الكهرباء والماء</Label>

      {/* الكهرباء */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <Label>استهلاك الكهرباء على:</Label>
        </div>
        <div className="flex gap-3">
          <UtilityButton
            label="المالك (الطرف الأول)"
            isSelected={form.electricityOn === 'OWNER'}
            onClick={() => setField('electricityOn', 'OWNER')}
          />
          <UtilityButton
            label="المستأجر (الطرف الثاني)"
            isSelected={form.electricityOn === 'TENANT'}
            onClick={() => setField('electricityOn', 'TENANT')}
          />
        </div>
      </div>

      {/* الماء */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-500" />
          <Label>استهلاك الماء على:</Label>
        </div>
        <div className="flex gap-3">
          <UtilityButton
            label="المالك (الطرف الأول)"
            isSelected={form.waterOn === 'OWNER'}
            onClick={() => setField('waterOn', 'OWNER')}
          />
          <UtilityButton
            label="المستأجر (الطرف الثاني)"
            isSelected={form.waterOn === 'TENANT'}
            onClick={() => setField('waterOn', 'TENANT')}
          />
        </div>
      </div>

      {/* معاينة النص القانوني */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-700 font-medium mb-1">النص الذي سيظهر في العقد:</p>
        <p className="text-sm text-amber-900 font-medium leading-relaxed">
          "{utilityText.text}"
        </p>
        {!utilityText.isSingle && (
          <p className="text-xs text-amber-600 mt-1">⬆️ جملتان منفصلتان في العقد</p>
        )}
      </div>
    </div>
  )
}

function UtilityButton({ label, isSelected, onClick }: {
  label: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={isSelected ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={`flex-1 ${isSelected ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
    >
      {label}
    </Button>
  )
}
