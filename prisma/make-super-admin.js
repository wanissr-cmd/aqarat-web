// prisma/make-super-admin.js
// سكريبت لمرة واحدة: يرقّي مستخدم معيّن (بالبريد الإلكتروني) إلى SUPER_ADMIN
// ويوافق تلقائياً على شركته (سما كابيتال) بما إنها الشركة الأولى في النظام

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ⚠️ غيّر القيمة دي للبريد الإلكتروني بتاع حسابك الحالي في النظام
const TARGET_EMAIL = 'waniss.r@gmail.com'

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    include: { company: true },
  })

  if (!user) {
    console.error(`❌ لم يتم العثور على مستخدم بالبريد: ${TARGET_EMAIL}`)
    console.log('\nتأكد من كتابة البريد الإلكتروني الصحيح المسجل به حسابك.')
    return
  }

  console.log('=== المستخدم قبل الترقية ===')
  console.log({ email: user.email, role: user.role, companyId: user.companyId })

  // ترقية المستخدم إلى SUPER_ADMIN
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'SUPER_ADMIN' },
  })

  console.log('\n✅ تم ترقية المستخدم إلى SUPER_ADMIN بنجاح.')

  // الموافقة التلقائية على شركته (بما إنها الشركة التأسيسية للنظام)
  if (user.companyId) {
    const updatedCompany = await prisma.company.update({
      where: { id: user.companyId },
      data: {
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: user.authUserId,
      },
    })
    console.log(`✅ تم اعتماد شركة "${updatedCompany.nameAr}" تلقائياً.`)
  }

  console.log('\n=== الحالة النهائية ===')
  const final = await prisma.user.findUnique({
    where: { id: user.id },
    include: { company: true },
  })
  console.log({
    email: final?.email,
    role: final?.role,
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