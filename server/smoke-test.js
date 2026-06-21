import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool, one, rows } from './db.js'
import { hashPassword } from './security.js'

const baseUrl = process.env.CPMS_TEST_API_URL || 'http://127.0.0.1:8000'
const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
const email = `codex-node-test-${suffix}@example.com`
const password = `NodeTest-${suffix}!`
const itemCode = `NODE-TEST-${suffix}`
let token = ''
let userId = null
let itemId = null
let attachmentId = null
let testedCustodianId = null

async function request(endpoint, options = {}) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.arrayBuffer()
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${endpoint} returned ${response.status}: ${payload.message || 'request failed'}`)
  return payload
}

function passed(name) {
  console.log(`PASS ${name}`)
}

try {
  const passwordHash = await hashPassword(password)
  const result = await rows("INSERT INTO users (name,email,password_hash,role,status) VALUES (?,?,?,'Admin','Active')", ['Node Smoke Admin', email, passwordHash])
  userId = result.insertId
  await rows('INSERT INTO user_preferences (user_id) VALUES (?)', [userId])

  const health = await request('/health')
  if (health.backend !== 'node') throw new Error('Health endpoint is not served by Node')
  passed('health')

  const login = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  token = login.token
  passed('login and bcrypt authentication')

  await request('/auth/me'); passed('current user')
  await request('/users'); passed('user management')
  await request('/custodians'); passed('custodians')
  await request('/transactions/stats'); passed('transaction statistics')
  await request('/maintenance'); passed('maintenance records')
  await request('/verifications'); passed('verification records')
  await request('/preferences'); passed('preferences')
  await request('/profile'); passed('profile and audit history')
  await request('/reports'); passed('reports and dashboard analytics')
  await request('/documents'); passed('generated documents')
  await request('/audit-logs'); passed('audit logs')

  const item = await request('/items', {
    method: 'POST',
    body: JSON.stringify({
      item_name: 'Node API Smoke Item',
      category: 'Other',
      item_code: itemCode,
      asset_type: 'Fixed Asset',
      quantity: 1,
      condition: 'New',
      status: 'Active',
      unit_cost: 0,
      total_cost: 0
    })
  })
  itemId = item.data.id
  await request(`/items?search=${encodeURIComponent(itemCode)}`)
  passed('inventory create and search')

  await request('/maintenance', {
    method: 'POST',
    body: JSON.stringify({ item_id: itemId, maintenance_type: 'Smoke Test', scheduled_date: '2026-06-21', status: 'Pending' })
  })
  passed('maintenance create')

  await request('/documents', {
    method: 'POST',
    body: JSON.stringify({ template_name: 'Node Smoke Template', output_name: 'node-smoke.xlsx', document_type: 'xlsx', metadata: { test: true } })
  })
  passed('document audit')

  const form = new FormData()
  form.append('item_id', String(itemId))
  form.append('file', new Blob(['CPMS Node attachment smoke test'], { type: 'text/plain' }), 'node-smoke.txt')
  const attachment = await request('/attachments', { method: 'POST', body: form })
  attachmentId = attachment.data.id
  await request(`/attachments/${attachmentId}/content`)
  await request(`/attachments/${attachmentId}`, { method: 'DELETE' })
  attachmentId = null
  passed('attachment upload, download, and delete')

  const borrowing = await request('/borrowings', {
    method: 'POST',
    body: JSON.stringify({
      item_id: itemId,
      borrower_name: 'Node Smoke Borrower',
      borrower_reference: `BORROW-${suffix}`,
      borrowed_date: '2026-06-21',
      due_date: '2026-06-28',
      condition_out: 'Good',
      purpose: 'Node API smoke test'
    })
  })
  await request('/borrowings?status=Borrowed')
  await request(`/borrowings/${borrowing.data.id}/return`, {
    method: 'PUT',
    body: JSON.stringify({ condition_return: 'Good', remarks: 'Returned by smoke test' })
  })
  passed('asset borrowing and return')

  const custodians = await request('/custodians?status=Active')
  if (custodians.data.length) {
    const custodianId = custodians.data[0].id
    testedCustodianId = custodianId
    await request('/transactions', { method: 'POST', body: JSON.stringify({ item_id: itemId, custodian_id: custodianId, transaction_type: 'Issuance' }) })
    await request('/transactions', { method: 'POST', body: JSON.stringify({ item_id: itemId, transaction_type: 'Return' }) })
    await request('/verifications', { method: 'POST', body: JSON.stringify({ custodian_id: custodianId, total_items_expected: 1, items_found: 1, discrepancies: [] }) })
    passed('atomic issuance, return, and verification')
  }

  console.log('Node API smoke test completed successfully.')
} finally {
  if (!itemId) itemId = (await one('SELECT id FROM items WHERE item_code=?', [itemCode]))?.id || null
  if (itemId) {
    const files = await rows('SELECT stored_name FROM asset_attachments WHERE item_id=?', [itemId])
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
    for (const file of files) {
      await fs.promises.unlink(path.join(root, 'server', 'storage', 'attachments', file.stored_name)).catch(() => {})
    }
    await rows('DELETE FROM asset_attachments WHERE item_id=?', [itemId])
    await rows('DELETE FROM maintenance_records WHERE item_id=?', [itemId])
    await rows('DELETE FROM borrow_records WHERE item_id=?', [itemId])
    await rows('DELETE FROM transactions WHERE item_id=?', [itemId])
    await rows('DELETE FROM item_assignments WHERE item_id=?', [itemId])
    await rows('DELETE FROM items WHERE id=?', [itemId])
  }
  if (!userId) userId = (await one('SELECT id FROM users WHERE email=?', [email]))?.id || null
  if (userId) {
    await rows('DELETE FROM inventory_verifications WHERE verified_by=?', [userId])
    if (testedCustodianId) {
      await rows(
        'UPDATE custodians SET last_verification=(SELECT MAX(verification_date) FROM inventory_verifications WHERE custodian_id=?) WHERE id=?',
        [testedCustodianId, testedCustodianId]
      )
    }
    await rows('DELETE FROM generated_documents WHERE generated_by=?', [userId])
    await rows('DELETE FROM audit_logs WHERE user_id=?', [userId])
    await rows('DELETE FROM auth_tokens WHERE user_id=?', [userId])
    await rows('DELETE FROM user_preferences WHERE user_id=?', [userId])
    await rows('DELETE FROM users WHERE id=?', [userId])
  }
  await pool.end()
}
