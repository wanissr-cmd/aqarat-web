import { format, addYears, addMonths, startOfMonth, parse } from 'date-fns'
import { ar } from 'date-fns/locale'

// الأشهر العربية
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

const ARABIC_DAYS = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
]

const ARABIC_NUMBERS: Record<number, string> = {
  1: 'سنة واحدة', 2: 'سنتين', 3: 'ثلاث سنوات', 4: 'أربع سنوات',
  5: 'خمس سنوات', 6: 'ست سنوات', 7: 'سبع سنوات', 8: 'ثماني سنوات',
  9: 'تسع سنوات', 10: 'عشر سنوات'
}

// تاريخ اليوم الافتراضي لإنشاء العقد
export function getDefaultCreationDate(): Date {
  return new Date()
}

// بداية الشهر اللاحق (الافتراضي لبداية العقد)
export function getDefaultStartDate(from: Date = new Date()): Date {
  return startOfMonth(addMonths(from, 1))
}

// حساب نهاية العقد من البداية + عدد السنين
export function calculateEndDate(startDate: Date, years: number): Date {
  const end = addYears(startDate, years)
  // نطرح يوم واحد — العقد ينتهي آخر يوم قبل تجديده
  end.setDate(end.getDate() - 1)
  return end
}

// تنسيق التاريخ للعقد: الاثنين 12 مايو 2025
export function formatContractDate(date: Date): string {
  const day = ARABIC_DAYS[date.getDay()]
  const dayNum = date.getDate()
  const month = ARABIC_MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${dayNum} ${month} ${year}`
}

// تنسيق التاريخ المختصر: 12/05/2025
export function formatShortDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

// اسم الشهر فقط: فبراير 2025
export function formatMonthYear(date: Date): string {
  return `${ARABIC_MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

// المدة بالحروف: ثلاث سنوات
export function yearsToArabicText(years: number): string {
  return ARABIC_NUMBERS[years] || `${years} سنوات`
}

// تحويل رقم إلى حروف عربية (للمبالغ)
export function numberToArabicText(num: number): string {
  // تبسيط — في الإنتاج استخدم مكتبة متخصصة
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة']
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون']
  const hundreds = ['', 'مئة', 'مئتان', 'ثلاثمئة', 'أربعمئة', 'خمسمئة', 'ستمئة', 'سبعمئة', 'ثمانمئة', 'تسعمئة']

  if (num === 0) return 'صفر'
  if (num < 0) return `سالب ${numberToArabicText(-num)}`

  let result = ''

  if (num >= 1000) {
    const thousands = Math.floor(num / 1000)
    result += thousands === 1 ? 'ألف ' : thousands === 2 ? 'ألفان ' : `${numberToArabicText(thousands)} آلاف `
    num %= 1000
  }

  if (num >= 100) {
    result += hundreds[Math.floor(num / 100)] + ' '
    num %= 100
  }

  if (num >= 20) {
    result += ones[num % 10] ? `${ones[num % 10]} و` : ''
    result += tens[Math.floor(num / 10)] + ' '
    num = 0
  } else if (num > 0) {
    result += ones[num] + ' '
  }

  return result.trim() + ' دينار كويتي'
}

// التحقق إن التاريخ صحيح
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime())
}

// حساب عدد الأيام بين تاريخين
export function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}