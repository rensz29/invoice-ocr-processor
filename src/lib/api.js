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

export async function saveRecords(records, filename) {
  const response = await fetch('/db/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records, filename }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DB Error ${response.status}: ${err}`)
  }

  return response.json()
}

export async function getAllRecords() {
  const response = await fetch('/db/invoices')
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DB Error ${response.status}: ${err}`)
  }
  return response.json()
}

export async function deleteRecord(id) {
  const response = await fetch(`/db/invoices/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DB Error ${response.status}: ${err}`)
  }
}

export async function clearAllRecords() {
  const response = await fetch('/db/invoices', { method: 'DELETE' })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DB Error ${response.status}: ${err}`)
  }
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
