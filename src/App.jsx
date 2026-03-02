import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import UploadPage from './pages/UploadPage.jsx'
import RecordsPage from './pages/RecordsPage.jsx'
import { SparrowIcon } from './components/Icons.jsx'

function Layout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: `0 var(--header-padding-x)`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '16px',
        minHeight: 'var(--touch-min)',
        height: 'auto',
        paddingTop: '12px',
        paddingBottom: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
          {/* Logo placeholder */}
        </div>
        <nav style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { to: '/', label: 'UPLOAD' },
            { to: '/records', label: 'RECORDS' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                padding: '10px 16px',
                minHeight: 'var(--touch-min)',
                minWidth: 'var(--touch-min)',
                boxSizing: 'border-box',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius)',
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(11px, 2.5vw, 12px)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#0a0a0f' : 'var(--text-muted)',
                transition: 'all 0.15s',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main style={{ flex: 1, padding: 'var(--main-padding)', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: '#0a0a0f' } },
          error: { iconTheme: { primary: 'var(--danger)', secondary: '#0a0a0f' } },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/records" element={<RecordsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
