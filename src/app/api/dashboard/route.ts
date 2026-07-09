export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId') || ''

  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [total, active, expiringSoon, expired, rentAgg, recentContracts] = await Promise.all([
    prisma.contract.count({ where: { companyId } }),
    prisma.contract.count({ where: { companyId, status: 'ACTIVE' } }),
    prisma.contract.count({
      where: { companyId, status: 'ACTIVE', endDate: { lte: in30Days, gte: now } }
    }),
    prisma.contract.count({ where: { companyId, status: 'EXPIRED' } }),
    prisma.contract.aggregate({
      where: { companyId, status: 'ACTIVE' },
      _sum: { monthlyRent: true },
    }),
    prisma.contract.findMany({
      where: { companyId },
      include: { tenant: { select: { tenantName: true, companyName: true, tenantType: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  return NextResponse.json({
    total, active, expiringSoon, expired,
    totalRent: rentAgg._sum.monthlyRent || 0,
    recentContracts,
  })
}
