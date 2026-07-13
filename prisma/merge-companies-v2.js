// prisma/merge-companies.js
// سكريبت لمرة واحدة: يدمج بيانات الشركة المكررة (cmr1tq5xg...) في الشركة الأصلية (company-default)
// - ينقل العقود، التمبلتات (لو مش عامة بالفعل)، المستأجرين، المستخدمين
// - يربط حسابك بـ company-default
// - يعتمدها
// - يحذف الشركة المكررة الفارغة بعد النقل

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const DUPLICATE_COMPANY_ID = 'cmr1tq5xg0000oois2li5ejvn' // الشركة المكررة (هنفرغها وننقل بياناتها)
const REAL_COMPANY_ID = 'company-default' // الشركة الرسمية اللي هتبقى موجودة
const YOUR_EMAIL = 'waniss.r@gmail.com'

async function main() {
  const duplicateCompany = await prisma.company.findUnique({
    where: { id: DUPLICATE_COMPANY_ID },
    include: {
      contracts: true,
      templates: true,
      tenants: true,
      users: true,
    },
  })

  const realCompany = await prisma.company.findUnique({
    where: { id: REAL_COMPANY_ID },
  })

  if (!duplicateCompany || !realCompany) {
    console.error('❌ لم يتم العثور على إحدى الشركتين. تحقق من الـ IDs.')
    return
  }

  console.log('=== قبل الدمج ===')
  console.log('الشركة المكررة:', {
    contracts: duplicateCompany.contracts.length,
    templates: duplicateCompany.templates.length,
    tenants: duplicateCompany.tenants.length,
    users: duplicateCompany.users.length,
  })

  // 1. انقل المستأجرين
  if (duplicateCompany.tenants.length > 0) {
    const result = await prisma.tenant.updateMany({
      where: { companyId: DUPLICATE_COMPANY_ID },
      data: { companyId: REAL_COMPANY_ID },
    })
    console.log(`✅ تم نقل ${result.count} مستأجر`)
  }

  // 2. انقل التمبلتات (فقط لو مش عامة أصلاً - لو isGlobal يبقى مشترك مسبقاً ومفيش داعي لنقله)
  for (const template of duplicateCompany.templates) {
    if (template.isGlobal) {
      console.log(`⏭️  تمبلت "${template.nameAr}" عام بالفعل (isGlobal)، لن يُنقل`)
    } else {
      await prisma.template.update({
        where: { id: template.id },
        data: { companyId: REAL_COMPANY_ID },
      })
      console.log(`✅ تم نقل تمبلت "${template.nameAr}"`)
    }
  }

  // 3. انقل العقود (لازم تكون بعد نقل المستأجرين والتمبلتات عشان الروابط تفضل صحيحة)
  if (duplicateCompany.contracts.length > 0) {
    const result = await prisma.contract.updateMany({
      where: { companyId: DUPLICATE_COMPANY_ID },
      data: { companyId: REAL_COMPANY_ID },
    })
    console.log(`✅ تم نقل ${result.count} عقد`)
  }

  // 4. المستخدمين: بدل ما ننقلهم، هنحدث المستخدم بتاعك تحديداً ونربطه بالشركة الصح
  const user = await prisma.user.findUnique({ where: { email: YOUR_EMAIL } })
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { companyId: REAL_COMPANY_ID },
    })
    console.log(`✅ تم ربط حسابك (${YOUR_EMAIL}) بالشركة الرسمية`)
  }

  // 5. اعتماد الشركة الرسمية ونقل ربط authUserId ليها
  // ✅ الإصلاح: لازم نفضي authUserId من الشركة المكررة الأول
  // عشان القيد الفريد (unique) يسمح بنقله للشركة الرسمية
  await prisma.company.update({
    where: { id: DUPLICATE_COMPANY_ID },
    data: { authUserId: null },
  })
  console.log('✅ تم تفريغ authUserId من الشركة المكررة')

  await prisma.company.update({
    where: { id: REAL_COMPANY_ID },
    data: {
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: user?.authUserId,
      authUserId: user?.authUserId,
    },
  })
  console.log('✅ تم اعتماد الشركة الرسمية')

  // 6. تحقق نهائي: هل الشركة المكررة فاضية تماماً دلوقتي؟
  const duplicateAfter = await prisma.company.findUnique({
    where: { id: DUPLICATE_COMPANY_ID },
    include: {
      _count: { select: { contracts: true, templates: true, tenants: true, users: true } },
    },
  })

  console.log('\n=== الشركة المكررة بعد النقل ===')
  console.log(duplicateAfter?._count)

  const isEmpty =
    duplicateAfter &&
    duplicateAfter._count.contracts === 0 &&
    duplicateAfter._count.tenants === 0 &&
    duplicateAfter._count.users === 0

  if (isEmpty) {
    // لو فيها لسه تمبلتات عامة (isGlobal) مربوطة بيها تاريخياً، فكها الأول
    await prisma.template.updateMany({
      where: { companyId: DUPLICATE_COMPANY_ID },
      data: { companyId: null },
    })

    await prisma.company.delete({ where: { id: DUPLICATE_COMPANY_ID } })
    console.log('✅ تم حذف الشركة المكررة الفارغة نهائياً')
  } else {
    console.log('⚠️  الشركة المكررة لسه فيها بيانات (مستخدمين على الأغلب)، لم يتم حذفها. راجعها يدوياً.')
  }

  console.log('\n=== الحالة النهائية ===')
  const final = await prisma.user.findUnique({
    where: { email: YOUR_EMAIL },
    include: { company: { include: { _count: { select: { contracts: true, tenants: true, templates: true } } } } },
  })
  console.log({
    email: final?.email,
    role: final?.role,
    companyId: final?.companyId,
    companyName: final?.company?.nameAr,
    approvalStatus: final?.company?.approvalStatus,
    totals: final?.company?._count,
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