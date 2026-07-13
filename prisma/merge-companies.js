// prisma/merge-companies.js
// سكريبت لمرة واحدة: يوحد الشركتين المكررتين
// - يخلي company-default هي الشركة الرسمية (فيها العقود الحقيقية)
// - يربط حسابك (authUserId) بيها
// - يوافق عليها
// - يحذف الشركة الفاضية المكررة (بعد التأكد إنها فاضية فعلاً)

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const REAL_COMPANY_ID = 'company-default' // الشركة اللي فيها العقود الحقيقية
const DUPLICATE_COMPANY_ID = 'cmr1tq5xg0000oois2li5ejvn' // الشركة الفاضية المكررة (من صورتك، تأكد إن الـ id مطابق)
const YOUR_EMAIL = 'waniss.r@gmail.com'

async function main() {
  // 1. هات بيانات المستخدم الحالي وشركته الفاضية
  const user = await prisma.user.findUnique({
    where: { email: YOUR_EMAIL },
    include: { company: true },
  })

  if (!user) {
    console.error(`❌ لم يتم العثور على مستخدم بالبريد: ${YOUR_EMAIL}`)
    return
  }

  console.log('=== المستخدم الحالي ===')
  console.log({ email: user.email, role: user.role, companyId: user.companyId })

  // 2. تأكد إن الشركة الحقيقية (company-default) موجودة فعلاً
  const realCompany = await prisma.company.findUnique({
    where: { id: REAL_COMPANY_ID },
    include: { _count: { select: { contracts: true, tenants: true, templates: true } } },
  })

  if (!realCompany) {
    console.error(`❌ لم يتم العثور على الشركة الحقيقية بالمعرف: ${REAL_COMPANY_ID}`)
    return
  }

  console.log('\n=== الشركة الحقيقية (فيها البيانات) ===')
  console.log({
    id: realCompany.id,
    nameAr: realCompany.nameAr,
    contracts: realCompany._count.contracts,
    tenants: realCompany._count.tenants,
    templates: realCompany._count.templates,
  })

  // 3. تأكد إن الشركة المكررة فاضية فعلاً قبل أي حذف (أمان إضافي)
  const duplicateCompany = await prisma.company.findUnique({
    where: { id: DUPLICATE_COMPANY_ID },
    include: { _count: { select: { contracts: true, tenants: true, templates: true } } },
  })

  if (duplicateCompany) {
    console.log('\n=== الشركة المكررة (المفروض تكون فاضية) ===')
    console.log({
      id: duplicateCompany.id,
      nameAr: duplicateCompany.nameAr,
      contracts: duplicateCompany._count.contracts,
      tenants: duplicateCompany._count.tenants,
      templates: duplicateCompany._count.templates,
    })

    if (
      duplicateCompany._count.contracts > 0 ||
      duplicateCompany._count.tenants > 0 ||
      duplicateCompany._count.templates > 0
    ) {
      console.error('\n❌ توقف: الشركة المكررة فيها بيانات فعلياً! لن يتم حذفها تلقائياً.')
      console.log('راجع البيانات يدوياً قبل المتابعة.')
      return
    }
  }

  // 4. اربط المستخدم بالشركة الحقيقية بدل الفاضية
  await prisma.user.update({
    where: { id: user.id },
    data: { companyId: REAL_COMPANY_ID },
  })
  console.log(`\n✅ تم ربط المستخدم بالشركة الحقيقية (${REAL_COMPANY_ID})`)

  // 5. وافق على الشركة الحقيقية ودمج بيانات authUserId
  await prisma.company.update({
    where: { id: REAL_COMPANY_ID },
    data: {
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: user.authUserId,
      authUserId: user.authUserId, // نقل الربط بحساب Supabase للشركة الصح
    },
  })
  console.log('✅ تم اعتماد الشركة الحقيقية وربطها بحسابك')

  // 6. احذف الشركة الفاضية المكررة (لو موجودة وفاضية فعلاً)
  if (duplicateCompany) {
    await prisma.company.delete({ where: { id: DUPLICATE_COMPANY_ID } })
    console.log('✅ تم حذف الشركة الفاضية المكررة')
  }

  console.log('\n=== الحالة النهائية ===')
  const final = await prisma.user.findUnique({
    where: { id: user.id },
    include: { company: true },
  })
  console.log({
    email: final?.email,
    role: final?.role,
    companyId: final?.companyId,
    companyName: final?.company?.nameAr,
    companyApprovalStatus: final?.company?.approvalStatus,
  })
}

main()
  .catch((e) => {
    console.error('❌ حصل خطأ:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })