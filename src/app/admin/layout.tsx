import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import { getCurrentUser } from '@/lib/auth-helpers'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // ✅ حماية: بس SUPER_ADMIN يقدر يدخل أي صفحة تحت /admin
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <header className="bg-slate-900 border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">لوحة تحكم مدير النظام</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  )
}
