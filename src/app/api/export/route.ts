export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, AlignmentType, convertInchesToTwip, SectionType } from 'docx'
import { buildActiveClauses, buildClausesFromForm } from '@/lib/contract-engine'

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: 'عقد إيجار سكني',
  INVESTMENT_SHOP: 'عقد استثمار محل',
  INVESTMENT_APARTMENT: 'عقد استثمار شقة',
  COMMERCIAL_OFFICE: 'عقد إيجار مكتب تجاري',
}

function formatContractHeader(dateStr: string): string {
  const date = new Date(dateStr)
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  return `أنه في يوم (${days[date.getDay()]}) الموافق (${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}) حرر هذا العقد بين كل من:`
}

function toEnglishNumbers(str: string): string {
  return String(str).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

function arabicRun(text: string, bold = false, size = 26) {
  return new TextRun({
    text: toEnglishNumbers(text),
    bold, size,
    font: { name: 'Arial' },
    rightToLeft: true,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contractData, format, templateClauses, templateId } = body

    const { prisma } = await import('@/lib/prisma')

    let clausesToUse = Array.isArray(templateClauses) ? templateClauses : []

    if (clausesToUse.length === 0 && templateId) {
      clausesToUse = await prisma.templateClause.findMany({
        where: { templateId },
        orderBy: { order: 'asc' },
      })
    }

    if (clausesToUse.length === 0) {
      clausesToUse = buildClausesFromForm(contractData)
    }

    const activeClauses = buildActiveClauses(clausesToUse, contractData)
    const contractTitle = CONTRACT_TYPE_LABELS[contractData?.type] || 'عقد إيجار'
    const isInvestment = ['INVESTMENT_SHOP', 'INVESTMENT_APARTMENT', 'COMMERCIAL_OFFICE'].includes(contractData?.type)
    const contractSerial = ''

    const buildTenantText = () => {
      if (contractData?.tenantType === 'COMPANY') {
        const guarantor = contractData?.hasGuarantor ? ' (وهو ضامن متضامن في هذا العقد)' : ''
        return `شركة ${contractData?.tenantCompanyName || ''} ويمثلها السيد/ ${contractData?.tenantRepName || ''}${guarantor} - الجنسية: ${contractData?.tenantRepNationality || ''} - بطاقة مدنية: ${toEnglishNumbers(contractData?.tenantRepCivilId || '')}`
      }
      return `${contractData?.tenantName || ''} - الجنسية: ${contractData?.tenantNationality || ''} - بطاقة مدنية: ${toEnglishNumbers(contractData?.tenantCivilId || '')} - تلفون: ${toEnglishNumbers(contractData?.tenantPhone || '')}`
    }

    const dateHeader = contractData?.creationDate
      ? formatContractHeader(contractData.creationDate)
      : formatContractHeader(new Date().toISOString())

    if (format === 'word') {
      const paragraphs: Paragraph[] = []

      paragraphs.push(new Paragraph({ children: [arabicRun(contractTitle, true, 30)], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 100 } }))
      paragraphs.push(new Paragraph({ children: [arabicRun(dateHeader, false, 26)], alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 80 } }))
      paragraphs.push(new Paragraph({ children: [arabicRun('أولاً: ', true, 26), arabicRun(`${contractData?.ownerCompany || ''} (ذات الشخص الواحد)`, false, 26), arabicRun('   (الطرف الأول – المؤجر)', true, 26)], alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 60 } }))
      paragraphs.push(new Paragraph({ children: [arabicRun(`ويمثلها السيد/ ${contractData?.ownerRep || ''}`, false, 26)], alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 80 } }))
      paragraphs.push(new Paragraph({ children: [arabicRun('ثانياً: ', true, 26), arabicRun(buildTenantText(), false, 26), arabicRun('   (الطرف الثاني – المستأجر)', true, 26)], alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 80 } }))
      paragraphs.push(new Paragraph({ children: [arabicRun('بموجب هذا العقد تم الاتفاق على ما يلي:-', true, 26)], alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 80 } }))

      for (const clause of activeClauses) {
        if (!clause) continue
        if (isInvestment) {
          paragraphs.push(new Paragraph({
            children: [
              arabicRun(`البند ${clause.number} `, false, 26),
              clause.titleAr ? arabicRun(`(${clause.titleAr}): `, false, 26) : arabicRun('', false, 26),
              arabicRun(toEnglishNumbers(clause.contentAr || ''), false, 26),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 60, after: 60 },
          }))
        } else {
          paragraphs.push(new Paragraph({
            children: [arabicRun(`${clause.number}- `, false, 26), arabicRun(toEnglishNumbers(clause.contentAr || ''), false, 26)],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 60, after: 60 },
          }))
        }
      }

      paragraphs.push(new Paragraph({ children: [arabicRun('')], spacing: { before: 300, after: 0 } }))
      paragraphs.push(new Paragraph({ children: [arabicRun('الطرف الأول (المؤجر)', true, 26), arabicRun('                    ', false, 26), arabicRun('الطرف الثاني (المستأجر)', true, 26)], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 } }))
      paragraphs.push(new Paragraph({ children: [arabicRun('التوقيع: ________________', false, 26), arabicRun('                    ', false, 26), arabicRun('التوقيع: ________________', false, 26)], alignment: AlignmentType.CENTER }))

      const doc = new Document({
        sections: [{
          properties: { type: SectionType.CONTINUOUS, page: { margin: { top: convertInchesToTwip(1), right: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1) } } },
          children: paragraphs,
        }],
      })

      const buffer = await Packer.toBuffer(doc)
      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="contract.docx"; filename*=UTF-8''${encodeURIComponent(contractTitle)}.docx`,
        },
      })
    }

    if (format === 'pdf') {
      let clausesHTML = ''
      for (const c of activeClauses) {
        if (!c) continue
        if (isInvestment) {
          clausesHTML += `<p class="clause-inline"><span class="clause-num">البند ${c.number}-</span> ${c.titleAr ? `<strong>(${c.titleAr})</strong>: ` : ''}${toEnglishNumbers(c.contentAr || '')}</p>`
        } else {
          clausesHTML += `<p class="clause-inline"><span class="clause-num">${c.number}-</span> ${toEnglishNumbers(c.contentAr || '')}</p>`
        }
      }

      const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${contractTitle}</title>
  <style>
    @page { margin: 2.5cm 2cm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.3; color: #111; direction: rtl; }
    h1 { text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 6px; }
    .date-header { margin-bottom: 4px; }
    .party { margin-bottom: 3px; }
    .agreement { font-weight: bold; margin: 5px 0; }
    .clause-inline { margin-bottom: 3px; text-align: justify; }
    .clause-num { font-weight: bold; }
    .signatures { margin-top: 30px; display: flex; justify-content: space-between; }
    .sig-box { text-align: center; min-width: 200px; }
    .sig-line { border-bottom: 1px solid #333; margin: 20px auto 8px; width: 160px; }
    .no-print { text-align: center; margin-top: 20px; }
    .btn { padding: 8px 24px; font-size: 12pt; cursor: pointer; border: none; border-radius: 6px; }
    .btn-print { background: #2563eb; color: white; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>${contractSerial}${contractTitle}</h1>
  <p class="date-header">${dateHeader}</p>
  <p class="party"><strong>أولاً:</strong> ${contractData?.ownerCompany || ''} (ذات الشخص الواحد) <strong>(الطرف الأول – المؤجر)</strong></p>
  <p class="party">ويمثلها السيد/ ${contractData?.ownerRep || ''}</p>
  <p class="party"><strong>ثانياً:</strong> ${buildTenantText()} <strong>(الطرف الثاني – المستأجر)</strong></p>
  <p class="agreement">بموجب هذا العقد تم الاتفاق على ما يلي:-</p>
  ${clausesHTML}
  <div class="signatures">
    <div class="sig-box"><p><strong>الطرف الأول (المؤجر)</strong></p><div class="sig-line"></div><p>التوقيع</p></div>
    <div class="sig-box"><p><strong>الطرف الثاني (المستأجر)</strong></p><div class="sig-line"></div><p>التوقيع</p></div>
  </div>
  <div class="no-print">
    <button class="btn btn-print" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
  </div>
</body>
</html>`

      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    return NextResponse.json({ error: 'صيغة غير مدعومة' }, { status: 400 })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'حدث خطأ في التصدير: ' + String(error) }, { status: 500 })
  }
}
