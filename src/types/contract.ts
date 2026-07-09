// ===== أنواع البيانات الرئيسية =====

export type ContractType =
  | 'RESIDENTIAL'
  | 'INVESTMENT_SHOP'
  | 'INVESTMENT_APARTMENT'
  | 'COMMERCIAL_OFFICE'

export type TenantType = 'INDIVIDUAL' | 'COMPANY'
export type UtilityParty = 'OWNER' | 'TENANT'
export type ResidentialPurpose = 'FAMILY' | 'BACHELORS' | 'EMPLOYEES'
export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'RENEWED' | 'CANCELLED'
export type AddendumType = 'HANDOVER' | 'AMENDMENT' | 'COMMITMENT'

// ===== البيانات الكاملة للعقد =====
export interface ContractData {
  type: ContractType
  tenantType: TenantType

  // التواريخ
  creationDate: string   // ISO string
  startDate: string
  endDate: string
  durationYears: number
  durationText?: string

  // الطرف الأول
  ownerCompany: string
  ownerRep: string

  // الطرف الثاني — فرد
  tenantName?: string
  tenantNationality?: string
  tenantCivilId?: string
  tenantPhone?: string
  tenantWorkAddress?: string

  // الطرف الثاني — شركة
  tenantCompanyName?: string
  tenantRepName?: string
  tenantRepCivilId?: string
  tenantRepNationality?: string
  tenantLegalCapacity?: string
  tenantLegalDoc?: string
  tenantLegalDocDate?: string
  tenantCompanyAddress?: string
  tenantRepPhone?: string

  // الخيارات
  hasGuarantor: boolean

  // العقار
  propertyBlock?: string
  propertyZone?: string
  propertySection?: string
  propertyStreet?: string
  propertyAlley?: string
  unitNumber?: string
  floor?: string
  autoNumber?: string

  // المالية
  monthlyRent: number
  monthlyRentText?: string
  deposit?: number
  advance?: number
  advanceText?: string
  paymentStartDate?: string

  // فترة السماح
  hasGracePeriod: boolean
  gracePeriodStart?: string
  gracePeriodEnd?: string
  gracePeriodText?: string

  // الكهرباء والماء
  electricityOn: UtilityParty
  waterOn: UtilityParty

  // السكني
  residentialPurpose?: ResidentialPurpose
  occupantsCount?: number
  occupantsCompany?: string

  // التجاري
  businessPurpose?: string
  activationPeriod?: number
}

// ===== البند المبني =====
export interface BuiltClause {
  id: string
  number: number
  titleAr: string | null
  contentAr: string
  contentEn: string | null
}

// ===== نص الكهرباء والماء =====
export interface UtilityText {
  text: string
  isSingle: boolean
}

// ===== نموذج إنشاء عقد جديد =====
export interface NewContractForm {
  // الخطوة 1: نوع العقد
  type: ContractType | ''

  // الخطوة 2: التواريخ
  creationDate: Date
  startDate: Date
  durationYears: number
  endDate: Date // محسوب تلقائياً

  // الخطوة 3: بيانات المستأجر
  tenantType: TenantType
  // فرد
  tenantName: string
  tenantNationality: string
  tenantCivilId: string
  tenantPhone: string
  tenantWorkAddress: string
  // شركة
  tenantCompanyName: string
  tenantRepName: string
  tenantRepCivilId: string
  tenantRepNationality: string
  tenantLegalCapacity: string
  tenantLegalDoc: string
  tenantLegalDocDate: Date | null
  tenantCompanyAddress: string
  tenantRepPhone: string
  hasGuarantor: boolean

  // الخطوة 4: العقار
  propertyBlock: string
  propertyZone: string
  propertySection: string
  propertyStreet: string
  propertyAlley: string
  unitNumber: string
  floor: string
  autoNumber: string

  // الخطوة 5: المالية والشروط
  monthlyRent: number
  monthlyRentText: string
  deposit: number
  advance: number
  advanceText: string
  hasGracePeriod: boolean
  gracePeriodStart: Date | null
  gracePeriodEnd: Date | null
  gracePeriodText: string
  paymentStartDate: Date | null
  electricityOn: UtilityParty
  waterOn: UtilityParty

  // السكني فقط
  residentialPurpose: ResidentialPurpose | ''
  occupantsCount: number
  occupantsCompany: string

  // التجاري فقط
  businessPurpose: string
  activationPeriod: number
}

// ===== القيم الافتراضية =====
export const defaultContractForm: NewContractForm = {
  type: '',
  creationDate: new Date(),
  startDate: new Date(),
  durationYears: 1,
  endDate: new Date(),
  tenantType: 'INDIVIDUAL',
  tenantName: '',
  tenantNationality: '',
  tenantCivilId: '',
  tenantPhone: '',
  tenantWorkAddress: '',
  tenantCompanyName: '',
  tenantRepName: '',
  tenantRepCivilId: '',
  tenantRepNationality: '',
  tenantLegalCapacity: '',
  tenantLegalDoc: '',
  tenantLegalDocDate: null,
  tenantCompanyAddress: '',
  tenantRepPhone: '',
  hasGuarantor: false,
  propertyBlock: '',
  propertyZone: '',
  propertySection: '',
  propertyStreet: '',
  propertyAlley: '',
  unitNumber: '',
  floor: '',
  autoNumber: '',
  monthlyRent: 0,
  monthlyRentText: '',
  deposit: 0,
  advance: 0,
  advanceText: '',
  hasGracePeriod: false,
  gracePeriodStart: null,
  gracePeriodEnd: null,
  gracePeriodText: '',
  paymentStartDate: null,
  electricityOn: 'TENANT',
  waterOn: 'TENANT',
  residentialPurpose: '',
  occupantsCount: 0,
  occupantsCompany: '',
  businessPurpose: '',
  activationPeriod: 1,
}

// ===== أسماء أنواع العقود =====
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  RESIDENTIAL: 'عقد إيجار سكني',
  INVESTMENT_SHOP: 'عقد استثمار محل',
  INVESTMENT_APARTMENT: 'عقد استثمار شقة',
  COMMERCIAL_OFFICE: 'عقد إيجار مكتب تجاري',
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'مسودة',
  ACTIVE: 'ساري',
  EXPIRED: 'منتهي',
  RENEWED: 'مجدد',
  CANCELLED: 'ملغي',
}

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  RENEWED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-orange-100 text-orange-700',
}
