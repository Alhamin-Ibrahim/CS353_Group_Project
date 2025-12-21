import React, { useEffect, useState } from 'react'

export default function EditProfileModal({ isOpen, onClose, profile = {}, onSave, onUploadPhoto, uploading, uploadProgress }) {
  const [name, setName] = useState(profile.name || '')
  const [phone, setPhone] = useState(profile.phone || '')
  const [bio, setBio] = useState(profile.bio || '')

  useEffect(() => {
    if (!isOpen) return
    setName(profile.name || '')
    setPhone(profile.phone || '')
    setBio(profile.bio || '')
  }, [isOpen, profile])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = { name, phone, bio }
    if (onSave) await onSave(data)
  }

  if (!isOpen) return null

  // All styles defined here
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

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '500',
    color: '#2D4343',
    fontSize: '0.9rem'
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #88A699',
    borderRadius: '6px',
    background: 'white',
    color: '#2D4343',
    fontSize: '0.9rem',
    marginBottom: '15px',
    boxSizing: 'border-box'
  }

  const textareaStyle = {
    ...inputStyle,
    minHeight: '80px',
    resize: 'vertical'
  }

  const buttonsStyle = {
    marginTop: '1rem',
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end'
  }

  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #88A699',
    background: '#2D4343', // Your specified cancel button color
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease'
  }

  const primaryButtonStyle = {
    ...buttonStyle,
    background: '#99B39A', // Your specified upload button color
    color: 'white',
    border: 'none'
  }

  const uploadButtonStyle = {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #88A699',
    background: '#99B39A', // Your specified color for upload button
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    display: 'inline-block'
  }

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={containerStyle}>
        <h4 style={titleStyle}>Edit Profile</h4>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Name</label>
          <input 
            style={inputStyle}
            value={name} 
            onChange={e => setName(e.target.value)} 
          />

          <label style={labelStyle}>Phone</label>
          <input 
            style={inputStyle}
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
          />

          <label style={labelStyle}>Bio</label>
          <textarea 
            style={textareaStyle}
            value={bio} 
            onChange={e => setBio(e.target.value)} 
          />

          <div style={{ marginTop: '12px' }}>
            <div style={{ marginTop: '8px' }}>
              <label style={uploadButtonStyle} htmlFor="modal-photo-upload">
                Upload Photo
              </label>
              <input 
                id="modal-photo-upload" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }}
                onChange={onUploadPhoto} 
              />
            </div>
            {uploading && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ width: '160px', height: '8px', background: '#6F8B8F', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#99A39A', width: `${uploadProgress}%`, transition: 'width 0.2s ease' }} />
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6F8B8F' }}>{uploadProgress}%</div>
              </div>
            )}
          </div>

          <div style={buttonsStyle}>
            <button type="button" style={buttonStyle} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={primaryButtonStyle}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}