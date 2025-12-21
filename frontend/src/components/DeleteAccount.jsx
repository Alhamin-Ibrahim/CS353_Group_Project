import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  deleteUser
} from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";

export default function DeleteAccount({ isOpen, onClose }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const user = auth.currentUser;
  const providerId = user?.providerData[0]?.providerId;
  const isEmailUser = providerId === "password";

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      if (!user) throw new Error("No user logged in.");

      if (isEmailUser) {
        if (!password) {
          setError("Please enter your password.");
          setLoading(false);
          return;
        }

        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      } else if (providerId === "google.com") {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
      }

      await deleteDoc(doc(db, "users", user.uid));

      await deleteUser(user);

      setShowSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error(err);

      if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Google re-authentication was closed.");
      } else if (err.code === "auth/requires-recent-login") {
        setError("Please log out and log in again to continue.");
      } else {
        setError("Unable to delete account.");
      }
    }

    setLoading(false);
  };

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
  };

  const modal = {
    background: "#B0BCBF",
    padding: "25px",
    width: "90%",
    maxWidth: "450px",
    borderRadius: "12px",
    color: "#2D4343",
    boxShadow: "0 8px 25px rgba(0,0,0,0.3)"
  };

  const button = {
    padding: "10px 20px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem"
  };

  if (showSuccess) {
    return (
      <div style={overlay}>
        <div style={{ ...modal, textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #8fa89d 0%, #a8d5ba 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '50px',
            color: 'white',
            animation: 'scaleIn 0.5s ease'
          }}>
            ✓
          </div>
          <h2 style={{ marginBottom: '10px' }}>Account Deleted</h2>
          <p>Your account has been successfully deleted.</p>
          <p style={{ fontSize: '14px', color: '#7f8c8d', fontStyle: 'italic', marginTop: '10px' }}>
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <h2 style={{ textAlign: "center", marginBottom: "15px" }}>
          Confirm Delete Account
        </h2>

        <p style={{ marginBottom: "20px" }}>
          This will permanently delete your account and all your data.
        </p>

        {isEmailUser && (
          <>
            <label>Password (required):</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                margin: "8px 0 16px",
                borderRadius: "6px",
                border: "1px solid #88A699"
              }}
            />
          </>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" }}>
          <button
            style={{ 
              ...button, 
              background: "white", 
              color: "#455a83",
              border: "2px solid #d4c5e8"
            }}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            style={{ 
              ...button, 
              background: "linear-gradient(135deg, #b2a1d1 0%, #455a83 100%)", 
              color: "white",
              boxShadow: "0 4px 15px rgba(178, 161, 209, 0.4)"
            }}
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
