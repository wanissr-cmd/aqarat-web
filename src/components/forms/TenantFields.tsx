'use client'

import { useContractStore } from '@/stores/contractStore'
import { IDScanner } from '@/components/ocr/IDScanner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Building2 } from 'lucide-react'
import type { ResidentialPurpose } from '@/types/contract'

interface TenantFieldsProps {
  showResidentialPurpose?: boolean  // للعقود السكنية فقط
  showGuarantor?: boolean           // للاستثمار فقط
}

export function TenantFields({ showResidentialPurpose = false, showGuarantor = false }: TenantFieldsProps) {
  const { form, setField, setTenantType, setOcrData } = useContractStore()
  const isIndividual = form.tenantType === 'INDIVIDUAL'

  return (
    <div className="space-y-6">

      {/* نوع المستأجر */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">نوع المستأجر</Label>
        <div className="flex gap-3">
          <Button
            type="button"
            variant={isIndividual ? 'default' : 'outline'}
            onClick={() => setTenantType('INDIVIDUAL')}
            className="flex-1"
          >
            <User className="w-4 h-4 ml-2" />
            فرد
          </Button>
          <Button
            type="button"
            variant={!isIndividual ? 'default' : 'outline'}
            onClick={() => setTenantType('COMPANY')}
            className="flex-1"
          >
            <Building2 className="w-4 h-4 ml-2" />
            شركة
          </Button>
        </div>
      </div>

      {/* مسح الهوية */}
      <IDScanner
        label={isIndividual ? 'مسح بطاقة هوية المستأجر (اختياري)' : 'مسح بطاقة هوية الممثل القانوني (اختياري)'}
        onDataExtracted={(ocrData) => {
          if (isIndividual) {
            setOcrData({
              tenantCivilId: ocrData.civilId,
              tenantNationality: ocrData.nationality,
              tenantName: ocrData.fullName,
            })
          } else {
            setOcrData({
              tenantRepCivilId: ocrData.civilId,
              tenantRepNationality: ocrData.nationality,
              tenantRepName: ocrData.fullName,
              tenantCompanyName: ocrData.companyName,
            })
          }
        }}
      />

      {/* بيانات الفرد */}
      {isIndividual && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 border-b pb-2">بيانات المستأجر</h3>
          <Field label="الاسم الكامل" value={form.tenantName} onChange={(v) => setField('tenantName', v)} placeholder="اسم المستأجر كاملاً" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="الجنسية" value={form.tenantNationality} onChange={(v) => setField('tenantNationality', v)} placeholder="كويتي" />
            <Field label="رقم البطاقة المدنية" value={form.tenantCivilId} onChange={(v) => setField('tenantCivilId', v)} placeholder="123456789012" />
          </div>
          <Field label="عنوان العمل" value={form.tenantWorkAddress} onChange={(v) => setField('tenantWorkAddress', v)} placeholder="المنطقة، المبنى، الشركة" />
          <Field label="رقم الهاتف" value={form.tenantPhone} onChange={(v) => setField('tenantPhone', v)} placeholder="XXXXXXXX" />
        </div>
      )}

      {/* بيانات الشركة */}
      {!isIndividual && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 border-b pb-2">بيانات الشركة</h3>
          <Field label="اسم الشركة" value={form.tenantCompanyName} onChange={(v) => setField('tenantCompanyName', v)} placeholder="شركة ... للتجارة العامة" />
          <Field label="عنوان الشركة" value={form.tenantCompanyAddress} onChange={(v) => setField('tenantCompanyAddress', v)} placeholder="المنطقة، القطعة، الشارع" />

          <h3 className="font-semibold text-gray-700 border-b pb-2 mt-4">بيانات الممثل القانوني</h3>
          <Field label="اسم الممثل" value={form.tenantRepName} onChange={(v) => setField('tenantRepName', v)} placeholder="اسم الممثل كاملاً" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="جنسية الممثل" value={form.tenantRepNationality} onChange={(v) => setField('tenantRepNationality', v)} placeholder="كويتي" />
            <Field label="بطاقة مدنية الممثل" value={form.tenantRepCivilId} onChange={(v) => setField('tenantRepCivilId', v)} placeholder="123456789012" />
          </div>
          <Field label="رقم هاتف الممثل" value={form.tenantRepPhone} onChange={(v) => setField('tenantRepPhone', v)} placeholder="XXXXXXXX" />
          <Field label="الصفة القانونية" value={form.tenantLegalCapacity} onChange={(v) => setField('tenantLegalCapacity', v)} placeholder="مدير الشركة / وكيل / مفوض" />
          <Field label="مستند الصفة" value={form.tenantLegalDoc} onChange={(v) => setField('tenantLegalDoc', v)} placeholder="شهادة مستخرج السجل التجاري صادرة من وزارة التجارة" />
          <Field label="تاريخ المستند" value={form.tenantLegalDocDate ? form.tenantLegalDocDate.toISOString().split('T')[0] : ''} onChange={(v) => setField('tenantLegalDocDate', v ? new Date(v) : null)} type="date" />

          {/* الضامن المتضامن */}
          {showGuarantor && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div>
                <p className="font-medium text-sm">ضامن متضامن</p>
                <p className="text-xs text-gray-500">إضافة "وهو ضامن متضامن في هذا العقد" بجوار اسم الممثل</p>
              </div>
              <Switch
                checked={form.hasGuarantor}
                onCheckedChange={(v) => setField('hasGuarantor', v)}
              />
            </div>
          )}
        </div>
      )}

      {/* الغرض السكني */}
      {showResidentialPurpose && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 border-b pb-2">الغرض من الإيجار</h3>
          <Select
            value={form.residentialPurpose}
            onValueChange={(v) => setField('residentialPurpose', v as ResidentialPurpose)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الغرض" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FAMILY">سكن عائلي</SelectItem>
              <SelectItem value="BACHELORS">سكن عزاب</SelectItem>
              <SelectItem value="EMPLOYEES">سكن موظفي شركة</SelectItem>
            </SelectContent>
          </Select>

          {/* عدد الأشخاص — يظهر عند عزاب أو موظفين */}
          {(form.residentialPurpose === 'BACHELORS' || form.residentialPurpose === 'EMPLOYEES') && (
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              {form.residentialPurpose === 'EMPLOYEES' && (
                <Field
                  label="اسم الشركة"
                  value={form.occupantsCompany}
                  onChange={(v) => setField('occupantsCompany', v)}
                  placeholder="اسم الشركة"
                />
              )}
              <Field
                label={form.residentialPurpose === 'BACHELORS' ? 'عدد الأشخاص' : 'عدد الموظفين'}
                value={String(form.occupantsCount || '')}
                onChange={(v) => setField('occupantsCount', parseInt(v) || 0)}
                type="number"
                placeholder="0"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// مكون حقل نصي مساعد
function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir="rtl"
      />
    </div>
  )
}
