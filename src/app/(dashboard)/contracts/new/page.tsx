'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useContractStore } from '@/stores/contractStore'
import { TenantFields } from '@/components/forms/TenantFields'
import { DateDurationFields } from '@/components/forms/DateDurationFields'
import { UtilitySelector } from '@/components/forms/UtilitySelector'
import { ContractPreview } from '@/components/contracts/ContractPreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CONTRACT_TYPE_LABELS } from '@/types/contract'
import type { ContractType } from '@/types/contract'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'

const CONTRACT_TYPES: Array<{ type: ContractType; icon: string; desc: string }> = [
  { type: 'RESIDENTIAL', icon: '🏠', desc: 'إيجار شقة أو وحدة سكنية' },
  { type: 'INVESTMENT_SHOP', icon: '🏪', desc: 'استثمار محل تجاري أو مطعم' },
  { type: 'INVESTMENT_APARTMENT', icon: '🏢', desc: 'استثمار شقة في عمارة تجارية' },
  { type: 'COMMERCIAL_OFFICE', icon: '🏗️', desc: 'إيجار مكتب أو طابق تجاري' },
]

const STEPS = [
  { id: 1, label: 'نوع العقد' },
  { id: 2, label: 'التواريخ' },
  { id: 3, label: 'المستأجر' },
  { id: 4, label: 'العقار' },
  { id: 5, label: 'الشروط المالية' },
  { id: 6, label: 'المعاينة' },
]

// ✅ Template IDs ثابتة بدون الحاجة لـ API
const TEMPLATE_IDS: Record<string, string> = {
  RESIDENTIAL: 'tmpl-residential',
  INVESTMENT_SHOP: 'tmpl-investment-shop',
  INVESTMENT_APARTMENT: 'tmpl-investment-apt',
  COMMERCIAL_OFFICE: 'tmpl-commercial',
}

interface CompanySettings {
  nameAr: string
  nameEn?: string | null
  representativeName: string
  logo?: string | null
}

export default function NewContractPage() {
  const router = useRouter()
  const { form, step, setStep, setType, setField } = useContractStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [templateClauses, setTemplateClauses] = useState<any[]>([])
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    nameAr: 'شركة سما كابيتال العالمية لبيع وشراء الأراضي والعقارات',
    representativeName: 'عبدالله فيصل عبدالوهاب بورسلي',
    logo: '',
  })

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setCompanySettings(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.type) { setTemplateClauses([]); return }
    const templateId = TEMPLATE_IDS[form.type]
    if (!templateId) { setTemplateClauses([]); return }
    fetch(`/api/templates/${templateId}/clauses`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setTemplateClauses(Array.isArray(data) ? data : []))
      .catch(() => setTemplateClauses([]))
  }, [form.type])

  const goNext = () => setStep(Math.min(step + 1, STEPS.length))
  const goPrev = () => setStep(Math.max(step - 1, 1))
  const isResidential = form.type === 'RESIDENTIAL'
  const isInvestment = form.type === 'INVESTMENT_SHOP' || form.type === 'INVESTMENT_APARTMENT'

  const Step1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CONTRACT_TYPES.map(({ type, icon, desc }) => (
          <Card
            key={type}
            className={`cursor-pointer transition-all hover:shadow-md ${
              form.type === type ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setType(type)}
          >
            <CardContent className="p-5 flex items-start gap-4">
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="font-semibold">{CONTRACT_TYPE_LABELS[type]}</p>
                <p className="text-sm text-gray-500 mt-1">{desc}</p>
              </div>
              {form.type === type && (
                <Check className="w-5 h-5 text-blue-500 mr-auto mt-1" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const Step4 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="رقم القسيمة" field="propertyBlock" placeholder="123" />
        <Field label="المنطقة" field="propertyZone" placeholder="السالمية" />
        <Field label="القطعة" field="propertySection" placeholder="5" />
        <Field label="الشارع" field="propertyStreet" placeholder="شارع خالد بن الوليد" />
        {isResidential && (
          <Field label="الجادة" field="propertyAlley" placeholder="الجادة 3" />
        )}
        <Field
          label={isResidential ? 'رقم الشقة' : isInvestment ? 'رقم المحل / الشقة' : 'رقم المكتب / الدور'}
          field="unitNumber"
          placeholder="12"
        />
        <Field label="الدور" field="floor" placeholder="الثالث" />
        <Field label="الرقم الآلي" field="autoNumber" placeholder="19524584" />
      </div>
      {!isResidential && (
        <div className="space-y-1">
          <Label className="text-sm">الغرض / نشاط تجاري</Label>
          <Input
            value={form.businessPurpose}
            onChange={(e) => setField('businessPurpose', e.target.value)}
            placeholder="مطعم / صالون / مكاتب إدارية"
            dir="rtl"
          />
        </div>
      )}
    </div>
  )

  const convertToKuwaitiDinars = (num: number): string => {
    if (!num || isNaN(num)) return ''
    const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة']
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون']
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة']
    if (num === 1000) return 'ألف دينار كويتي لا غير'
    let text = ''
    if (num >= 1000) {
      const thousands = Math.floor(num / 1000)
      text += thousands === 1 ? 'ألف' : thousands === 2 ? 'ألفان' : units[thousands] + ' آلاف'
      num %= 1000
      if (num > 0) text += ' و'
    }
    if (num >= 100) {
      text += hundreds[Math.floor(num / 100)]
      num %= 100
      if (num > 0) text += ' و'
    }
    if (num > 0) {
      if (num < 10) { text += units[num] }
      else if (num >= 11 && num <= 19) {
        const c = ['', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر']
        text += c[num - 10]
      } else {
        const r = num % 10
        const t = Math.floor(num / 10)
        text += r > 0 ? units[r] + ' و' + tens[t] : tens[t]
      }
    }
    return text ? `${text} دينار كويتي لا غير` : ''
  }

  const Step5 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-sm">الإيجار الشهري (د.ك)</Label>
          <Input
            type="number"
            value={form.monthlyRent || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0
              setField('monthlyRent', val)
              setField('monthlyRentText', convertToKuwaitiDinars(val))
            }}
            placeholder="500"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">الإيجار بالحروف</Label>
          <Input
            value={form.monthlyRentText}
            onChange={(e) => setField('monthlyRentText', e.target.value)}
            placeholder="خمسمئة دينار كويتي"
            dir="rtl"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">مبلغ التأمين (د.ك)</Label>
          <Input
            type="number"
            value={form.deposit || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0
              setField('deposit', val)
            }}
            placeholder="500"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">مقدم الأجرة (د.ك)</Label>
          <Input
            type="number"
            value={form.advance || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0
              setField('advance', val)
              setField('advanceText', convertToKuwaitiDinars(val))
            }}
            placeholder="1000"
          />
        </div>
        {form.advance > 0 && (
          <div className="space-y-1 col-span-2">
            <Label className="text-sm">مقدم الأجرة بالحروف</Label>
            <Input
              value={form.advanceText}
              onChange={(e) => setField('advanceText', e.target.value)}
              placeholder="ألف دينار كويتي"
              dir="rtl"
            />
          </div>
        )}
      </div>

      <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">فترة السماح</p>
            <p className="text-xs text-gray-500">تُحذف تلقائياً من العقد إذا لم تفعّلها</p>
          </div>
          <Switch
            checked={form.hasGracePeriod === true}
            onCheckedChange={(v) => setField('hasGracePeriod', v)}
          />
        </div>
        {form.hasGracePeriod === true && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="space-y-1">
              <Label className="text-sm">بداية فترة السماح</Label>
              <Input
                type="date"
                value={form.gracePeriodStart instanceof Date
                  ? form.gracePeriodStart.toISOString().split('T')[0]
                  : form.gracePeriodStart || ''}
                onChange={(e) => setField('gracePeriodStart', e.target.value ? new Date(e.target.value) : null)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">نهاية فترة السماح</Label>
              <Input
                type="date"
                value={form.gracePeriodEnd instanceof Date
                  ? form.gracePeriodEnd.toISOString().split('T')[0]
                  : form.gracePeriodEnd || ''}
                onChange={(e) => setField('gracePeriodEnd', e.target.value ? new Date(e.target.value) : null)}
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-sm">تاريخ بدء الدفع الفعلي</Label>
              <Input
                type="date"
                value={form.paymentStartDate instanceof Date
                  ? form.paymentStartDate.toISOString().split('T')[0]
                  : form.paymentStartDate || ''}
                onChange={(e) => setField('paymentStartDate', e.target.value ? new Date(e.target.value) : null)}
              />
            </div>
          </div>
        )}
      </div>

      <UtilitySelector />

      {!isResidential && (
        <div className="space-y-1">
          <Label className="text-sm">المدة القصوى لتفعيل النشاط (بالأشهر)</Label>
          <Input
            type="number"
            value={form.activationPeriod || ''}
            onChange={(e) => setField('activationPeriod', parseInt(e.target.value) || 1)}
            placeholder="3"
          />
        </div>
      )}
    </div>
  )

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const tenantRes = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantType: form.tenantType,
          tenantName: form.tenantName,
          nationality: form.tenantNationality,
          civilId: form.tenantCivilId || `temp-${Date.now()}`,
          workAddress: form.tenantWorkAddress,
          phone: form.tenantPhone,
          companyName: form.tenantCompanyName,
          repName: form.tenantRepName,
          repCivilId: form.tenantRepCivilId || undefined,
          repNationality: form.tenantRepNationality,
          repPhone: form.tenantRepPhone,
          legalCapacity: form.tenantLegalCapacity,
          legalDoc: form.tenantLegalDoc,
          legalDocDate: form.tenantLegalDocDate?.toISOString(),
          companyAddress: form.tenantCompanyAddress,
        }),
      })
      if (!tenantRes.ok) throw new Error('فشل في حفظ بيانات المستأجر')
      const tenant = await tenantRes.json()

      const templateId = TEMPLATE_IDS[form.type]
      if (!templateId) throw new Error('نوع العقد غير محدد')

      const contractRes = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          tenantId: tenant.id,
          contractData: {
            ...form,
            ownerCompany: companySettings.nameAr,
            ownerRep: companySettings.representativeName,
            creationDate: form.creationDate.toISOString(),
            startDate: form.startDate.toISOString(),
            endDate: form.endDate.toISOString(),
          },
        }),
      })
      if (!contractRes.ok) throw new Error('فشل في حفظ العقد')
      const contract = await contractRes.json()
      router.push(`/contracts/${contract.id}`)
    } catch (err: any) {
      alert('خطأ في الحفظ: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = async (format: 'pdf' | 'word') => {
    setIsExporting(true)
    try {
      // ✅ جلب البنود بـ Template ID ثابت بدون الحاجة لـ availableTemplates
      let clauses: any[] = []
      const templateId = TEMPLATE_IDS[form.type]
      if (templateId) {
        const tmplRes = await fetch(`/api/templates/${templateId}/clauses`)
        if (tmplRes.ok) {
          clauses = await tmplRes.json()
        }
      }

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          contractData: {
            ...form,
            ownerCompany: companySettings.nameAr,
            ownerRep: companySettings.representativeName,
            creationDate: form.creationDate instanceof Date ? form.creationDate.toISOString() : form.creationDate,
            startDate: form.startDate instanceof Date ? form.startDate.toISOString() : form.startDate,
            endDate: form.endDate instanceof Date ? form.endDate.toISOString() : form.endDate,
          },
          templateClauses: clauses,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'فشل التصدير')
      }

      if (format === 'word') {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const contractTitle = CONTRACT_TYPE_LABELS[form.type as ContractType] || 'عقد'
        a.download = `${contractTitle}.docx`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      } else {
        const html = await res.text()
        const win = window.open('', '_blank')
        if (win) {
          win.document.write(html)
          win.document.close()
          setTimeout(() => win.print(), 1000)
        }
      }
    } catch (error: any) {
      alert('خطأ في التصدير: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }
  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <div className="mb-8">
        <div className="overflow-x-auto">
          <div className="inline-flex items-center gap-2 border border-gray-200 rounded-full bg-white px-3 py-2 shadow-sm">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => s.id < step && setStep(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap
                    ${step === s.id ? 'bg-blue-600 text-white' : ''}
                    ${step > s.id ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200' : ''}
                    ${step < s.id ? 'bg-gray-100 text-gray-400' : ''}
                  `}
                >
                  {step > s.id ? <Check className="w-3 h-3" /> : <span>{s.id}</span>}
                  {s.label}
                </button>
                {i < STEPS.length - 1 && <ChevronLeft className="w-3 h-3 text-gray-300 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {STEPS[step - 1].label}
            {form.type && step > 1 && (
              <Badge variant="outline" className="mr-2 font-normal">
                {CONTRACT_TYPE_LABELS[form.type as ContractType]}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && <Step1 />}
          {step === 2 && <DateDurationFields />}
          {step === 3 && (
            <TenantFields
              showResidentialPurpose={isResidential}
              showGuarantor={isInvestment}
            />
          )}
          {step === 4 && Step4()}
          {step === 5 && Step5()}
          {step === 6 && (
            <ContractPreview
              clauses={templateClauses}
              ownerCompany={companySettings.nameAr}
              ownerRep={companySettings.representativeName}
              onExport={handleExport}
              isExporting={isExporting}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={goPrev} disabled={step === 1}>
          <ChevronRight className="w-4 h-4 ml-1" />
          السابق
        </Button>
        <div className="flex gap-2">
          {step === STEPS.length ? (
            <Button onClick={handleSave} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 ml-1" />
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ العقد'}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={step === 1 && !form.type}>
              التالي
              <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, field, placeholder }: { label: string; field: string; placeholder?: string }) {
  const { form, setField } = useContractStore()
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Input
        value={(form as any)[field] || ''}
        onChange={(e) => setField(field as any, e.target.value)}
        placeholder={placeholder}
        dir="rtl"
      />
    </div>
  )
}
