/**
 * Database Seed Script
 * Creates initial admin user and sample data
 *
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@modelmagic.com'

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      name: 'Admin',
      role: 'ADMIN',
    },
  })

  console.log(`Admin user created/updated: ${admin.email} (${admin.id})`)

  // Create sample client user (for development/testing)
  if (process.env.NODE_ENV === 'development') {
    const sampleClient = await prisma.user.upsert({
      where: { email: 'client@example.com' },
      update: {},
      create: {
        email: 'client@example.com',
        name: 'Sample Client',
        role: 'CLIENT',
      },
    })

    console.log(`Sample client created: ${sampleClient.email}`)

    // Create sample project
    const sampleProject = await prisma.project.upsert({
      where: { id: 'sample-project-1' },
      update: {},
      create: {
        id: 'sample-project-1',
        userId: sampleClient.id,
        productType: 'Clothing',
        creativeBrief: 'Sample project for testing. Looking for casual lifestyle shots with a modern, minimalist aesthetic.',
        status: 'INTAKE_NEW',
      },
    })

    console.log(`Sample project created: ${sampleProject.id}`)

    // Create sample status history
    await prisma.projectStatusHistory.upsert({
      where: { id: 'sample-history-1' },
      update: {},
      create: {
        id: 'sample-history-1',
        projectId: sampleProject.id,
        fromStatus: null,
        toStatus: 'INTAKE_NEW',
        notes: 'Project created via seed script',
      },
    })

    console.log('Sample status history created')
  }

  console.log('Database seed completed!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
