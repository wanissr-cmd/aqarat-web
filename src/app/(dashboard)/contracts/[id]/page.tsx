'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  FileText, Download, Printer, Plus, ChevronRight,
  Calendar, User, Building2, Zap, Droplets, Clock
} from 'lucide-react'
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from '@/types/contract'
import { formatShortDate, formatContractDate } from '@/lib/date-utils'
import { buildUtilityText } from '@/lib/contract-engine'
import type { ContractStatus, ContractType, UtilityParty } from '@/types/contract'

interface ContractDetail {
  id: string
  type: ContractType
  status: ContractStatus
  creationDate: string
  startDate: string
  endDate: string
  durationYears: number
  monthlyRent: number
  monthlyRentText: string
  deposit: number
  advance: number
  hasGracePeriod: boolean
  gracePeriodStart?: string
  gracePeriodEnd?: string
  gracePeriodText?: string
  electricityOn: UtilityParty
  waterOn: UtilityParty
  propertyZone: string
  propertyBlock: string
  propertySection: string
  propertyStreet: string
  unitNumber: string
  floor: string
  autoNumber: string
  businessPurpose?: string
  residentialPurpose?: string
  hasGuarantor: boolean
  clausesSnapshot: Array<{ number: number; titleAr: string | null; contentAr: string }>
  tenant: {
    tenantType: string
    tenantName?: string
    companyName?: string
    repName?: string
    civilId?: string
    repCivilId?: string
    nationality?: string
    repNationality?: string
    phone?: string
    repPhone?: string
    workAddress?: string
    legalCapacity?: string
  }
  company: { nameAr: string; representativeName: string }
  addendums: Array<{
    id: string; type: string; creationDate: string; content?: string
  }>
}

export default function ContractDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [amendmentText, setAmendmentText] = useState('')
  const [isAddingAmendment, setIsAddingAmendment] = useState(false)

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then(r => r.json())
      .then(setContract)
      .finally(() => setIsLoading(false))
  }, [id])

  const handleExport = async (format: 'pdf' | 'word') => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: id, format }),
      })
      if (!res.ok) {
        throw new Error('فشل التصدير')
      }

      const blob = await res.blob()
      const downloadBlob = format === 'pdf'
        ? (blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' }))
        : blob
      const url = URL.createObjectURL(downloadBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contract-${contract?.id}.${format === 'pdf' ? 'pdf' : 'docx'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const handleAddAmendment = async (type: 'HANDOVER' | 'AMENDMENT' | 'COMMITMENT') => {
    setIsAddingAmendment(true)
    try {
      await fetch(`/api/contracts/${id}/addendums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content: amendmentText }),
      })
      // إعادة تحميل العقد
      const res = await fetch(`/api/contracts/${id}`)
      setContract(await res.json())
      setAmendmentText('')
    } finally {
      setIsAddingAmendment(false)
    }
  }

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4" dir="rtl">
      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}
    </div>
  )

  if (!contract) return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-center" dir="rtl">
      <p className="text-gray-500">لم يتم العثور على العقد</p>
      <Link href="/contracts"><Button className="mt-4">العودة للقائمة</Button></Link>
    </div>
  )

  const utilityText = buildUtilityText(contract.electricityOn, contract.waterOn)
  const tenantName = contract.tenant.tenantType === 'COMPANY'
    ? contract.tenant.companyName : contract.tenant.tenantName

  const ADDENDUM_LABELS: Record<string, string> = {
    HANDOVER: 'ملحق استلام', AMENDMENT: 'ملحق تعديل', COMMITMENT: 'إقرار وتعهد'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" dir="rtl">
      {/* الرأس */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Link href="/contracts" className="hover:text-blue-600">العقود</Link>
                    <ChevronRight className="w-3 h-3" />
                  </div>
          <h1 className="text-xl font-bold">{CONTRACT_TYPE_LABELS[contract.type]}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
              {CONTRACT_STATUS_LABELS[contract.status]}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('word')} disabled={isExporting}>
            <FileText className="w-4 h-4 ml-1" /> Word
          </Button>
          <Button size="sm" onClick={() => handleExport('pdf')} disabled={isExporting}>
            <Printer className="w-4 h-4 ml-1" /> طباعة
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">تفاصيل العقد</TabsTrigger>
          <TabsTrigger value="preview">معاينة العقد</TabsTrigger>
          <TabsTrigger value="addendums">
            الملحقات
            {contract.addendums.length > 0 && (
              <Badge variant="secondary" className="mr-1 text-xs">{contract.addendums.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== تفاصيل ===== */}
        <TabsContent value="details" className="space-y-4">

          {/* التواريخ */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" /> التواريخ
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="تاريخ الإنشاء" value={formatContractDate(new Date(contract.creationDate))} />
              <InfoRow label="بداية العقد" value={formatShortDate(new Date(contract.startDate))} />
              <InfoRow label="نهاية العقد" value={formatShortDate(new Date(contract.endDate))} />
              <InfoRow label="المدة" value={`${contract.durationYears} ${contract.durationYears === 1 ? 'سنة' : 'سنوات'}`} />
              {contract.hasGracePeriod && (
                <InfoRow
                  label="فترة السماح"
                  value={`${formatShortDate(new Date(contract.gracePeriodStart!))} - ${formatShortDate(new Date(contract.gracePeriodEnd!))}`}
                  className="col-span-2"
                />
              )}
            </CardContent>
          </Card>

          {/* المستأجر */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {contract.tenant.tenantType === 'COMPANY'
                  ? <Building2 className="w-4 h-4 text-purple-500" />
                  : <User className="w-4 h-4 text-purple-500" />}
                المستأجر
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="الاسم" value={tenantName || '-'} className="col-span-2" />
              {contract.tenant.tenantType === 'COMPANY' && (
                <>
                  <InfoRow label="الممثل" value={contract.tenant.repName || '-'} />
                  <InfoRow label="الصفة" value={contract.tenant.legalCapacity || '-'} />
                  <InfoRow label="رقم مدني الممثل" value={contract.tenant.repCivilId || '-'} />
                  <InfoRow label="جنسية الممثل" value={contract.tenant.repNationality || '-'} />
                </>
              )}
              {contract.tenant.tenantType === 'INDIVIDUAL' && (
                <>
                  <InfoRow label="الرقم المدني" value={contract.tenant.civilId || '-'} />
                  <InfoRow label="الجنسية" value={contract.tenant.nationality || '-'} />
                  <InfoRow label="عنوان العمل" value={contract.tenant.workAddress || '-'} className="col-span-2" />
                </>
              )}
              <InfoRow label="الهاتف" value={contract.tenant.phone || contract.tenant.repPhone || '-'} />
            </CardContent>
          </Card>

          {/* المالية */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">المعلومات المالية</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="الإيجار الشهري" value={`${contract.monthlyRent.toLocaleString('ar-KW')} د.ك`} highlight />
              <InfoRow label="بالحروف" value={contract.monthlyRentText || '-'} />
              {contract.deposit > 0 && <InfoRow label="مبلغ التأمين" value={`${contract.deposit.toLocaleString('ar-KW')} د.ك`} />}
              {contract.advance > 0 && <InfoRow label="مقدم الأجرة" value={`${contract.advance.toLocaleString('ar-KW')} د.ك`} />}
            </CardContent>
          </Card>

          {/* العقار */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">بيانات العقار</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="الوحدة" value={contract.unitNumber || '-'} />
              <InfoRow label="الدور" value={contract.floor || '-'} />
              <InfoRow label="المنطقة" value={contract.propertyZone || '-'} />
              <InfoRow label="القطعة" value={contract.propertySection || '-'} />
              <InfoRow label="القسيمة" value={contract.propertyBlock || '-'} />
              <InfoRow label="الشارع" value={contract.propertyStreet || '-'} />
              <InfoRow label="الرقم الآلي" value={contract.autoNumber || '-'} />
              {contract.businessPurpose && <InfoRow label="الغرض" value={contract.businessPurpose} />}
            </CardContent>
          </Card>

          {/* الكهرباء والماء */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <Droplets className="w-4 h-4 text-blue-500" />
                الكهرباء والماء
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900">
                {utilityText.text}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== معاينة العقد ===== */}
        <TabsContent value="preview">
          <Card>
            <CardContent className="p-6">
              <div dir="rtl" className="font-serif text-sm leading-relaxed space-y-4"
                style={{ fontFamily: "'Traditional Arabic', 'Cairo', serif" }}>
                <h2 className="text-xl font-bold text-center border-b pb-3">
                  {CONTRACT_TYPE_LABELS[contract.type]}
                </h2>
                <p className="text-right">بتاريخ: {formatContractDate(new Date(contract.creationDate))}</p>
                <div className="space-y-2">
                  <p><strong>الطرف الأول (المؤجر):</strong> {contract.company.nameAr} ويمثلها {contract.company.representativeName}</p>
                  <p><strong>الطرف الثاني (المستأجر):</strong> {tenantName}</p>
                </div>
                <Separator />
                <div className="space-y-4">
                  {contract.clausesSnapshot?.map((clause) => (
                    <div key={clause.number}>
                      <p className="font-bold">{clause.number}- {clause.titleAr || ''}</p>
                      <p className="text-justify pr-4 leading-loose mt-1">{clause.contentAr}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-12 flex justify-between pt-8">
                  <div className="text-center"><p className="font-bold mb-8">الطرف الأول</p><div className="border-b w-36" /></div>
                  <div className="text-center"><p className="font-bold mb-8">الطرف الثاني</p><div className="border-b w-36" /></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== الملحقات ===== */}
        <TabsContent value="addendums" className="space-y-4">
          {/* إضافة ملحق */}
          <div className="flex gap-2 flex-wrap">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 ml-1" /> ملحق تعديل بنود
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>إضافة ملحق تعديل</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-gray-500">
                    سيتم استيراد بيانات العقد تلقائياً. أدخل نص التعديل المطلوب:
                  </p>
                  <div className="space-y-1">
                    <Label>نص التعديل (ثانياً)</Label>
                    <Textarea
                      value={amendmentText}
                      onChange={(e) => setAmendmentText(e.target.value)}
                      placeholder="تم الاتفاق على تغيير... / إضافة بند..."
                      rows={5}
                      dir="rtl"
                    />
                  </div>
                  <Button
                    onClick={() => handleAddAmendment('AMENDMENT')}
                    disabled={!amendmentText.trim() || isAddingAmendment}
                    className="w-full"
                  >
                    {isAddingAmendment ? 'جاري الإضافة...' : 'إضافة الملحق'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {contract.type === 'RESIDENTIAL' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddAmendment('HANDOVER')}
                disabled={isAddingAmendment}
              >
                <Plus className="w-4 h-4 ml-1" /> ملحق استلام شقة
              </Button>
            )}

            {contract.type === 'COMMERCIAL_OFFICE' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddAmendment('COMMITMENT')}
                disabled={isAddingAmendment}
              >
                <Plus className="w-4 h-4 ml-1" /> إقرار وتعهد
              </Button>
            )}
          </div>

          {/* قائمة الملحقات */}
          {contract.addendums.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">لا توجد ملحقات حتى الآن</p>
              </CardContent>
            </Card>
          ) : (
            contract.addendums.map((addendum) => (
              <Card key={addendum.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Badge variant="outline">{ADDENDUM_LABELS[addendum.type]}</Badge>
                      <p className="text-sm text-gray-500">{formatShortDate(new Date(addendum.creationDate))}</p>
                      {addendum.content && (
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">{addendum.content}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm"
                        onClick={() => handleExport('pdf')}>
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm"
                        onClick={() => handleExport('word')}>
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoRow({ label, value, className = '', highlight = false }: {
  label: string; value: string; className?: string; highlight?: boolean
}) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`font-medium ${highlight ? 'text-green-700 text-base' : 'text-gray-800'}`}>{value}</p>
    </div>
  )
}
