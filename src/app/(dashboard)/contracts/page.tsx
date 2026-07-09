'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, FileText, Filter } from 'lucide-react'
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from '@/types/contract'
import { formatShortDate } from '@/lib/date-utils'
import type { ContractStatus, ContractType } from '@/types/contract'

interface Contract {
  id: string
  type: ContractType
  status: ContractStatus
  startDate: string
  endDate: string
  monthlyRent: number
  unitNumber: string
  propertyZone: string
  tenant: {
    tenantName?: string
    companyName?: string
    tenantType: string
  }
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const fetchContracts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        companyId: 'company-id',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      })
      const res = await fetch(`/api/contracts?${params}`)
      const data = await res.json()
      setContracts(data.contracts || [])
      setTotal(data.pagination?.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchContracts() }, [search, statusFilter, typeFilter])

  const tenantDisplayName = (c: Contract) =>
    c.tenant.tenantType === 'COMPANY' ? c.tenant.companyName : c.tenant.tenantName

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      {/* الرأس */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">العقود</h1>
          <p className="text-sm text-gray-500 mt-1">{total} عقد إجمالاً</p>
        </div>
        <Link href="/contracts/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 ml-2" />
            عقد جديد
          </Button>
        </Link>
      </div>

      {/* الفلاتر */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث برقم العقد، اسم المستأجر، رقم الوحدة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">كل الحالات</SelectItem>
            {Object.entries(CONTRACT_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="نوع العقد" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">كل الأنواع</SelectItem>
            {Object.entries(CONTRACT_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* قائمة العقود */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mb-3" />
            <p className="font-medium">لا توجد عقود</p>
            <p className="text-sm mt-1">ابدأ بإنشاء عقد جديد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => (
            <Link key={contract.id} href={`/contracts/${contract.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-blue-700">{/* contract number removed */}</span>
                        <Badge className={`text-xs ${CONTRACT_STATUS_COLORS[contract.status]}`}>
                          {CONTRACT_STATUS_LABELS[contract.status]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {CONTRACT_TYPE_LABELS[contract.type]}
                        </Badge>
                      </div>
                      <p className="font-semibold truncate">{tenantDisplayName(contract)}</p>
                      <p className="text-sm text-gray-500">
                        {contract.unitNumber && `وحدة ${contract.unitNumber} · `}
                        {contract.propertyZone}
                      </p>
                    </div>
                    <div className="text-left shrink-0 space-y-1">
                      <p className="font-bold text-green-700">{contract.monthlyRent.toLocaleString('ar-KW')} د.ك</p>
                      <p className="text-xs text-gray-500">{formatShortDate(new Date(contract.startDate))}</p>
                      <p className="text-xs text-gray-400">حتى {formatShortDate(new Date(contract.endDate))}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
