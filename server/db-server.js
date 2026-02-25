import express from 'express'
import { Pool } from 'pg'

const app = express()
const PORT = process.env.DB_SERVER_PORT || 8003

// Postgres connection – uses provided host/credentials
const pool = new Pool({
  host: process.env.PGHOST || '10.156.116.178',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'Engineering@2024',
  database: process.env.PGDATABASE || 'postgres',
})

app.use(express.json())

function mapRowToRecord(row) {
  return {
    id: row.id,
    'P.O No.': row.po_no,
    'J.O No.': row.jo_no,
    'Customer Name': row.customer_name,
    TIN: row.tin,
    Address: row.address,
    'Delivered to': row.delivered_to,
    'Delivery receipt': row.delivery_receipt,
    Quantity: row.quantity,
    Description: row.description,
    Remarks: row.remarks,
    Date: row.invoice_date,
    _filename: row.filename,
    _createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  }
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      po_no TEXT,
      jo_no TEXT,
      customer_name TEXT,
      tin TEXT,
      address TEXT,
      delivered_to TEXT,
      delivery_receipt TEXT,
      quantity NUMERIC,
      description TEXT,
      remarks TEXT,
      invoice_date TEXT,
      filename TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

app.get('/db/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch (err) {
    console.error('Health check failed', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.post('/db/invoices', async (req, res) => {
  const { records, filename } = req.body || {}

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).send('No records provided')
  }

  try {
    await ensureTable()

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const saved = []
      for (const record of records) {
        const {
          ['P.O No.']: poNo,
          ['J.O No.']: joNo,
          ['Customer Name']: customerName,
          TIN: tin,
          Address: address,
          ['Delivered to']: deliveredTo,
          ['Delivery receipt']: deliveryReceipt,
          Quantity: quantity,
          Description: description,
          Remarks: remarks,
          Date: invoiceDate,
        } = record

        const result = await client.query(
          `
            INSERT INTO invoices (
              po_no, jo_no, customer_name, tin, address,
              delivered_to, delivery_receipt, quantity, description,
              remarks, invoice_date, filename
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            RETURNING *
          `,
          [
            poNo ?? null,
            joNo ?? null,
            customerName ?? null,
            tin ?? null,
            address ?? null,
            deliveredTo ?? null,
            deliveryReceipt ?? null,
            quantity ?? null,
            description ?? null,
            remarks ?? null,
            invoiceDate ?? null,
            filename ?? null,
          ],
        )

        saved.push(mapRowToRecord(result.rows[0]))
      }

      await client.query('COMMIT')
      res.json(saved)
    } catch (err) {
      await client.query('ROLLBACK')
      console.error('Failed to save invoices', err)
      res.status(500).send(err.message)
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('DB error', err)
    res.status(500).send(err.message)
  }
})

app.get('/db/invoices', async (req, res) => {
  try {
    await ensureTable()
    const result = await pool.query('SELECT * FROM invoices ORDER BY id DESC')
    const mapped = result.rows.map(mapRowToRecord)
    res.json(mapped)
  } catch (err) {
    console.error('Failed to fetch invoices', err)
    res.status(500).send(err.message)
  }
})

app.delete('/db/invoices/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    return res.status(400).send('Invalid id')
  }

  try {
    await ensureTable()
    await pool.query('DELETE FROM invoices WHERE id = $1', [id])
    res.status(204).end()
  } catch (err) {
    console.error('Failed to delete invoice', err)
    res.status(500).send(err.message)
  }
})

app.delete('/db/invoices', async (req, res) => {
  try {
    await ensureTable()
    await pool.query('DELETE FROM invoices')
    res.status(204).end()
  } catch (err) {
    console.error('Failed to clear invoices', err)
    res.status(500).send(err.message)
  }
})

async function start() {
  try {
    console.log('Checking Postgres connection...')
    await pool.query('SELECT 1')
    await ensureTable()
    console.log('Postgres connection OK, invoices table ready.')

    app.listen(PORT, () => {
      console.log(`DB server listening on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to initialize DB server:', err.message)
    process.exit(1)
  }
}

start()

