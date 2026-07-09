'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Save, CheckCircle } from 'lucide-react'

interface CompanySettings {
  nameAr: string
  nameEn: string
  representativeName: string
  logo?: string | null
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>({
    nameAr: '', nameEn: '', representativeName: '', logo: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) setSettings(data)
      })
  }, [])

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSettings({ ...settings, logo: reader.result })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">إعدادات الشركة</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-5 h-5 text-blue-500" />
            بيانات الطرف الأول
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>اسم الشركة بالعربي *</Label>
            <Input
              value={settings.nameAr}
              onChange={e => setSettings({ ...settings, nameAr: e.target.value })}
              placeholder="شركة سما كابيتال العالمية للاستثمار والتطوير العقاري"
              dir="rtl"
            />
            <p className="text-xs text-gray-400">يظهر في رأس جميع العقود كـ "الطرف الأول"</p>
          </div>

          <div className="space-y-1">
            <Label>اسم الشركة بالإنجليزي</Label>
            <Input
              value={settings.nameEn}
              onChange={e => setSettings({ ...settings, nameEn: e.target.value })}
              placeholder="Sama Capital International"
              dir="ltr"
            />
          </div>

          <div className="space-y-1">
            <Label>اسم الممثل القانوني *</Label>
            <Input
              value={settings.representativeName}
              onChange={e => setSettings({ ...settings, representativeName: e.target.value })}
              placeholder="عبدالله محمد العمر"
              dir="rtl"
            />
            <p className="text-xs text-gray-400">يظهر في العقد: "ويمثلها في هذا العقد السيد/ ..."</p>
          </div>

          <div className="space-y-1">
            <Label>شعار الشركة</Label>
            {settings.logo ? (
              <img
                src={settings.logo}
                alt="شعار الشركة"
                className="h-24 w-full object-contain rounded-lg border border-gray-200 bg-white"
              />
            ) : (
              <div className="h-24 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-500">
                لم يتم رفع شعار بعد
              </div>
            )}
            <Input type="file" accept="image/*" onChange={handleLogoChange} />
            <p className="text-xs text-gray-400">يمكن رفع شعار الشركة وسيتم حفظه ضمن إعدادات الشركة.</p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || !settings.nameAr || !settings.representativeName}
            className="w-full"
          >
            {saved ? (
              <><CheckCircle className="w-4 h-4 ml-2 text-green-300" /> تم الحفظ</>
            ) : isSaving ? 'جاري الحفظ...' : (
              <><Save className="w-4 h-4 ml-2" /> حفظ الإعدادات</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
