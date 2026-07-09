import Link from 'next/link'
import { FileText, Users, LayoutTemplate, Settings, LayoutDashboard } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
  { href: '/contracts', icon: FileText, label: 'العقود' },
  { href: '/tenants', icon: Users, label: 'المستأجرون' },
  { href: '/templates', icon: LayoutTemplate, label: 'القوالب' },
  { href: '/settings', icon: Settings, label: 'الإعدادات' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-800">نظام العقود</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-gray-50">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="flex">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}