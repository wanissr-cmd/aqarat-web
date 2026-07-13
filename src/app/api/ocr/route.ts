export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyId } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    // ✅ الإصلاح: تأكد إن المستخدم مسجل دخول قبل استهلاك رصيد Google Vision API
    // ده مش بيلمس بيانات شركة تانية، لكنه بيمنع أي حد غريب من استنزاف الرصيد المدفوع
    await requireCompanyId()

    const formData = await req.formData()
    const image = formData.get('image') as File

    if (!image) {
      return NextResponse.json({ error: 'لم يتم إرسال صورة' }, { status: 400 })
    }

    const bytes = await image.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [
                { type: 'DOCUMENT_TEXT_DETECTION' },
              ],
              imageContext: { languageHints: ['ar', 'en'] },
            },
          ],
        }),
      }
    )

    const visionData = await visionResponse.json()

    if (!visionResponse.ok) {
      console.error('Vision API Error:', JSON.stringify(visionData))
      return NextResponse.json({ error: 'خطأ في الاتصال بخدمة OCR', details: visionData }, { status: 502 })
    }

    const fullText: string = visionData.responses?.[0]?.fullTextAnnotation?.text || ''

    if (!fullText) {
      console.warn('OCR Warning: No text detected in image.')
      return NextResponse.json({ error: 'لم يتم التعرف على أي نص في الصورة' }, { status: 422 })
    }

    const extracted = extractKuwaitIDData(fullText)

    return NextResponse.json({ success: true, data: extracted, rawText: fullText })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح - يرجى تسجيل الدخول' }, { status: 401 })
    }
    console.error('OCR Process Error:', error)
    return NextResponse.json({ error: 'فشل النظام في معالجة الصورة', details: (error as Error).message }, { status: 500 })
  }
}

function extractKuwaitIDData(text: string) {
  const result: {
    civilId?: string
    fullName?: string
    namePart1?: string
    namePart2?: string
    namePart3?: string
    namePart4?: string
    nationality?: string
    companyName?: string
  } = {}

  const civilIdMatch = text.match(/\b\d{12}\b/)
  if (civilIdMatch) result.civilId = civilIdMatch[0]

  const nationalityPatterns = [/الجنسية[:\s]+([^\n]+)/, /Nationality[:\s]+([^\n]+)/i]
  for (const pattern of nationalityPatterns) {
    const match = text.match(pattern)
    if (match) {
      result.nationality = match[1].trim()
      break
    }
  }

  const companyMatch = text.match(/اسم المنشأة[:\s]+([^\n]+)/)
  if (companyMatch) result.companyName = companyMatch[1].trim()

  const namePatterns = [/الاسم[:\s]+([^\n]+)/, /Name[:\s]+([^\n]+)/i, /Full Name[:\s]+([^\n]+)/i]
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match) {
      const nameLine = match[1].trim()
      result.fullName = nameLine
      const parts = nameLine.split(/\s+/).filter(Boolean)
      if (parts.length > 0) result.namePart1 = parts[0]
      if (parts.length > 1) result.namePart2 = parts[1]
      if (parts.length > 2) result.namePart3 = parts[2]
      if (parts.length > 3) result.namePart4 = parts.slice(3).join(' ')
      break
    }
  }

  return result
}