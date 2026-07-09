'use client'
import { create } from 'zustand'
import { getDefaultCreationDate, getDefaultStartDate, calculateEndDate } from '@/lib/date-utils'
import type { NewContractForm, ContractType, TenantType, UtilityParty, ResidentialPurpose } from '@/types/contract'
import { defaultContractForm } from '@/types/contract'

interface ContractStore {
  form: NewContractForm
  step: number
  isSubmitting: boolean

  // Actions
  setStep: (step: number) => void
  setField: <K extends keyof NewContractForm>(key: K, value: NewContractForm[K]) => void
  setType: (type: ContractType) => void
  setDuration: (years: number) => void
  setStartDate: (date: Date) => void
  setCreationDate: (date: Date) => void
  setTenantType: (type: TenantType) => void
  setOcrData: (data: Partial<NewContractForm>) => void
  resetForm: () => void
}

const initForm = (): NewContractForm => {
  const today = getDefaultCreationDate()
  const startDate = getDefaultStartDate(today)
  const endDate = calculateEndDate(startDate, 1)
  return {
    ...defaultContractForm,
    creationDate: today,
    startDate,
    endDate,
  }
}

export const useContractStore = create<ContractStore>((set, get) => ({
  form: initForm(),
  step: 1,
  isSubmitting: false,

  setStep: (step) => set({ step }),

  setField: (key, value) =>
    set((state) => ({ form: { ...state.form, [key]: value } })),

  setType: (type) =>
    set((state) => ({ form: { ...state.form, type } })),

  // عند تغيير المدة — نعيد حساب النهاية تلقائياً
  setDuration: (years) =>
    set((state) => ({
      form: {
        ...state.form,
        durationYears: years,
        endDate: calculateEndDate(state.form.startDate, years),
      },
    })),

  // عند تغيير البداية — نعيد حساب النهاية تلقائياً
  setStartDate: (date) =>
    set((state) => ({
      form: {
        ...state.form,
        startDate: date,
        endDate: calculateEndDate(date, state.form.durationYears),
      },
    })),

  setCreationDate: (date) =>
    set((state) => {
      const newStart = getDefaultStartDate(date)
      return {
        form: {
          ...state.form,
          creationDate: date,
          startDate: newStart,
          endDate: calculateEndDate(newStart, state.form.durationYears),
        },
      }
    }),

  setTenantType: (type) =>
    set((state) => ({ form: { ...state.form, tenantType: type } })),

  // استيراد بيانات OCR
  setOcrData: (data) =>
    set((state) => ({ form: { ...state.form, ...data } })),

  resetForm: () => set({ form: initForm(), step: 1 }),
}))
