// prisma/make-templates-global.js
// سكريبت لمرة واحدة: يحول التمبلتات الأربعة الحالية إلى تمبلتات عامة (Global)
// نسخة JavaScript عادية لتجنب مشاكل إعدادات ts-node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const existingTemplates = await prisma.template.findMany({
    select: {
      id: true,
      type: true,
      nameAr: true,
      companyId: true,
      isGlobal: true,
    },
  })

  console.log('=== التمبلتات الموجودة حالياً ===')
  console.table(existingTemplates)

  if (existingTemplates.length === 0) {
    console.log('لا توجد تمبلتات لتحويلها.')
    return
  }

  const result = await prisma.template.updateMany({
    where: {
      isGlobal: false,
    },
    data: {
      isGlobal: true,
      companyId: null,
    },
  })

  console.log(`\n✅ تم تحويل ${result.count} تمبلت إلى تمبلتات عامة (Global).`)

  const updatedTemplates = await prisma.template.findMany({
    select: {
      id: true,
      type: true,
      nameAr: true,
      companyId: true,
      isGlobal: true,
    },
  })

  console.log('\n=== الحالة بعد التحويل ===')
  console.table(updatedTemplates)
}

main()
  .catch((e) => {
    console.error('❌ حصل خطأ:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })