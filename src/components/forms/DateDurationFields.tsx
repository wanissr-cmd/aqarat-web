'use client'

import { useContractStore } from '@/stores/contractStore'
import { formatShortDate } from '@/lib/date-utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function DateDurationFields() {
  const { form, setCreationDate, setStartDate, setDuration } = useContractStore()
  const durations = [1, 2, 3, 4, 5]

  // ✅ تحويل Date لـ string للـ input
  const toInputValue = (date: Date | null | undefined): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return ''
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return (
    <div className="space-y-6">

      {/* تاريخ الإنشاء */}
      <div className="space-y-2">
        <Label>تاريخ إنشاء العقد</Label>
        <Input
          type="date"
          value={toInputValue(form.creationDate)}
          onChange={(e) => {
            if (e.target.value) {
              const [y, m, d] = e.target.value.split('-').map(Number)
              setCreationDate(new Date(y, m - 1, d))
            }
          }}
        />
        <p className="text-xs text-gray-500">الافتراضي: تاريخ اليوم — قابل للتعديل</p>
      </div>

      {/* تاريخ البداية */}
      <div className="space-y-2">
        <Label>تاريخ بداية العقد</Label>
        <Input
          type="date"
          value={toInputValue(form.startDate)}
          onChange={(e) => {
            if (e.target.value) {
              const [y, m, d] = e.target.value.split('-').map(Number)
              setStartDate(new Date(y, m - 1, d))
            }
          }}
        />
        <p className="text-xs text-gray-500">الافتراضي: أول الشهر اللاحق — قابل للتعديل</p>
      </div>

      {/* المدة */}
      <div className="space-y-2">
        <Label>مدة العقد</Label>
        <div className="flex gap-2">
          {durations.map((y) => (
            <Button
              key={y}
              type="button"
              variant={form.durationYears === y ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDuration(y)}
              className="flex-1"
            >
              {y === 1 ? 'سنة' : y === 2 ? 'سنتان' : `${y} سنوات`}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Label className="text-sm text-gray-600 whitespace-nowrap">أو أدخل عدد السنوات:</Label>
          <Input
            type="number"
            min={1}
            max={99}
            value={form.durationYears}
            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
            className="w-24"
          />
        </div>
      </div>

      {/* تاريخ النهاية */}
      <div className="space-y-2">
        <Label>تاريخ نهاية العقد</Label>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
          <span className="font-medium text-gray-800">
            {form.endDate instanceof Date && !isNaN(form.endDate.getTime())
              ? formatShortDate(form.endDate)
              : '—'}
          </span>
          <span className="text-xs text-green-600 mr-auto">✓ محسوب تلقائياً</span>
        </div>
        <p className="text-xs text-gray-500">يتغير تلقائياً عند تعديل تاريخ البداية أو المدة</p>
      </div>

    </div>
  )
}