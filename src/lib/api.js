// API Service - handles Sparrow LLM inference and local DB (IndexedDB as Postgres substitute)

const API_BASE = '/api/v1/sparrow-llm'

const QUERY_SCHEMA = JSON.stringify([{
  "P.O No.": 0,
  "J.O No.": 0,
  "Customer Name": "str",
  "TIN": "str",
  "Address": "str",
  "Delivered to": "str",
  "Delivery receipt": "str",
  "Quantity": 0,
  "Description": "str",
  "Remarks": "str",
  "Date": "str"
}])

export async function processInvoice(file, onProgress) {
  const formData = new FormData()
  formData.append('query', QUERY_SCHEMA)
  formData.append('pipeline', 'sparrow-parse')
  formData.append('options', 'ollama,qwen3-vl:8b')
  formData.append('file', file)

  onProgress?.('Sending to Sparrow LLM...')

  const response = await fetch(`${API_BASE}/inference`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API Error ${response.status}: ${err}`)
  }

  const data = await response.json()
  onProgress?.('Parsing response...')

  // Handle various response shapes
  let parsed = data
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data)
    } catch {
      parsed = data
    }
  }

  // Normalize to array
  if (!Array.isArray(parsed)) {
    if (parsed.data) parsed = parsed.data
    else if (parsed.result) parsed = parsed.result
    else parsed = [parsed]
  }

  return parsed
}

// ─── IndexedDB as local "Postgres" ────────────────────────────────────────────

const DB_NAME = 'sparrow_invoices'
const DB_VERSION = 1
const STORE = 'invoices'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
        store.createIndex('createdAt', 'createdAt', { unique: false })
        store.createIndex('customerName', 'Customer Name', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveRecords(records, filename) {
  const db = await openDB()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)

  const saved = []
  for (const record of records) {
    const row = {
      ...record,
      _filename: filename,
      _createdAt: new Date().toISOString(),
    }
    const id = await new Promise((res, rej) => {
      const req = store.add(row)
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })
    saved.push({ ...row, id })
  }

  return saved
}

export async function getAllRecords() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteRecord(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function clearAllRecords() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const req = store.clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

const COLUMNS = [
  'id',
  'P.O No.',
  'J.O No.',
  'Customer Name',
  'TIN',
  'Address',
  'Delivered to',
  'Delivery receipt',
  'Quantity',
  'Description',
  'Remarks',
  'Date',
  '_filename',
  '_createdAt',
]

export function exportToCSV(records, filename = 'invoices_export.csv') {
  if (!records.length) return

  const escape = (val) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const header = COLUMNS.map(escape).join(',')
  const rows = records.map(r => COLUMNS.map(col => escape(r[col])).join(','))
  const csv = [header, ...rows].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
