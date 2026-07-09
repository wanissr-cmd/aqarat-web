import {
  formatContractDate, formatShortDate, formatMonthYear,
  yearsToArabicText, numberToArabicText, calculateEndDate
} from './date-utils'
import type { ContractData, BuiltClause, UtilityText } from '@/types/contract'

// ===== محرك العقود =====
// المسؤول عن: بناء البنود، الترقيم الديناميكي، استبدال المتغيرات

// ===== منطق الكهرباء والماء =====
export function buildUtilityText(electricityOn: 'OWNER' | 'TENANT', waterOn: 'OWNER' | 'TENANT'): UtilityText {
  const ownerLabel = 'الطرف الأول'
  const tenantLabel = 'الطرف الثاني'

  const elec = electricityOn === 'OWNER' ? ownerLabel : tenantLabel
  const water = waterOn === 'OWNER' ? ownerLabel : tenantLabel

  if (electricityOn === waterOn) {
    // الاثنان على نفس الطرف — جملة واحدة
    return {
      text: `يتحمل ${elec} قيمة استهلاك الكهرباء والمياه`,
      isSingle: true
    }
  } else {
    // منفصلان — جملتان
    return {
      text: `يكون استهلاك الكهرباء على نفقة ${elec} واستهلاك المياه على نفقة ${water}`,
      isSingle: false
    }
  }
}

// ===== استبدال المتغيرات في نص البند =====
export function replacePlaceholders(text: string, data: ContractData): string {
  const replacements: Record<string, string> = {
    // التواريخ
    '{{creationDay}}': formatContractDate(new Date(data.creationDate)).split(' ')[0],
    '{{creationDate}}': formatContractDate(new Date(data.creationDate)),
    '{{startDate}}': formatShortDate(new Date(data.startDate)),
    '{{endDate}}': formatShortDate(new Date(data.endDate)),
    '{{startDateFull}}': formatContractDate(new Date(data.startDate)),
    '{{endDateFull}}': formatContractDate(new Date(data.endDate)),

    // المدة
    '{{durationYears}}': String(data.durationYears),
    '{{durationText}}': yearsToArabicText(data.durationYears),

    // الطرف الأول
    '{{ownerCompany}}': data.ownerCompany,
    '{{ownerRep}}': data.ownerRep,

    // الطرف الثاني — فرد
    '{{tenantName}}': data.tenantName || '',
    '{{tenantNationality}}': data.tenantNationality || '',
    '{{tenantCivilId}}': data.tenantCivilId || '',
    '{{tenantPhone}}': data.tenantPhone || '',
    '{{tenantWorkAddress}}': data.tenantWorkAddress || '',

    // الطرف الثاني — شركة
    '{{tenantCompanyName}}': data.tenantCompanyName || '',
    '{{tenantRepName}}': data.tenantRepName || '',
    '{{tenantRepCivilId}}': data.tenantRepCivilId || '',
    '{{tenantRepNationality}}': data.tenantRepNationality || '',
    '{{tenantLegalCapacity}}': data.tenantLegalCapacity || '',
    '{{tenantLegalDoc}}': data.tenantLegalDoc || '',
    '{{tenantLegalDocDate}}': data.tenantLegalDocDate
      ? formatShortDate(new Date(data.tenantLegalDocDate)) : '',
    '{{tenantCompanyAddress}}': data.tenantCompanyAddress || '',

    // العقار
    '{{propertyBlock}}': data.propertyBlock || '',
    '{{propertyZone}}': data.propertyZone || '',
    '{{propertySection}}': data.propertySection || '',
    '{{propertyStreet}}': data.propertyStreet || '',
    '{{propertyAlley}}': data.propertyAlley || '',
    '{{unitNumber}}': data.unitNumber || '',
    '{{floor}}': data.floor || '',
    '{{autoNumber}}': data.autoNumber || '',

    // المالية
    '{{monthlyRent}}': data.monthlyRent.toLocaleString('ar-KW'),
    '{{monthlyRentText}}': data.monthlyRentText || numberToArabicText(data.monthlyRent),
    '{{deposit}}': data.deposit ? data.deposit.toLocaleString('ar-KW') : '',
    '{{advance}}': data.advance ? data.advance.toLocaleString('ar-KW') : '',
    '{{advanceText}}': data.advanceText || (data.advance ? numberToArabicText(data.advance) : ''),

    // فترة السماح
    '{{gracePeriodStart}}': data.gracePeriodStart
      ? formatShortDate(new Date(data.gracePeriodStart)) : '',
    '{{gracePeriodEnd}}': data.gracePeriodEnd
      ? formatShortDate(new Date(data.gracePeriodEnd)) : '',
    '{{gracePeriodText}}': (data.gracePeriodStart || data.gracePeriodEnd)
      ? `${data.gracePeriodStart ? formatShortDate(new Date(data.gracePeriodStart)) : ''}${data.gracePeriodStart && data.gracePeriodEnd ? ' - ' : ''}${data.gracePeriodEnd ? formatShortDate(new Date(data.gracePeriodEnd)) : ''}`
      : '',
    '{{paymentStartDate}}': data.paymentStartDate
      ? formatShortDate(new Date(data.paymentStartDate)) : '',

    // الكهرباء والماء
    '{{utilityText}}': buildUtilityText(data.electricityOn, data.waterOn).text,

    // السكني
    '{{residentialPurposeText}}': buildResidentialPurposeText(data),
    '{{occupantsCount}}': String(data.occupantsCount || ''),
    '{{occupantsCompany}}': data.occupantsCompany || '',

    // التجاري
    '{{businessPurpose}}': data.businessPurpose || '',
    '{{activationPeriod}}': String(data.activationPeriod || ''),

    // رقم العقد
    '{{contractNumber}}': '',
  }

  let result = text
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(key, value)
  }
  return result
}

// ===== نص الغرض السكني =====
function buildResidentialPurposeText(data: ContractData): string {
  switch (data.residentialPurpose) {
    case 'FAMILY':
      return 'سكن عائلي'
    case 'BACHELORS':
      return `سكن عزاب بحد أقصى ${data.occupantsCount || ''} أشخاص`
    case 'EMPLOYEES':
      return `سكن موظفي الشركة بحد أقصى ${data.occupantsCount || ''} أشخاص`
    default:
      return ''
  }
}

// ===== بناء البنود النشطة مع الترقيم الديناميكي =====
export function buildActiveClauses(
  clauses: Array<{
    id: string
    order: number
    titleAr: string | null
    contentAr: string
    contentEn: string | null
    isOptional: boolean
    conditionKey: string | null
    variables: unknown
  }>,
  data: ContractData
): BuiltClause[] {
  const active: BuiltClause[] = []
  let currentNumber = 1

  // ترتيب البنود
  const sorted = [...clauses].sort((a, b) => a.order - b.order)

  for (const clause of sorted) {
    // تأكد من نوعية العلم ونطبق منطق الظهور بشكل دفاعي
    const optional = !!clause.isOptional
    const conditionKey = clause.conditionKey ? String(clause.conditionKey).trim() : null

    // إذا كان البند اختيارياً ولديه شرط، قرّر الظهور حسب الشرط. البنود الغير اختياريّة تُعرض دائماً.
    if (optional && conditionKey) {
      const shouldShow = evaluateCondition(conditionKey, data)
      if (!shouldShow) continue
    }

    // استبدال المتغيرات
    const builtContent = replacePlaceholders(clause.contentAr, data)
    const builtContentEn = clause.contentEn
      ? replacePlaceholders(clause.contentEn, data)
      : null

    active.push({
      id: clause.id,
      number: currentNumber,
      titleAr: clause.titleAr || null,
      contentAr: builtContent,
      contentEn: builtContentEn,
    })

    currentNumber++
  }

  // If nothing passed the conditional checks but there are template clauses,
  // fall back to including all clauses (replace placeholders) so exports/preview
  // never produce an empty contract when a template exists.
  if (active.length === 0 && sorted.length > 0) {
    currentNumber = 1
    for (const clause of sorted) {
      const builtContent = replacePlaceholders(clause.contentAr, data)
      const builtContentEn = clause.contentEn ? replacePlaceholders(clause.contentEn, data) : null
      active.push({
        id: clause.id,
        number: currentNumber,
        titleAr: clause.titleAr || null,
        contentAr: builtContent,
        contentEn: builtContentEn,
      })
      currentNumber++
    }
  }

  return active
}

// ===== تقييم شروط إظهار البنود =====
function evaluateCondition(conditionKey: string, data: ContractData): boolean {
  switch (conditionKey) {
    case 'hasGracePeriod': {
      const v = (data as any).hasGracePeriod
      return v === true || v === 'true' || v === 1 || v === '1'
    }
    case 'hasGuarantor': {
      const v = (data as any).hasGuarantor
      return v === true || v === 'true' || v === 1 || v === '1'
    }
    case 'isCompanyTenant':
      return data.tenantType === 'COMPANY'
    case 'isIndividualTenant':
      return data.tenantType === 'INDIVIDUAL'
    case 'isBachelors':
      return data.residentialPurpose === 'BACHELORS'
    case 'isEmployees':
      return data.residentialPurpose === 'EMPLOYEES'
    case 'hasDeposit':
      return !!(data as any).deposit && Number((data as any).deposit) > 0
    case 'hasAdvance':
      return !!(data as any).advance && Number((data as any).advance) > 0
    default:
      return true
  }
}

// ===== بناء نص رأس العقد (الطرف الثاني) =====
export function buildSecondPartyHeader(data: ContractData): string {
  if (data.tenantType === 'INDIVIDUAL') {
    return `${data.tenantName}، الجنسية: ${data.tenantNationality}، بطاقة مدنية: ${data.tenantCivilId}، عنوان العمل: ${data.tenantWorkAddress}، تلفون: ${data.tenantPhone}`
  } else {
    const guarantorText = data.hasGuarantor ? ' وهو ضامن متضامن في هذا العقد' : ''
    return `شركة ${data.tenantCompanyName} ويمثلها في هذا العقد السيد/ ${data.tenantRepName}${guarantorText}، الجنسية: ${data.tenantRepNationality}، بطاقة مدنية: ${data.tenantRepCivilId}، بصفته ${data.tenantLegalCapacity} بموجب ${data.tenantLegalDoc} صادرة بتاريخ ${data.tenantLegalDocDate ? formatShortDate(new Date(data.tenantLegalDocDate)) : ''}`
  }
}

// ===== بناء نص الملحق المستمر =====
export function buildAmendmentText(contractData: ContractData, amendmentContent: string): string {
  return replacePlaceholders(amendmentContent, contractData)
}

// ===== بناء بنود افتراضية من بيانات النموذج (fallback عندما لا يتوفر قالب) =====
export function buildClausesFromForm(data: ContractData): BuiltClause[] {
  const clauses: BuiltClause[] = []
  let num = 1

  if (data.unitNumber || data.propertyZone) {
    clauses.push({
      id: `form-${num}`,
      number: num++,
      titleAr: 'العقار المؤجر',
      contentAr: `استأجر الطرف الثاني من الطرف الأول ${
        data.type === 'RESIDENTIAL' ? 'الشقة' :
        data.type === 'INVESTMENT_SHOP' ? 'المحل' :
        data.type === 'INVESTMENT_APARTMENT' ? 'الشقة' : 'المكتب'
      } رقم (${data.unitNumber || ''}) الدور ${data.floor || ''} الرقم الآلي (${data.autoNumber || ''}) في منطقة ${data.propertyZone || ''} قطعة (${data.propertySection || ''}) شارع ${data.propertyStreet || ''}.`,
      contentEn: null,
    })
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate).toLocaleDateString('en-GB')
    const end = new Date(data.endDate).toLocaleDateString('en-GB')
    clauses.push({
      id: `form-${num}`,
      number: num++,
      titleAr: 'مدة العقد',
      contentAr: `مدة هذا العقد ${data.durationYears || 1} ${data.durationYears === 1 ? 'سنة' : 'سنوات'} تبدأ من ${start} وتنتهي في ${end}.`,
      contentEn: null,
    })
  }

  if (data.hasGracePeriod && (data.gracePeriodStart || data.gracePeriodEnd)) {
    const graceStart = data.gracePeriodStart ? new Date(data.gracePeriodStart).toLocaleDateString('en-GB') : ''
    const graceEnd = data.gracePeriodEnd ? new Date(data.gracePeriodEnd).toLocaleDateString('en-GB') : ''
    const content = graceStart && graceEnd
      ? `فترة السماح من ${graceStart} وحتى ${graceEnd}.`
      : graceStart
        ? `فترة السماح ابتداءً من ${graceStart}.`
        : graceEnd
          ? `فترة السماح حتى ${graceEnd}.`
          : ''

    clauses.push({
      id: `form-${num}`,
      number: num++,
      titleAr: 'فترة السماح',
      contentAr: content,
      contentEn: null,
    })
  }

  if (data.monthlyRent) {
    clauses.push({
      id: `form-${num}`,
      number: num++,
      titleAr: 'الأجرة الشهرية',
      contentAr: `الأجرة الشهرية ${Number(data.monthlyRent).toLocaleString('ar-KW')} دينار كويتي (${data.monthlyRentText || ''}) تُدفع في مطلع كل شهر.`,
      contentEn: null,
    })
  }

  if (data.deposit && data.deposit > 0) {
    clauses.push({
      id: `form-${num}`,
      number: num++,
      titleAr: 'مبلغ التأمين',
      contentAr: `دفع الطرف الثاني مبلغ (${Number(data.deposit).toLocaleString('ar-KW')} د.ك) تأميناً لحسن استخدام العقار يُرد عند الإخلاء.`,
      contentEn: null,
    })
  }

  if (data.advance && data.advance > 0) {
    clauses.push({
      id: `form-${num}`,
      number: num++,
      titleAr: 'مقدم الأجرة',
      contentAr: `دفع الطرف الثاني مقدم أجرة بمبلغ (${Number(data.advance).toLocaleString('ar-KW')} د.ك) (${data.advanceText || ''}).`,
      contentEn: null,
    })
  }

  const elec = data.electricityOn === 'OWNER' ? 'الطرف الأول' : 'الطرف الثاني'
  const water = data.waterOn === 'OWNER' ? 'الطرف الأول' : 'الطرف الثاني'
  clauses.push({
    id: `form-${num}`,
    number: num++,
    titleAr: 'الكهرباء والماء',
    contentAr: data.electricityOn === data.waterOn
      ? `يتحمل ${elec} قيمة استهلاك الكهرباء والمياه.`
      : `يكون استهلاك الكهرباء على نفقة ${elec} واستهلاک المياه على نفقة ${water}.`,
    contentEn: null,
  })

  if (data.type === 'RESIDENTIAL' && data.residentialPurpose) {
    const purposeText = data.residentialPurpose === 'FAMILY' ? 'سكن عائلي' :
      data.residentialPurpose === 'BACHELORS' ? `سكن عزاب بحد أقصى ${data.occupantsCount || ''} أشخاص` :
      `سكن موظفي الشركة`
    clauses.push({
      id: `form-${num}`,
      number: num++,
      titleAr: 'الغرض من الإيجار',
      contentAr: `يُستخدم العقار المؤجر لغرض ${purposeText} فقط.`,
      contentEn: null,
    })
  }

  return clauses
}
