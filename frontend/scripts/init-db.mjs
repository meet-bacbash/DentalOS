import fs from 'node:fs/promises'
import dns from 'node:dns'
import dnsPromises from 'node:dns/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'
import pg from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true })
dns.setDefaultResultOrder('ipv4first')

const { DATABASE_URL } = process.env
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required in frontend/.env')
  process.exit(1)
}

const schemaPath = path.resolve(__dirname, '../../supabase/schema.sql')
const schemaSql = await fs.readFile(schemaPath, 'utf8')

const client = await createPgClient(DATABASE_URL)
try {
  await client.connect()
} catch (error) {
  printDbConnectionHelp(DATABASE_URL, error)
  process.exit(1)
}

try {
  await client.query(schemaSql)
  console.log('Database schema initialized successfully.')
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
