import { XCircle } from 'lucide-react'

export default function RegistrationRejectedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl border shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">تعذر قبول الطلب</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          نأسف، لم يتم قبول طلب تسجيل شركتك في الوقت الحالي.
          للاستفسار، يرجى التواصل معنا مباشرة.
        </p>
      </div>
    </div>
  )
}
