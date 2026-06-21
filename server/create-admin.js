import process from 'node:process'
import { pool, one, rows } from './db.js'
import { hashPassword } from './security.js'

const email = (process.env.CPMS_ADMIN_EMAIL || '').trim().toLowerCase()
const password = process.env.CPMS_ADMIN_PASSWORD || ''
const name = (process.env.CPMS_ADMIN_NAME || 'CPMS Administrator').trim()

if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 12) {
  console.error('Set CPMS_ADMIN_EMAIL and CPMS_ADMIN_PASSWORD (minimum 12 characters).')
  process.exitCode = 1
} else {
  const passwordHash = await hashPassword(password)
  await rows(
    `INSERT INTO users (name,email,password_hash,role,status) VALUES (?,?,?,'Admin','Active')
     ON DUPLICATE KEY UPDATE name=VALUES(name),password_hash=VALUES(password_hash),role='Admin',status='Active'`,
    [name, email, passwordHash]
  )
  const user = await one('SELECT id FROM users WHERE email=?', [email])
  await rows('INSERT IGNORE INTO user_preferences (user_id) VALUES (?)', [user.id])
  console.log('Administrator account created or updated.')
}

await pool.end()
