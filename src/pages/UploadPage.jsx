import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Upload, FileImage, CheckCircle, AlertCircle, Loader, ChevronRight } from 'lucide-react'
import { processInvoice, saveRecords } from '../lib/api.js'

const FIELD_LABELS = [
  'P.O No.', 'J.O No.', 'Customer Name', 'TIN', 'Address',
  'Delivered to', 'Delivery receipt', 'Quantity', 'Description', 'Remarks', 'Date'
]

export default function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('idle') // idle | processing | review | saving | done
  const [progress, setProgress] = useState('')
  const [results, setResults] = useState([])
  const [editIndex, setEditIndex] = useState(null)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStatus('idle')
    setResults([])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff','.pdf'] },
    maxFiles: 1,
  })

  const handleProcess = async () => {
    if (!file) return
    setStatus('processing')
    try {
      const data = await processInvoice(file, setProgress)
      setResults(data)
      setStatus('review')
      toast.success(`Extracted ${data.length} record(s)`)
    } catch (err) {
      setStatus('idle')
      toast.error(err.message)
    }
  }

  const handleSave = async () => {
    setStatus('saving')
    try {
      await saveRecords(results, file.name)
      setStatus('done')
      toast.success(`${results.length} record(s) saved to database!`)
    } catch (err) {
      setStatus('review')
      toast.error('Failed to save: ' + err.message)
    }
  }

  const updateField = (rowIdx, field, value) => {
    setResults(prev => prev.map((r, i) => i === rowIdx ? { ...r, [field]: value } : r))
  }

  const inputStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    padding: '6px 10px',
    fontSize: '12px',
    width: '100%',
    fontFamily: 'var(--font-mono)',
    transition: 'border-color 0.15s',
  }

  return (
    <div className="page-enter" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      {/* Left: Upload Area */}
      <div style={{ flex: '0 0 380px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px',
          fontWeight: 800,
          marginBottom: '8px',
          lineHeight: 1.1,
        }}>
          INVOICE<br />
          <span style={{ color: 'var(--accent)' }}>PROCESSOR</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '13px' }}>
          Upload an invoice image. Sparrow LLM will extract structured data.
        </p>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragActive ? 'rgba(232,255,71,0.04)' : 'var(--surface)',
            transition: 'all 0.2s',
            marginBottom: '16px',
          }}
        >
          <input {...getInputProps()} />
          {preview ? (
            <img
              src={preview}
              alt="preview"
              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius)', objectFit: 'contain' }}
            />
          ) : (
            <>
              <FileImage size={40} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                {isDragActive ? 'Drop here...' : 'Drag & drop invoice image\nor click to browse'}
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '8px' }}>
                JPG, PNG, WEBP, BMP, TIFF
              </div>
            </>
          )}
        </div>

        {file && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}>
            <FileImage size={14} color="var(--accent)" />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </span>
            <span style={{ color: 'var(--text-dim)' }}>
              {(file.size / 1024).toFixed(1)}KB
            </span>
          </div>
        )}

        {/* Process Button */}
        {status !== 'done' && (
          <button
            onClick={handleProcess}
            disabled={!file || status === 'processing' || status === 'saving'}
            style={{
              width: '100%',
              padding: '14px',
              background: (!file || status === 'processing' || status === 'saving')
                ? 'var(--surface2)'
                : 'var(--accent)',
              color: (!file || status === 'processing' || status === 'saving')
                ? 'var(--text-muted)'
                : '#0a0a0f',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            {status === 'processing' ? (
              <>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {progress || 'PROCESSING...'}
              </>
            ) : (
              <>
                <Upload size={16} />
                EXTRACT DATA
              </>
            )}
          </button>
        )}

        {status === 'done' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setFile(null); setPreview(null); setStatus('idle'); setResults([]) }}
              style={{
                flex: 1, padding: '14px',
                background: 'var(--surface2)', color: 'var(--text)',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em',
              }}
            >
              NEW UPLOAD
            </button>
            <button
              onClick={() => navigate('/records')}
              style={{
                flex: 1, padding: '14px',
                background: 'var(--accent)', color: '#0a0a0f',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              VIEW RECORDS <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Right: Results Review */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {status === 'idle' && !results.length && (
          <div style={{
            height: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dim)',
            border: '1px dashed var(--dim)',
            borderRadius: 'var(--radius-lg)',
            gap: '12px',
          }}>
            <div style={{ fontSize: '48px', opacity: 0.3 }}>⟨ ⟩</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '0.1em' }}>
              AWAITING EXTRACTION
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div style={{
            height: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '60px', height: '60px',
              border: '3px solid var(--border)',
              borderTop: '3px solid var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              {progress || 'ANALYZING IMAGE...'}
            </div>
          </div>
        )}

        {(status === 'review' || status === 'saving' || status === 'done') && results.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>
                  EXTRACTED DATA
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                  {results.length} record{results.length !== 1 ? 's' : ''} — review and edit before saving
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {status === 'review' && (
                  <button
                    onClick={handleSave}
                    style={{
                      padding: '10px 20px',
                      background: 'var(--success)',
                      color: '#0a0a0f',
                      borderRadius: 'var(--radius)',
                      fontFamily: 'var(--font-display)',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle size={14} />
                    SAVE TO DB
                  </button>
                )}
                {status === 'saving' && (
                  <div style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    SAVING...
                  </div>
                )}
                {status === 'done' && (
                  <div style={{ padding: '10px 20px', color: 'var(--success)', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.08em' }}>
                    <CheckCircle size={14} />
                    SAVED
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {results.map((record, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      color: 'var(--accent)',
                    }}>
                      RECORD #{i + 1}
                    </span>
                    {status === 'review' && (
                      <button
                        onClick={() => setEditIndex(editIndex === i ? null : i)}
                        style={{
                          padding: '4px 12px',
                          background: editIndex === i ? 'var(--accent)' : 'var(--surface2)',
                          color: editIndex === i ? '#0a0a0f' : 'var(--text-muted)',
                          borderRadius: 'var(--radius)',
                          fontSize: '11px',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                        }}
                      >
                        {editIndex === i ? 'DONE' : 'EDIT'}
                      </button>
                    )}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1px',
                    background: 'var(--border)',
                  }}>
                    {FIELD_LABELS.map(field => (
                      <div
                        key={field}
                        style={{
                          background: 'var(--surface)',
                          padding: '10px 14px',
                        }}
                      >
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}>
                          {field.toUpperCase()}
                        </div>
                        {editIndex === i ? (
                          <input
                            value={record[field] ?? ''}
                            onChange={(e) => updateField(i, field, e.target.value)}
                            style={{
                              ...inputStyle,
                              padding: '4px 8px',
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                          />
                        ) : (
                          <div style={{
                            fontSize: '13px',
                            color: record[field] !== undefined && record[field] !== '' && record[field] !== null
                              ? 'var(--text)'
                              : 'var(--text-dim)',
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {record[field] !== undefined && record[field] !== '' && record[field] !== null
                              ? String(record[field])
                              : '—'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
