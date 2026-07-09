'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, GripVertical, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react'
import { CONTRACT_TYPE_LABELS } from '@/types/contract'
import type { ContractType } from '@/types/contract'

interface Clause {
  id: string
  order: number
  titleAr: string | null
  contentAr: string
  contentEn: string | null
  isOptional: boolean
  conditionKey: string | null
}

interface Template {
  id: string
  type: ContractType
  nameAr: string
  clauses: Clause[]
}

const CONDITION_OPTIONS = [
  { value: '', label: 'دائم (لا شرط)' },
  { value: 'hasGracePeriod', label: 'فترة السماح مفعّلة' },
  { value: 'hasGuarantor', label: 'ضامن متضامن مفعّل' },
  { value: 'isCompanyTenant', label: 'المستأجر شركة' },
  { value: 'isIndividualTenant', label: 'المستأجر فرد' },
  { value: 'isBachelors', label: 'سكن عزاب' },
  { value: 'isEmployees', label: 'سكن موظفين' },
  { value: 'hasDeposit', label: 'يوجد تأمين' },
  { value: 'hasAdvance', label: 'يوجد مقدم أجرة' },
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(data => {
        setTemplates(data)
        if (data.length > 0) setSelectedTemplate(data[0])
      })
      .finally(() => setIsLoading(false))
  }, [])


  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4" dir="rtl">
      {[1, 2].map(i => <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">إدارة قوالب العقود</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* قائمة القوالب */}
        <div className="md:col-span-1 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">القوالب</p>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t)}
              className={`w-full text-right p-3 rounded-lg text-sm transition-colors
                ${selectedTemplate?.id === t.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
            >
              <p className="font-medium">{t.nameAr}</p>
              <p className={`text-xs mt-0.5 ${selectedTemplate?.id === t.id ? 'text-blue-200' : 'text-gray-400'}`}>
                {t.clauses.length} بند
              </p>
            </button>
          ))}
        </div>

        {/* البنود */}
        <div className="md:col-span-3">
          {selectedTemplate ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{selectedTemplate.nameAr}</h2>
                  <p className="text-xs text-gray-500">عرض البنود فقط. تحرير البنود مغلق.</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {selectedTemplate.clauses.length} بند
                </Badge>
              </div>

              {[...selectedTemplate.clauses]
                .sort((a, b) => a.order - b.order)
                .map((clause, idx) => (
                  <Card key={clause.id} className={`transition-all ${clause.isOptional ? 'border-dashed border-amber-300' : ''}`}>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{idx + 1}. {clause.titleAr || 'بدون عنوان'}</span>
                          {clause.isOptional && (
                            <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">
                              {CONDITION_OPTIONS.find(o => o.value === clause.conditionKey)?.label || 'اختياري'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {clause.contentAr}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-gray-400">
                اختر قالباً من القائمة
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
