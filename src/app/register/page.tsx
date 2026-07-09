'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '', password: '', companyNameAr: '', representativeName: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'حدث خطأ')
      setIsLoading(false)
      return
    }

    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-xl">إنشاء حساب شركة جديدة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <Label>اسم الشركة</Label>
              <Input
                value={form.companyNameAr}
                onChange={(e) => setForm({ ...form, companyNameAr: e.target.value })}
                placeholder="شركة سما كابيتال العالمية"
                dir="rtl"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>اسم الممثل القانوني</Label>
              <Input
                value={form.representativeName}
                onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
                placeholder="عبدالله فيصل بورسلي"
                dir="rtl"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>كلمة المرور</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                dir="ltr"
                minLength={6}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
            )}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}