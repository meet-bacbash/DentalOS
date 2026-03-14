import path from 'node:path'
import dns from 'node:dns'
import dnsPromises from 'node:dns/promises'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'
import pg from 'pg'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true })
dns.setDefaultResultOrder('ipv4first')

const { DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
if (!DATABASE_URL || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY in frontend/.env')
  process.exit(1)
}

const supabaseAdmin = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const client = await createPgClient(DATABASE_URL)
try {
  await client.connect()
} catch (error) {
  printDbConnectionHelp(DATABASE_URL, error)
  process.exit(1)
}

const demoUsers = [
  ['admin@dentalos.dev', 'password123', 'admin'],
  ['provider@dentalos.dev', 'password123', 'provider'],
  ['frontdesk@dentalos.dev', 'password123', 'front_desk'],
  ['patient@dentalos.dev', 'password123', 'patient'],
]

async function seedAuthUsers() {
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) throw listError
  const existingEmails = new Set(usersData.users.map((u) => u.email))

  for (const [email, password, role] of demoUsers) {
    if (existingEmails.has(email)) continue

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role },
      app_metadata: { role },
    })
    if (error) throw error
    existingEmails.add(email)
  }
}

async function seedTables() {
  await client.query('BEGIN')

  try {
    await client.query(
      `insert into users (email, full_name, hashed_password, role)
       values
         ('admin@dentalos.dev', 'Admin User', 'supabase_auth_managed', 'admin'),
         ('provider@dentalos.dev', 'Dr. Maya Chen', 'supabase_auth_managed', 'provider'),
         ('frontdesk@dentalos.dev', 'Front Desk User', 'supabase_auth_managed', 'front_desk'),
         ('patient@dentalos.dev', 'Patient User', 'supabase_auth_managed', 'patient')
       on conflict (email) do nothing`
    )

    const providerUser = await client.query(`select id from users where email='provider@dentalos.dev' limit 1`)
    const providerUserId = providerUser.rows[0]?.id

    if (!providerUserId) throw new Error('Provider user missing after seed')

    await client.query(
      `insert into providers (user_id, specialty, npi)
       values ($1, 'General Dentistry', '1234567890')
       on conflict (user_id) do nothing`,
      [providerUserId]
    )

    const provider = await client.query('select id from providers where user_id=$1 limit 1', [providerUserId])
    const providerId = provider.rows[0]?.id

    const patients = [
      ['Ava', 'Thompson', '555-111-2233', 'ava@example.com'],
      ['Noah', 'Garcia', '555-222-3344', 'noah@example.com'],
      ['Olivia', 'Patel', '555-333-4455', 'olivia@example.com'],
    ]

    for (const [first, last, phone, email] of patients) {
      const exists = await client.query(
        `select id from patients where first_name=$1 and last_name=$2 and phone=$3 limit 1`,
        [first, last, phone]
      )
      if (exists.rowCount === 0) {
        await client.query(
          `insert into patients (first_name, last_name, phone, email)
           values ($1, $2, $3, $4)`,
          [first, last, phone, email]
        )
      }
    }

    const patientRows = await client.query('select id from patients order by id asc limit 3')

    for (let i = 0; i < patientRows.rows.length; i += 1) {
      const patientId = patientRows.rows[i].id
      const existingAppt = await client.query(
        `select id from appointments where patient_id = $1 and provider_id = $2 limit 1`,
        [patientId, providerId]
      )
      if (existingAppt.rowCount && existingAppt.rows[0]?.id) {
        continue
      }

      const start = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString()
      const end = new Date(Date.now() + i * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString()

      const apptResult = await client.query(
        `insert into appointments (patient_id, provider_id, start_time, end_time, reason, status)
         values ($1, $2, $3, $4, 'Routine exam', $5)
         returning id`,
        [patientId, providerId, start, end, i < 2 ? 'scheduled' : 'confirmed']
      )

      const apptId = apptResult.rows[0].id

      await client.query(
        `insert into payments (patient_id, appointment_id, amount, method, note)
         values ($1, $2, $3, 'card', 'Demo seeded payment')`,
        [patientId, apptId, (120 + i * 35).toFixed(2)]
      )

      await client.query(
        `insert into claims (patient_id, amount, status)
         values ($1, $2, $3)`,
        [patientId, (85 + i * 20).toFixed(2), i === 2 ? 'submitted' : 'pending']
      )
    }

    const firstPatient = patientRows.rows[0]?.id
    if (firstPatient) {
      const mh = await client.query(`select id from medical_history where patient_id = $1 limit 1`, [firstPatient])
      if (mh.rowCount === 0) {
        await client.query(
          `insert into medical_history (patient_id, allergies, medications, conditions, notes)
           values ($1, 'Penicillin', 'Ibuprofen PRN', 'Mild hypertension', 'Prefers morning visits')`,
          [firstPatient]
        )
      }

      const dc = await client.query(`select id from dental_charts where patient_id = $1 limit 1`, [firstPatient])
      if (dc.rowCount === 0) {
        await client.query(
          `insert into dental_charts (patient_id, chart_data)
           values ($1, '{"tooth_14":"caries","tooth_30":"existing composite","gingiva":"mild inflammation"}')`,
          [firstPatient]
        )
      }

      const tp = await client.query(`select id from treatment_plans where patient_id = $1 limit 1`, [firstPatient])
      if (tp.rowCount === 0) {
        await client.query(
          `insert into treatment_plans (patient_id, priority, plan_data)
           values ($1, 'high', '{"phase_1":["Comprehensive exam","Bitewing x-rays"],"phase_2":["Occlusal composite restoration tooth_14"],"estimated_total":"$600-$950"}')`,
          [firstPatient]
        )
      }
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

try {
  await seedAuthUsers()
  await seedTables()
  console.log('Seed complete: demo users + domain data created.')
} finally {
  await client.end()
}

async function createPgClient(connectionString) {
  const url = new URL(connectionString)
  const host = url.hostname
  const port = Number(url.port || 5432)

  try {
    const ipv4 = await dnsPromises.resolve4(host)
    if (ipv4.length > 0) {
      return new pg.Client({
        host: ipv4[0],
        port,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ''),
        ssl: { rejectUnauthorized: false },
      })
    }
  } catch {
    // fall through to default client behavior
  }

  return new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
}

function printDbConnectionHelp(connectionString, error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  console.error('')
  console.error('Database connection failed.')
  console.error('Use Supabase Connection Pooler URL (IPv4-friendly), not direct db.<project>.supabase.co if IPv6 is unreachable.')
  console.error('Example:')
  console.error('DATABASE_URL=postgresql://postgres:<ENCODED_PASSWORD>@<POOLER_HOST>:5432/postgres')
  console.error('')
  try {
    const parsed = new URL(connectionString)
    if (parsed.password.includes('@')) {
      console.error('Your DB password contains "@". URL-encode it as "%40" in DATABASE_URL.')
    }
  } catch {
    console.error('DATABASE_URL appears malformed. Verify the full URL format.')
  }
}
