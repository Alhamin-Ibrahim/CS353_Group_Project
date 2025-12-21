import React from 'react'

export default function ContactSellerModal({ isOpen, onClose, name, phone, email, message }) {
  if (!isOpen) return null


  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px',
    boxSizing: 'border-box'
  }

  const containerStyle = {
    background: '#B0BCBF',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
  }

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '20px',
    textAlign: 'center',
    color: '#2D4343',
    borderBottom: '1px solid #88A699',
    paddingBottom: '10px'
  }

  const infoStyle = {
    marginBottom: '15px',
    fontSize: '1rem',
    color: '#2D4343'
  }

  const buttonsStyle = {
    marginTop: '1rem',
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center'
  }

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    background: '#99B39A',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block'
  }

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={containerStyle}>
        <h4 style={titleStyle}>Contact Seller</h4>
        <div style={infoStyle}><strong>Name:</strong> {name || 'N/A'}</div>
        {phone && phone !== 'Not provided' && (
          <div style={infoStyle}>
            <strong>Phone:</strong> {phone}
          </div>
        )}
        {email && email !== 'Not provided' && (
          <div style={infoStyle}>
            <strong>Email:</strong> {email}
          </div>
        )}
        {message && message !== 'Not provided' && (
          <div style={infoStyle}>
            <strong>Message:</strong> {message}
          </div>
        )}
        <div style={buttonsStyle}>
            <button 
              type="button" 
              style={buttonStyle}
              onClick={onClose} 
            >
              Close
            </button>
          </div>
      </div>
    </div>
  );
}