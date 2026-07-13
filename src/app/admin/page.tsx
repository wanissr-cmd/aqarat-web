'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, Building2 } from 'lucide-react'

type Company = {
  id: string
  nameAr: string
  nameEn: string | null
  representativeName: string
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  canEditTemplates: boolean
  createdAt: string
  approvedAt: string | null
  users: { email: string; name: string }[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-800' },
  APPROVED: { label: 'معتمدة', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'مرفوضة', color: 'bg-red-100 text-red-800' },
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('PENDING')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchCompanies = async (status: string) => {
    setLoading(true)
    try {
      const url = status === 'ALL' ? '/api/admin/companies' : `/api/admin/companies?status=${status}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('فشل جلب البيانات')
      const data = await res.json()
      setCompanies(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies(filter)
  }, [filter])

  const handleDecision = async (companyId: string, decision: 'APPROVE' | 'REJECT') => {
    setActionLoading(companyId)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      if (!res.ok) throw new Error('فشل تنفيذ القرار')
      await fetchCompanies(filter)
    } catch (err) {
      console.error(err)
      alert('حدث خطأ، حاول مرة أخرى')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">إدارة الشركات</h1>
      <p className="text-sm text-gray-500 mb-6">مراجعة طلبات الانضمام والموافقة عليها</p>

      <div className="flex gap-2 mb-6">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            {status === 'PENDING' && 'قيد المراجعة'}
            {status === 'APPROVED' && 'معتمدة'}
            {status === 'REJECTED' && 'مرفوضة'}
            {status === 'ALL' && 'الكل'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">لا توجد شركات في هذا القسم</p>
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map((company) => {
            const status = STATUS_LABELS[company.approvalStatus]
            return (
              <div
                key={company.id}
                className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{company.nameAr}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    الممثل: {company.representativeName}
                    {company.users[0] && ` · ${company.users[0].email}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    <Clock className="w-3 h-3 inline ml-1" />
                    {new Date(company.createdAt).toLocaleDateString('ar-EG')}
                  </p>
                </div>

                {company.approvalStatus === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecision(company.id, 'APPROVE')}
                      disabled={actionLoading === company.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      موافقة
                    </button>
                    <button
                      onClick={() => handleDecision(company.id, 'REJECT')}
                      disabled={actionLoading === company.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      رفض
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
