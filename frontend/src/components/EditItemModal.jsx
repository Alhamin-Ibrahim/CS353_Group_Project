import React, { useEffect, useState } from 'react'

export default function EditItemModal({ isOpen, item, onClose, onSave }) {
  const [description, setDescription] = useState(item?.description || '')
  const [category, setCategory] = useState(item?.category || '')
  const [price, setPrice] = useState(item?.price || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setDescription(item?.description || '')
    setCategory(item?.category || '')
    setPrice(item?.price || '')
    setError('')
  }, [isOpen, item])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description || !category) {
      setError('Please fill in description and category')
      return
    }
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      setError('Please enter a valid price')
      return
    }
    try {
      setSaving(true)
      await onSave?.({ description, category, price: parseFloat(price) })
    } catch (err) {
      console.error('Failed to save item edits:', err)
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
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
    background: '#99B39A', // Your specified save button color
    color: 'white',
    border: 'none'
  }

  const disabledButtonStyle = {
    opacity: 0.6,
    cursor: 'not-allowed'
  }

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={containerStyle}>
        <h4 style={titleStyle}>Edit Post</h4>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Description</label>
          <textarea
            style={textareaStyle}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Update your description"
          />

          <label style={labelStyle}>Category</label>
          <select
            style={inputStyle}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">-- Select a category --</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="accessories">Accessories</option>
            <option value="ticket">Tickets & Events</option>
            <option value="textbooks">Books & Materials</option>
            <option value="other">Other</option>
          </select>

          <label style={labelStyle}>Price (€)</label>
          <input
            type="number"
            style={inputStyle}
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="Enter price"
            min="0"
            step="0.01"
          />

          {error && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</div>}

          <div style={buttonsStyle}>
            <button 
              type="button" 
              style={{...buttonStyle, ...(saving ? disabledButtonStyle : {})}}
              onClick={onClose} 
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{...primaryButtonStyle, ...(saving ? disabledButtonStyle : {})}}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}