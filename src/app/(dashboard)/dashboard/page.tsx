'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Users, Plus, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { formatShortDate } from '@/lib/date-utils'
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_COLORS, CONTRACT_STATUS_LABELS } from '@/types/contract'

interface Stats {
  total: number
  active: number
  expiringSoon: number
  expired: number
  totalRent: number
  recentContracts: Array<{
    id: string; type: string; status: string
    endDate: string; monthlyRent: number
    tenant: { tenantName?: string; companyName?: string; tenantType: string }
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/dashboard?companyId=company-id')
      .then(r => r.json())
      .then(setStats)
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-sm text-gray-500 mt-1">{formatShortDate(new Date())}</p>
        </div>
        <Link href="/contracts/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 ml-2" /> عقد جديد
          </Button>
        </Link>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<FileText className="w-5 h-5 text-blue-500" />}
          label="إجمالي العقود" value={stats?.total ?? '-'} color="blue" />
        <StatCard icon={<CheckCircle className="w-5 h-5 text-green-500" />}
          label="عقود سارية" value={stats?.active ?? '-'} color="green" />
        <StatCard icon={<Clock className="w-5 h-5 text-amber-500" />}
          label="تنتهي قريباً" value={stats?.expiringSoon ?? '-'} color="amber" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
          label="إجمالي الإيجار/شهر"
          value={stats ? `${stats.totalRent.toLocaleString('ar-KW')} د.ك` : '-'}
          color="purple" />
      </div>

      {/* العقود الأخيرة */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">آخر العقود</h2>
          <Link href="/contracts" className="text-sm text-blue-600 hover:underline">عرض الكل</Link>
        </div>

        {!stats ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : stats.recentContracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2" />
              <p>لا توجد عقود بعد</p>
              <Link href="/contracts/new">
                <Button size="sm" className="mt-3">إنشاء أول عقد</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {stats.recentContracts.map(c => {
              const name = c.tenant.tenantType === 'COMPANY' ? c.tenant.companyName : c.tenant.tenantName
              const isExpiringSoon = new Date(c.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              return (
                <Link key={c.id} href={`/contracts/${c.id}`}>
                  <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{name}</p>
                          <p className="text-xs text-gray-500">
                            {CONTRACT_TYPE_LABELS[c.type as keyof typeof CONTRACT_TYPE_LABELS]}
                          </p>
                        </div>
                      </div>
                      <div className="text-left shrink-0 space-y-1">
                        <p className="font-semibold text-sm text-green-700">{c.monthlyRent.toLocaleString('ar-KW')} د.ك</p>
                        <div className="flex items-center gap-1">
                          {isExpiringSoon && c.status === 'ACTIVE' && (
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                          )}
                          <Badge className={`text-xs ${CONTRACT_STATUS_COLORS[c.status as keyof typeof CONTRACT_STATUS_COLORS]}`}>
                            {CONTRACT_STATUS_LABELS[c.status as keyof typeof CONTRACT_STATUS_LABELS]}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string | number; color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50', green: 'bg-green-50', amber: 'bg-amber-50', purple: 'bg-purple-50'
  }
  return (
    <Card>
      <CardContent className={`p-4 ${colors[color]} rounded-lg`}>
        <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-500">{label}</span></div>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </CardContent>
    </Card>
  )
}
