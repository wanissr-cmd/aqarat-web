import { Clock } from 'lucide-react'

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl border shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">طلبك قيد المراجعة</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          تم استلام طلب تسجيل شركتك بنجاح، وهو الآن قيد المراجعة من فريقنا.
          سيتم التواصل معك قريباً بمجرد اعتماد الحساب.
        </p>
      </div>
    </div>
  )
}
