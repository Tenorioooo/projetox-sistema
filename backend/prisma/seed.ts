import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const passwordHash = await bcrypt.hash('Admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@projetox.com' },
    update: {},
    create: {
      name: 'Administrador ProjetoX',
      email: 'admin@projetox.com',
      passwordHash,
      role: 'ADMIN',
      forcePasswordChange: true,
    },
  })
  console.log(`✅ Admin user created: ${admin.email}`)

  // Create operator user
  const operatorHash = await bcrypt.hash('Operador123!', 12)
  const operator = await prisma.user.upsert({
    where: { email: 'portaria@projetox.com' },
    update: {},
    create: {
      name: 'Operador Portaria',
      email: 'portaria@projetox.com',
      passwordHash: operatorHash,
      role: 'OPERATOR',
    },
  })
  console.log(`✅ Operator user created: ${operator.email}`)

  // Event dates
  const now = new Date()
  const nextSat = new Date(now)
  nextSat.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7))
  nextSat.setHours(23, 0, 0, 0)

  const eventsData = [
    {
      title: 'ProjetoX Neon Night',
      slug: 'projetox-neon-night',
      description: 'A festa neon mais aguardada da temporada! Iluminação a laser 4D, tinta fluorescente grátis e o melhor do Tech House.',
      location: 'Expo Barra Funda',
      city: 'São Paulo',
      startDate: nextSat,
      endDate: new Date(nextSat.getTime() + 8 * 3600 * 1000),
      prices: [80, 140, 260],
    },
    {
      title: 'Black Party Exclusive',
      slug: 'black-party',
      description: 'Traje all-black obrigatório. A noite mais elegante e obscura da cidade com hip-hop, trap e afrobeat.',
      location: 'Villa Lobos Hall',
      city: 'São Paulo',
      startDate: new Date(nextSat.getTime() + 7 * 86400 * 1000),
      endDate: new Date(nextSat.getTime() + 7 * 86400 * 1000 + 7 * 3600 * 1000),
      prices: [90, 160, 300],
    },
    {
      title: 'Festival Infinity 2026',
      slug: 'festival-infinity',
      description: '12 horas de música eletrônica sem parar. 3 palcos, atrações internacionais, praça gastronômica e lounge VIP.',
      location: 'Arena Open Air',
      city: 'Campinas',
      startDate: new Date(nextSat.getTime() + 14 * 86400 * 1000),
      endDate: new Date(nextSat.getTime() + 14 * 86400 * 1000 + 12 * 3600 * 1000),
      prices: [120, 220, 450],
    },
    {
      title: 'Sunset Open Air',
      slug: 'sunset-open-air',
      description: 'Começando ao pôr do sol com a melhor brisa de verão. Deep House, drinks tropicais e piscina exclusiva para VIPs.',
      location: 'Beach Club Guarujá',
      city: 'Guarujá',
      startDate: new Date(nextSat.getTime() + 21 * 86400 * 1000),
      endDate: new Date(nextSat.getTime() + 21 * 86400 * 1000 + 10 * 3600 * 1000),
      prices: [100, 180, 350],
    },
    {
      title: 'Funk & House Mashup',
      slug: 'funk-house-mashup',
      description: 'A mistura explosiva dos graves do funk carioca com as batidas marcantes do House paulista.',
      location: 'Espaço Unimed',
      city: 'São Paulo',
      startDate: new Date(nextSat.getTime() + 28 * 86400 * 1000),
      endDate: new Date(nextSat.getTime() + 28 * 86400 * 1000 + 8 * 3600 * 1000),
      prices: [70, 130, 220],
    },
    {
      title: 'White Party Special Edition',
      slug: 'white-party-edition',
      description: 'Edição especial de ano novo antecipado. Traje totalmente branco, champanhe liberado no camarote e pirotecnia.',
      location: 'Hangar 61',
      city: 'São Paulo',
      startDate: new Date(nextSat.getTime() + 35 * 86400 * 1000),
      endDate: new Date(nextSat.getTime() + 35 * 86400 * 1000 + 9 * 3600 * 1000),
      prices: [110, 200, 380],
    },
  ]

  for (const item of eventsData) {
    const event = await prisma.event.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        title: item.title,
        slug: item.slug,
        description: item.description,
        location: item.location,
        city: item.city,
        startDate: item.startDate,
        endDate: item.endDate,
        status: 'PUBLISHED',
        capacity: 5000,
        ageRating: 18,
      },
    })

    // Ticket types
    await prisma.ticketType.upsert({
      where: { id: `seed-${item.slug}-pista` },
      update: {},
      create: {
        id: `seed-${item.slug}-pista`,
        eventId: event.id,
        name: 'Pista VIP',
        price: item.prices[0],
        quantity: 1500,
      },
    })

    await prisma.ticketType.upsert({
      where: { id: `seed-${item.slug}-camarote` },
      update: {},
      create: {
        id: `seed-${item.slug}-camarote`,
        eventId: event.id,
        name: 'Camarote Frontstage',
        price: item.prices[1],
        quantity: 400,
      },
    })

    await prisma.ticketType.upsert({
      where: { id: `seed-${item.slug}-backstage` },
      update: {},
      create: {
        id: `seed-${item.slug}-backstage`,
        eventId: event.id,
        name: 'Backstage Experience',
        price: item.prices[2],
        quantity: 100,
      },
    })

    console.log(`✅ Event created with 3 ticket types: ${event.title}`)
  }

  console.log('\n🎉 All 6 events seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
