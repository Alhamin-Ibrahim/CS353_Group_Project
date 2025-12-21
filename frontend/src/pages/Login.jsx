import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/contexts';
import GoogleAuth from '../components/GoogleAuth';
import logo from '../sellify4.png';

import './Login.css';

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [user, setUser] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const [showTerms, setShowTerms] = useState(false);

  const handleLogin = async () => {
    if (!user.email || !user.password) {
      setError('Enter all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(user.email, user.password);
      navigate('/home');
    } catch (err) {
      console.error('Login failed:', err);
      setError('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="form-container">
          {/* arrow */}
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

          <div className="login-header">
            <h1 className="brand-title">Sellify</h1>
            <h2 className="brand-subtitle">Login</h2>
            <p>
              Not registered yet? <Link to="/register">Sign up</Link>
            </p>
          </div>

          <div className="login-form">
            <div className="form-group">
              <input
                id="email"
                type="email"
                placeholder="Email"
                className="login-input"
                onChange={(e) =>
                  setUser({ ...user, email: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <input
                id="password"
                type="password"
                placeholder="Password"
                className="login-input"
                onChange={(e) =>
                  setUser({ ...user, password: e.target.value })
                }
              />
            </div>

            <button
              className="login-button"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Login'}
            </button>

            {error && <p className="login-error">{error}</p>}
          </div>

          <div className="form-divider" />

          <div className="google-button-container">
            <GoogleAuth />
            <span className="terms">
              By signing in, you agree to our{' '}
              <button
                type="button"
                className="terms-link"
                onClick={() => setShowTerms(true)}
              >
                Terms of Service
              </button>
            </span>
          </div>
        </div>
      </div>

      <div className="login-right" />

      {showTerms && (
        <div
          className="modal-backdrop"
          onClick={() => setShowTerms(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
           
            <button
              className="modal-close"
              onClick={() => setShowTerms(false)}
              aria-label="Close Terms of Service"
            >
              ✕
            </button>

           
            <div className="modal-header">Terms of Service</div>

           
            <div className="modal-body">
              <div className="modal-content">
                {/* Terms Here */}
                <h3>1. Overview</h3>
                <p>
                  Welcome to Sellify. By accessing or using our platform, you
                  agree to comply with these Terms of Service. If you do not
                  agree, you may not use Sellify.
                </p>

                <h3>2. Eligibility</h3>
                <p>To use Sellify, you must:</p>
                <ul>
                  <li>Be at least 16 years old,</li>
                  <li>Have the legal authority to enter into these terms,</li>
                  <li>Provide accurate registration information.</li>
                </ul>
                <p>
                  You are responsible for maintaining the confidentiality of your
                  login credentials.
                </p>

                <h3>3. Acceptable Use</h3>
                <p>
                  You agree not to use Sellify for any unlawful, harmful, or
                  abusive purposes. This includes:
                </p>
                <ul>
                  <li>Uploading illegal, harmful, or infringing content,</li>
                  <li>Engaging in fraud, spam, or deceptive practices,</li>
                  <li>Attempting to access accounts or data that are not yours,</li>
                  <li>Interfering with platform security or functionality.</li>
                </ul>

                <h3>4. Content Ownership</h3>
                <p>
                  You retain ownership of the content you upload, but grant
                  Sellify a limited license to display and process it to operate
                  the platform.
                </p>

                <h3>5. Purchases and Payments</h3>
                <p>
                  If you sell products on Sellify, you agree to provide accurate
                  product information and fulfill orders. Platform fees may
                  apply.
                </p>

                <h3>6. Refunds</h3>
                <p>
                  Sellers must communicate refund terms. Sellify may issue
                  refunds in cases involving fraud, unauthorized transactions, or
                  system errors.
                </p>

                <h3>7. Platform Availability</h3>
                <p>
                  Sellify may experience downtime or feature changes. We are not
                  liable for outages or data loss.
                </p>

                <h3>8. Privacy</h3>
                <p>Your use of Sellify is governed by our Privacy Policy.</p>

                <h3>9. Termination</h3>
                <p>
                  We may suspend or terminate accounts for violations. You may
                  close your account anytime.
                </p>

                <h3>10. Limitation of Liability</h3>
                <p>
                  Sellify is provided “as is” with no warranties. We are not
                  liable for indirect or consequential damages.
                </p>

                <h3>11. Changes to These Terms</h3>
                <p>
                  Continued use after updates means you accept the changes.
                </p>

                <h3>12. Contact Us</h3>
                <p>
                  If you need support or want to contact us our email is <strong>support@sellify.com</strong> and phone number is +353 12 345 6789
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
