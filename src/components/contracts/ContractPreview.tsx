'use client'

import { useMemo } from 'react'
import { useContractStore } from '@/stores/contractStore'
import { buildActiveClauses, buildSecondPartyHeader } from '@/lib/contract-engine'
import { formatContractDate } from '@/lib/date-utils'
import { CONTRACT_TYPE_LABELS, type ResidentialPurpose } from '@/types/contract'
import { Button } from '@/components/ui/button'
import { Download, FileText, Printer } from 'lucide-react'

interface ContractPreviewProps {
  clauses: Array<{
    id: string; order: number; titleAr: string | null
    contentAr: string; contentEn: string | null
    isOptional: boolean; conditionKey: string | null; variables: unknown
  }>
  ownerCompany: string
  ownerRep: string
  onExport: (format: 'pdf' | 'word') => void
  isExporting?: boolean
}

export function ContractPreview({ clauses, ownerCompany, ownerRep, onExport, isExporting }: ContractPreviewProps) {
  const { form } = useContractStore()

  const contractData = useMemo(() => ({
    ...form,
    ownerCompany,
    ownerRep,
    creationDate: form.creationDate.toISOString(),
    startDate: form.startDate.toISOString(),
    endDate: form.endDate.toISOString(),
    gracePeriodStart: form.gracePeriodStart?.toISOString(),
    gracePeriodEnd: form.gracePeriodEnd?.toISOString(),
    paymentStartDate: form.paymentStartDate?.toISOString(),
    tenantLegalDocDate: form.tenantLegalDocDate?.toISOString(),
    hasGuarantor: form.hasGuarantor,
    hasGracePeriod: form.hasGracePeriod,
    electricityOn: form.electricityOn,
    waterOn: form.waterOn,
    monthlyRent: form.monthlyRent,
    durationYears: form.durationYears,
    tenantType: form.tenantType,
    type: form.type as any,
    residentialPurpose: form.residentialPurpose ? (form.residentialPurpose as ResidentialPurpose) : undefined,
  }), [form, ownerCompany, ownerRep])

  const activeClauses = useMemo(() => {
    if (!clauses.length) return []
    return buildActiveClauses(clauses, contractData)
  }, [clauses, contractData])

  const secondParty = useMemo(() => buildSecondPartyHeader(contractData), [contractData])
  const title = form.type ? CONTRACT_TYPE_LABELS[form.type as keyof typeof CONTRACT_TYPE_LABELS] : ''

  return (
    <div className="space-y-4">
      {/* أزرار التصدير */}
      <div className="flex gap-2 sticky top-0 bg-white pb-3 border-b z-10">
        <Button
          onClick={() => onExport('word')}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <FileText className="w-4 h-4 ml-2" />
          تنزيل Word
        </Button>
        <Button
          onClick={() => onExport('pdf')}
          disabled={isExporting}
          size="sm"
          className="flex-1"
        >
          <Printer className="w-4 h-4 ml-2" />
          طباعة / PDF
        </Button>
      </div>

      {/* معاينة العقد */}
      <div
        dir="rtl"
        className="bg-white border rounded-lg p-8 shadow-sm font-serif text-sm leading-relaxed"
        style={{ fontFamily: "'Traditional Arabic', 'Cairo', serif" }}
      >
        {/* العنوان */}
        <h1 className="text-xl font-bold text-center mb-6 border-b pb-4">{title}</h1>

        {/* التاريخ */}
        <p className="mb-4 text-right">
          <span className="font-semibold">بتاريخ: </span>
          {formatContractDate(form.creationDate)}
        </p>

        {/* الأطراف */}
        <div className="mb-6 space-y-3">
          <p className="leading-relaxed">
            <span className="font-bold">الطرف الأول (المؤجر): </span>
            {ownerCompany} ويمثلها في هذا العقد السيد/ {ownerRep}
          </p>
          <p className="leading-relaxed">
            <span className="font-bold">الطرف الثاني (المستأجر): </span>
            {secondParty}
          </p>
        </div>

        {/* البنود */}
        <div className="space-y-4">
          {activeClauses.map((clause) => (
            <div key={clause.id} className="space-y-1">
              <p className="font-normal">
                {clause.number}- {clause.titleAr || ''}
              </p>
              <p className="text-justify pr-4 leading-loose">{clause.contentAr}</p>
              {clause.contentEn && (
                <p className="text-justify pl-4 leading-loose text-gray-700 text-xs" dir="ltr">
                  {clause.contentEn}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* التوقيعات */}
        <div className="mt-12 flex justify-between">
          <div className="text-center space-y-8">
            <p className="font-bold">الطرف الأول</p>
            <div className="border-b border-gray-400 w-40"></div>
          </div>
          <div className="text-center space-y-8">
            <p className="font-bold">الطرف الثاني</p>
            <div className="border-b border-gray-400 w-40"></div>
          </div>
        </div>
      </div>

      {/* عدد البنود */}
      <p className="text-xs text-gray-400 text-center">
        إجمالي البنود: {activeClauses.length} بند
      </p>
    </div>
  )
}
