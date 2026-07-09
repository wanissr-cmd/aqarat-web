'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, User, Building2, FileText, Phone, CreditCard } from 'lucide-react'
import { CONTRACT_STATUS_COLORS, CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS } from '@/types/contract'
import { formatShortDate } from '@/lib/date-utils'

interface Tenant {
  id: string
  tenantType: string
  tenantName?: string
  companyName?: string
  repName?: string
  civilId?: string
  repCivilId?: string
  nationality?: string
  phone?: string
  repPhone?: string
    contracts: Array<{
    id: string; type: string; status: string
    startDate: string; endDate: string; monthlyRent: number; unitNumber: string
  }>
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/tenants?companyId=company-default&search=${search}`)
      .then(r => r.json())
      .then(data => setTenants(Array.isArray(data) ? data : []))
      .finally(() => setIsLoading(false))
  }, [search])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">المستأجرون</h1>
          <p className="text-sm text-gray-500 mt-1">{tenants.length} مستأجر</p>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="بحث بالاسم أو الرقم المدني أو اسم الشركة..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : tenants.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <User className="w-10 h-10 mx-auto mb-2" />
            <p>لا يوجد مستأجرون</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tenants.map(tenant => {
            // ✅ الإصلاح: tenant.companyName بدل tenant.tenant?.companyName
            const name = tenant.tenantType === 'COMPANY' ? tenant.companyName : tenant.tenantName
            const civilId = tenant.tenantType === 'COMPANY' ? tenant.repCivilId : tenant.civilId
            const phone = tenant.tenantType === 'COMPANY' ? tenant.repPhone : tenant.phone
            const isOpen = expanded === tenant.id
            const activeContracts = (tenant.contracts || []).filter(c => c.status === 'ACTIVE')

            return (
              <Card key={tenant.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : tenant.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
                        ${tenant.tenantType === 'COMPANY' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                        {tenant.tenantType === 'COMPANY'
                          ? <Building2 className="w-4 h-4 text-purple-600" />
                          : <User className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div>
                        <p className="font-semibold">{name || '—'}</p>
                        {tenant.tenantType === 'COMPANY' && tenant.repName && (
                          <p className="text-xs text-gray-500">الممثل: {tenant.repName}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {civilId && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <CreditCard className="w-3 h-3" /> {civilId}
                            </span>
                          )}
                          {phone && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge variant="outline" className="text-xs">
                        <FileText className="w-3 h-3 ml-1" />
                        {(tenant.contracts || []).length} عقد
                      </Badge>
                      {activeContracts.length > 0 && (
                        <p className="text-xs text-green-600 mt-1">{activeContracts.length} ساري</p>
                      )}
                    </div>
                  </div>

                  {isOpen && (tenant.contracts || []).length > 0 && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <p className="text-xs font-semibold text-gray-500 mb-2">سجل العقود</p>
                      {tenant.contracts.map(c => (
                        <Link key={c.id} href={`/contracts/${c.id}`}>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-blue-700">{/* removed */}</span>
                              <span className="text-xs text-gray-500">
                                {CONTRACT_TYPE_LABELS[c.type as keyof typeof CONTRACT_TYPE_LABELS]}
                              </span>
                              {c.unitNumber && <span className="text-xs text-gray-400">وحدة {c.unitNumber}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {formatShortDate(new Date(c.startDate))} — {formatShortDate(new Date(c.endDate))}
                              </span>
                              <Badge className={`text-xs ${CONTRACT_STATUS_COLORS[c.status as keyof typeof CONTRACT_STATUS_COLORS]}`}>
                                {CONTRACT_STATUS_LABELS[c.status as keyof typeof CONTRACT_STATUS_LABELS]}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}