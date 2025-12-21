import React from 'react'

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null
  const bg = type === 'error' ? '#fee2e2' : '#dcfce7'
  const color = type === 'error' ? '#991b1b' : '#065f46'
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, background: bg, color, padding: '10px 14px', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', zIndex: 2000 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>{message}</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color }}>✕</button>
      </div>
    </div>
  )
}
