import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../contexts/contexts'
import './Register.css';

function Register() {
    const navigate = useNavigate();

    const [user, setUser] = useState({
        username:'',
        email:'',
        password:''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const { register } = useContext(AuthContext)

    const handleSignUp = async () => {
        if (!user.username || !user.email || !user.password){
            setLoading(true)
            setError("Enter all fields")
            setLoading(false)
            return
        }
        try{
            setError('')
            setLoading(true)
            await register(user.username, user.email, user.password)
            setLoading(false)
            setShowSuccessModal(true)
            setTimeout(() => {
                setShowSuccessModal(false)
                navigate('/login');
            }, 2500);
        }catch{
            setError("Failed to create an account")
            setLoading(false)
        }
    }
return (
  <div className="register-page">
    {/* Left half (image) */}
    <div className="left-section" />

    {/* Right half (gradient) */}
    <div className="right-section" />

    {/* Centered form card */}
    <div className="form-container">
      <button
        className="back-arrow-btn"
        style={{
          background: 'rgba(138, 180, 167, 0.1)',
          border: '1px solid rgba(138, 180, 167, 0.3)',
          fontSize: '1.5rem',
          cursor: 'pointer',
          position: 'absolute',
          left: '1rem',
          top: '1rem',
          zIndex: 2,
          color: '#8ab4a7',
          borderRadius: '8px',
          padding: '8px 12px',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
        }}
        onClick={() => navigate('/')}
        aria-label="Back to landing"
      >
        ←
      </button>
      <div className="form-header">
        <div className="register-logo">Sellify</div>
        <h2>Create Account</h2>
        <h3>
          Or <Link to="/login">sign in</Link> to your account!
        </h3>
      </div>

      <div className="register-form">
        <div className="form-group">
          <input
            className="register-input"
            placeholder="Username"
            onChange={(e) =>
              setUser({ ...user, username: e.target.value })
            }
            type="text"
          />
        </div>

        <div className="form-group">
          <input
            className="register-input"
            placeholder="Email"
            onChange={(e) =>
              setUser({ ...user, email: e.target.value })
            }
            type="email"
          />
        </div>

        <div className="form-group">
          <input
            className="register-input"
            placeholder="Password"
            onChange={(e) =>
              setUser({ ...user, password: e.target.value })
            }
            type="password"
          />
        </div>

        {error && <div className="register-error">{error}</div>}

        <button
          className="register-button"
          disabled={loading}
          onClick={handleSignUp}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </div>

    {/* Success Modal */}
    {showSuccessModal && (
      <div className="success-modal-overlay">
        <div className="success-modal">
          <div className="success-icon">✓</div>
          <h2>Welcome to Sellify!</h2>
          <p>Account created successfully!</p>
          <p className="success-subtitle">Redirecting to login...</p>
          <div className="success-loader"></div>
        </div>
      </div>
    )}
  </div>
);
}

export default Register;