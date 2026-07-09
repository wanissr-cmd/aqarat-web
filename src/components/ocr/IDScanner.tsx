'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface OCRResult {
  civilId?: string
  fullName?: string
  namePart1?: string
  namePart2?: string
  namePart3?: string
  namePart4?: string
  nationality?: string
  companyName?: string
}

interface IDScannerProps {
  onDataExtracted: (data: OCRResult) => void
  label?: string
}

export function IDScanner({ onDataExtracted, label = 'مسح بطاقة الهوية' }: IDScannerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processImage = async (file: File) => {
    setIsLoading(true)
    setStatus('idle')
    setErrorMsg('')

    // معاينة الصورة
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/ocr', { method: 'POST', body: formData })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'فشل في القراءة')

      setStatus('success')
      onDataExtracted(result.data)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'فشل في قراءة الهوية')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">{label}</p>

      {/* منطقة السحب والإفلات */}
      <Card
        className={`border-2 border-dashed cursor-pointer transition-colors
          ${status === 'success' ? 'border-green-400 bg-green-50' : ''}
          ${status === 'error' ? 'border-red-400 bg-red-50' : ''}
          ${status === 'idle' ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          {preview ? (
            <img src={preview} alt="صورة الهوية" className="max-h-32 rounded object-contain" />
          ) : (
            <Upload className="w-10 h-10 text-gray-400" />
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">جاري قراءة الهوية...</span>
            </div>
          )}

          {status === 'success' && !isLoading && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">تم استخراج البيانات بنجاح</span>
            </div>
          )}

          {status === 'error' && !isLoading && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{errorMsg}</span>
            </div>
          )}

          {status === 'idle' && !isLoading && (
            <p className="text-sm text-gray-500 text-center">
              اضغط لرفع صورة الهوية أو اسحبها هنا
              <br />
              <span className="text-xs text-gray-400">JPG، PNG، حتى 20MB</span>
            </p>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*, application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-1"
        >
          <Upload className="w-4 h-4 ml-2" />
          رفع صورة
        </Button>

        {status !== 'idle' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatus('idle')
              setPreview(null)
              setErrorMsg('')
            }}
          >
            إعادة المسح
          </Button>
        )}
      </div>
    </div>
  )
}
