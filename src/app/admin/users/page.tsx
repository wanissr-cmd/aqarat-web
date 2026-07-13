'use client'

import { useEffect, useState } from 'react'
import { UserPlus, CheckCircle } from 'lucide-react'

type Company = {
  id: string
  nameAr: string
  approvalStatus: string
}

export default function AddUserPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    companyId: '',
    email: '',
    password: '',
    name: '',
    role: 'STAFF' as 'ADMIN' | 'STAFF',
  })

  useEffect(() => {
    fetch('/api/admin/companies?status=APPROVED')
      .then((res) => res.json())
      .then(setCompanies)
      .catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess(true)
      setForm({ companyId: form.companyId, email: '', password: '', name: '', role: 'STAFF' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">إضافة مستخدم جديد</h1>
      <p className="text-sm text-gray-500 mb-6">أضف حساب موظف أو مدير لشركة موجودة بالفعل</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الشركة</label>
          <select
            value={form.companyId}
            onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">اختر الشركة</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.nameAr}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الصلاحية</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as 'ADMIN' | 'STAFF' })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="STAFF">موظف (Staff)</option>
            <option value="ADMIN">مدير الشركة (Admin)</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        {success && (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            تم إنشاء الحساب بنجاح
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" />
          {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
        </button>
      </form>
    </div>
  )
}
