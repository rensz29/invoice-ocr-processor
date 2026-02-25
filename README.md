# Sparrow Invoice Processor

A Vite + React app that uploads invoice images to the **Sparrow LLM** API, extracts structured data, saves it to a database, and exports to CSV.

---

## Features

- **Drag & drop** invoice image upload (JPG, PNG, WEBP, etc.)
- **Live extraction** via `POST /api/v1/sparrow-llm/inference`  
- **Review & edit** extracted fields before saving
- **IndexedDB** local storage (acts as local Postgres substitute)
- **Records table** with search, sort, multi-select, delete
- **CSV export** of all or filtered records

---

## Quick Start

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` → `http://localhost:8002`, so your Sparrow backend just needs to be running.

---

## Connecting to Real PostgreSQL

The app uses **IndexedDB** by default (works offline, no backend needed).  
To use real Postgres, replace `src/lib/api.js` DB functions with calls to your own REST API.

### Example Express + pg backend (`server.js`)

```js
import express from 'express'
import multer from 'multer'
import pg from 'pg'
import fetch from 'node-fetch'

const app = express()
const upload = multer()
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

// Create table
await pool.query(`
  CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    po_no TEXT, jo_no TEXT,
    customer_name TEXT, tin TEXT, address TEXT,
    delivered_to TEXT, delivery_receipt TEXT,
    quantity NUMERIC, description TEXT, remarks TEXT,
    date TEXT, filename TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`)

// POST /records  — save extracted records
app.post('/records', express.json(), async (req, res) => {
  const { records, filename } = req.body
  const saved = []
  for (const r of records) {
    const { rows } = await pool.query(
      `INSERT INTO invoices (po_no, jo_no, customer_name, tin, address, delivered_to,
        delivery_receipt, quantity, description, remarks, date, filename)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [r['P.O No.'], r['J.O No.'], r['Customer Name'], r['TIN'], r['Address'],
       r['Delivered to'], r['Delivery receipt'], r['Quantity'], r['Description'],
       r['Remarks'], r['Date'], filename]
    )
    saved.push(rows[0])
  }
  res.json(saved)
})

// GET /records
app.get('/records', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM invoices ORDER BY id DESC')
  res.json(rows)
})

// DELETE /records/:id
app.delete('/records/:id', async (req, res) => {
  await pool.query('DELETE FROM invoices WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

app.listen(3001)
```

Then update `src/lib/api.js` to call `http://localhost:3001/records` instead of IndexedDB.

---

## Extracted Fields

| Field | Type |
|-------|------|
| P.O No. | number |
| J.O No. | number |
| Customer Name | string |
| TIN | string |
| Address | string |
| Delivered to | string |
| Delivery receipt | string |
| Quantity | number |
| Description | string |
| Remarks | string |
| Date | string |
