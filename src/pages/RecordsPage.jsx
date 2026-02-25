import React, { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { Download, Trash2, Search, RefreshCw, Database, ChevronUp, ChevronDown } from 'lucide-react'
import { getAllRecords, deleteRecord, clearAllRecords, exportToCSV } from '../lib/api.js'

const COLUMNS = [
  { key: 'id', label: '#', width: '50px' },
  { key: 'P.O No.', label: 'P.O No.', width: '80px' },
  { key: 'J.O No.', label: 'J.O No.', width: '80px' },
  { key: 'Customer Name', label: 'Customer', width: '160px' },
  { key: 'TIN', label: 'TIN', width: '110px' },
  { key: 'Date', label: 'Date', width: '100px' },
  { key: 'Description', label: 'Description', width: '180px' },
  { key: 'Quantity', label: 'Qty', width: '60px' },
  { key: 'Address', label: 'Address', width: '160px' },
  { key: 'Delivered to', label: 'Delivered To', width: '130px' },
  { key: 'Delivery receipt', label: 'D.R.', width: '80px' },
  { key: 'Remarks', label: 'Remarks', width: '120px' },
  { key: '_filename', label: 'Source File', width: '130px' },
  { key: '_createdAt', label: 'Imported At', width: '140px' },
]

export default function RecordsPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('id')
  const [sortDir, setSortDir] = useState('desc')
  const [selected, setSelected] = useState(new Set())

  const load = async () => {
    setLoading(true)
    try {
      const data = await getAllRecords()
      setRecords(data)
    } catch (err) {
      toast.error('Failed to load records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let rows = [...records]
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        Object.values(r).some(v => String(v).toLowerCase().includes(q))
      )
    }
    rows.sort((a, b) => {
      let av = a[sortKey] ?? ''
      let bv = b[sortKey] ?? ''
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      av = String(av).toLowerCase()
      bv = String(bv).toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    return rows
  }, [records, search, sortKey, sortDir])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const handleDelete = async (id) => {
    try {
      await deleteRecord(id)
      setRecords(prev => prev.filter(r => r.id !== id))
      setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
      toast.success('Record deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleDeleteSelected = async () => {
    if (!selected.size) return
    if (!confirm(`Delete ${selected.size} selected record(s)?`)) return
    try {
      for (const id of selected) await deleteRecord(id)
      setRecords(prev => prev.filter(r => !selected.has(r.id)))
      setSelected(new Set())
      toast.success(`${selected.size} records deleted`)
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Clear ALL records from the database?')) return
    try {
      await clearAllRecords()
      setRecords([])
      setSelected(new Set())
      toast.success('All records cleared')
    } catch {
      toast.error('Clear failed')
    }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(r => r.id)))
  }

  const formatDate = (str) => {
    if (!str) return '—'
    try {
      return new Date(str).toLocaleString()
    } catch { return str }
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>
            DATABASE<span style={{ color: 'var(--accent)' }}>.</span>RECORDS
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            <span style={{ color: 'var(--accent)' }}>{records.length}</span> total ·{' '}
            <span style={{ color: 'var(--text-muted)' }}>{filtered.length} shown</span>
            {selected.size > 0 && (
              <span style={{ color: 'var(--accent2)' }}> · {selected.size} selected</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selected.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              style={{
                padding: '9px 16px',
                background: 'rgba(255,71,87,0.12)',
                color: 'var(--danger)',
                border: '1px solid rgba(255,71,87,0.3)',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                display: 'flex', gap: '6px', alignItems: 'center',
              }}
            >
              <Trash2 size={13} />
              DELETE ({selected.size})
            </button>
          )}
          <button
            onClick={() => exportToCSV(filtered.length ? filtered : records)}
            disabled={!records.length}
            style={{
              padding: '9px 16px',
              background: records.length ? 'var(--accent)' : 'var(--surface2)',
              color: records.length ? '#0a0a0f' : 'var(--text-muted)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              display: 'flex', gap: '6px', alignItems: 'center',
            }}
          >
            <Download size={13} />
            EXPORT CSV
          </button>
          <button
            onClick={load}
            style={{
              padding: '9px',
              background: 'var(--surface2)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Search + Stats bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search all fields..."
            style={{
              width: '100%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              padding: '8px 12px 8px 36px',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        {records.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              color: 'var(--text-dim)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '11px',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              letterSpacing: '0.06em',
              display: 'flex', gap: '6px', alignItems: 'center',
            }}
          >
            <Trash2 size={11} />
            CLEAR ALL
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Loading records...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <Database size={40} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              {records.length === 0 ? 'NO RECORDS YET' : 'NO MATCHES FOUND'}
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '6px' }}>
              {records.length === 0 ? 'Upload an invoice to get started' : 'Try a different search term'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                    />
                  </th>
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        width: col.width,
                        color: sortKey === col.key ? 'var(--accent)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        fontSize: '11px',
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {col.label}
                        {sortKey === col.key && (
                          sortDir === 'asc'
                            ? <ChevronUp size={11} />
                            : <ChevronDown size={11} />
                        )}
                      </span>
                    </th>
                  ))}
                  <th style={{ padding: '10px 12px', width: '50px' }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, idx) => (
                  <tr
                    key={record.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: selected.has(record.id)
                        ? 'rgba(232,255,71,0.03)'
                        : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => !selected.has(record.id) && (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={e => !selected.has(record.id) && (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                  >
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="checkbox"
                        checked={selected.has(record.id)}
                        onChange={() => toggleSelect(record.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                      />
                    </td>
                    {COLUMNS.map(col => (
                      <td
                        key={col.key}
                        style={{
                          padding: '8px 12px',
                          color: col.key === 'id' ? 'var(--text-muted)' : 'var(--text)',
                          maxWidth: col.width,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={String(record[col.key] ?? '')}
                      >
                        {col.key === '_createdAt'
                          ? formatDate(record[col.key])
                          : (record[col.key] !== undefined && record[col.key] !== '' && record[col.key] !== null)
                            ? String(record[col.key])
                            : <span style={{ color: 'var(--text-dim)' }}>—</span>
                        }
                      </td>
                    ))}
                    <td style={{ padding: '8px 12px' }}>
                      <button
                        onClick={() => handleDelete(record.id)}
                        style={{
                          padding: '4px',
                          background: 'transparent',
                          color: 'var(--text-dim)',
                          borderRadius: 'var(--radius)',
                          display: 'flex',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(255,71,87,0.1)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer info */}
      {filtered.length > 0 && (
        <div style={{ marginTop: '12px', color: 'var(--text-dim)', fontSize: '11px', textAlign: 'right' }}>
          Showing {filtered.length} of {records.length} records · Export CSV exports currently visible/filtered rows
        </div>
      )}
    </div>
  )
}
