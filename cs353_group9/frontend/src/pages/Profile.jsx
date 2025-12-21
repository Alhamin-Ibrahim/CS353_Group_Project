import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/contexts';
import './Profile.css';
import { db, storage, auth } from '../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import EditProfileModal from '../components/EditProfileModal';
import EditItemModal from '../components/EditItemModal';
import ImageSlider from '../components/ImageSlider';
import DeleteAccount from '../components/DeleteAccount';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();
  const { currentUser, logout, emailVerification } = useContext(AuthContext);
  const [myItems, setMyItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [emailVerificationTimer, setEmailVerificationTimer] = useState(0);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [open, setOpen] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Add profile-page class to body
  useEffect(() => {
    document.body.classList.add('profile-page');
    
    return () => {
      document.body.classList.remove('profile-page');
    };
  }, []);

  // Subscribe to this user's uploaded items from Firestore
  useEffect(() => {
    if (!currentUser) {
      setMyItems([]);
      return;
    }
    const q = query(
      collection(db, 'items'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMyItems(list);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [currentUser]);

  // Settings handlers - FIXED: Prevent event propagation
  const openSettings = (e) => {
    if (e) e.stopPropagation();
    setShowSettings(true);
  };

  const closeSettings = (e) => {
    if (e) e.stopPropagation();
    setShowSettings(false);
  };

  // Edit profile handlers - FIXED: Prevent event propagation
  const openEdit = (e) => {
    if (e) e.stopPropagation();
    setEditing(true);
    setShowSettings(false);
  };

  const closeEdit = (e) => {
    if (e) e.stopPropagation();
    setEditing(false);
  };

  // Edit item handlers - FIXED: Prevent event propagation
  const openEditItem = (item, e) => {
    if (e) e.stopPropagation();
    console.log('Opening edit for item:', item); // Debug log
    setEditingItem(item);
  };

  const closeEditItem = (e) => {
    if (e) e.stopPropagation();
    setEditingItem(null);
  };

  // FIXED: Overlay click handlers
  const handleSettingsOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeSettings();
    }
  };

  const saveItemEdits = async (data) => {
    if (!editingItem) return;
    try {
      const itemRef = doc(db, 'items', editingItem.id);
      await updateDoc(itemRef, {
        description: data.description,
        category: data.category,
        price: data.price,
        updatedAt: serverTimestamp(),
      });
      closeEditItem();
      setMyItems((prev) => prev.map((it) => (it.id === editingItem.id ? { ...it, ...data } : it)));
    } catch (err) {
      console.error('Failed to update item:', err);
      alert('Failed to save changes.');
    }
  };

  const confirmDeleteItem = (itemId) => {
    setItemToDelete(itemId);
    setShowDeleteConfirm(true);
  };

  const deleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, 'items', itemToDelete));
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setDeleteSuccessMessage('Post deleted successfully!');
      setShowDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Failed to delete item.');
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!currentUser) {
          setProfile(null);
          return;
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userDocRef);
        const firestoreData = snap.exists() ? snap.data() : {};

        const saved = localStorage.getItem(`profile_${currentUser.uid}`);
        const savedObj = saved ? JSON.parse(saved) : {};

        const data = {
          name: firestoreData.name || currentUser.displayName || savedObj.name || 'User',
          email: firestoreData.email || currentUser.email || savedObj.email || '',
          bio: firestoreData.bio || savedObj.bio || currentUser.bio || '',
          phone: firestoreData.phone || savedObj.phone || currentUser.phoneNumber || '',
          avatarUrl: firestoreData.avatarUrl || currentUser.photoURL || savedObj.avatarUrl || '/test.png',
        };

        setProfile(data);
        setEditPhone(data.phone || '');
        setEditBio(data.bio || '');
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const saveProfile = async (data = {}) => {
    if (!currentUser) return;

    const phoneToSave = data.phone ?? editPhone;
    const bioToSave = data.bio ?? editBio;
    const avatarToSave = data.avatarUrl ?? profile?.avatarUrl ?? currentUser.photoURL ?? null;
    const nameToSave = data.name ?? profile?.name ?? currentUser.displayName ?? null;
    const emailToSave = profile?.email ?? currentUser.email ?? null;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        userDocRef,
        {
          phone: phoneToSave,
          bio: bioToSave,
          name: nameToSave,
          email: emailToSave,
          avatarUrl: avatarToSave,
        },
        { merge: true }
      );
      if (auth && auth.currentUser && nameToSave) {
        await updateProfile(auth.currentUser, { displayName: nameToSave });
      }
      const toSave = { phone: phoneToSave, bio: bioToSave, name: nameToSave, email: emailToSave, avatarUrl: avatarToSave };
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(toSave));
      setProfile((prev) => ({ ...prev, phone: phoneToSave, bio: bioToSave, avatarUrl: avatarToSave, name: nameToSave, email: emailToSave }));
    } catch (err) {
      console.error('Error saving profile:', err);
      const toSave = { phone: phoneToSave, bio: bioToSave, avatarUrl: avatarToSave };
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(toSave));
      setProfile((prev) => ({ ...prev, phone: phoneToSave, bio: bioToSave, avatarUrl: avatarToSave }));
    } finally {
      setEditing(false);
    }
  };

  async function handlePhotoSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file || !currentUser) return;

    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      alert('Please upload an image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Please upload an image smaller than 5MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const path = `profile_pictures/${currentUser.uid}/${timestamp}_profile.${fileExtension}`;
      const sRef = storageRef(storage, path);

      const uploadTask = uploadBytesResumable(sRef, file, { contentType: file.type });
      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(pct);
          },
          (error) => reject(error),
          () => resolve()
        );
      });

      const url = await getDownloadURL(sRef);
      await updateProfile(auth.currentUser, { photoURL: url });
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { avatarUrl: url }, { merge: true });
      setProfile((prev) => ({ ...prev, avatarUrl: url }));
    } catch (err) {
      console.error('Error uploading profile photo:', err);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (e.target) e.target.value = '';
    }
  }

  const handleLogout = async() => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    if (auth.currentUser) {
      setIsEmailVerified(auth.currentUser.emailVerified)
    }
  }, [])

  const handleEmailVerification = async() => {
    if (emailVerificationTimer > 0) return; 

    try{
      await emailVerification()
      setEmailVerificationTimer(60)
    } catch(err){
      console.error('Failed to resend verification email:', err);
      alert(`Couldn't resend email verification please wait ${emailVerificationTimer}.`)
    }
  }

  useEffect(() => {
    if(emailVerificationTimer <= 0) return

    const interval = setInterval(() => {
      setEmailVerificationTimer((sec) => sec - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [emailVerificationTimer])

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-lg">
        Loading profile…
      </div>
    );

  if (error)
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
        >
          Go to Login
        </button>
      </div>
    );

  return (
    <div className="profile-container">
      <div className="ig-profile">
        <button className="settings-button" onClick={openSettings} title="Settings">
          <FontAwesomeIcon icon={faGear} />
        </button>



        <div className="profile-top">
          <div className="avatar-col">
            <img src={profile?.avatarUrl || '/test.png'} alt="avatar" className="profile-avatar-large" />
            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                <div className="text-sm text-gray-600">{uploadProgress}%</div>
              </div>
            )}
          </div>

          <div className="profile-info">
            <h2 className="username">{profile?.name || 'User'}</h2>

            <div className="counts">
              <div>
                <span className="count-number">{myItems.length}</span>
                <span>posts</span>
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                Upload
              </button>
            </div>

            <div className="bio">
              <div>
                <strong>Contact:</strong> {profile?.email}
              </div>
              {profile?.phone && <div>{profile.phone}</div>}
            </div>
            <div className="bio">{profile?.bio || 'No bio yet.'}</div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="section-title">My Posts</h3>
          <div className="posts-grid">
            {myItems && myItems.length > 0 ? (
              myItems.map((item) => (
                <div key={item.id} className="post-card">
                  {/* Sold Badge Overlay */}
                  {item.sold && (
                    <div className="sold-badge">
                      <span>SOLD</span>
                    </div>
                  )}
                  {Array.isArray(item.imageUrls) && item.imageUrls.length > 0 ? (
                    <ImageSlider images={item.imageUrls} />
                  ) : (
                    item.imageUrls && <img src={item.imageUrls} alt="item" className="post-image" />
                  )}
                  <div className="post-content">
                    <p>{item.description || 'No description'}</p>
                    {item.category && (
                      <div className="post-meta">
                        <span>Category: {item.category}</span>
                      </div>
                    )}
                    {item.price && (
                      <div className="post-meta">
                        <span>Price: €{item.price}</span>
                      </div>
                    )}
                    {item.sold && item.soldPrice && (
                      <div className="post-meta">
                        <span className="sold-price">Sold for: {item.soldPrice}</span>
                      </div>
                    )}
                  </div>
                  <div className="profile-post-actions">
                    <button 
                      className="btn btn-outline" 
                      onClick={(e) => openEditItem(item, e)}
                      disabled={item.sold}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => confirmDeleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-posts">No posts yet.</div>
            )}
          </div>
        </div>

        {/* Settings Overlay */}
        {showSettings && (
          <div className="settings-overlay" onClick={handleSettingsOverlayClick}>
            <div className="settings-modal">
              <div className="settings-header">
                <h3 className="settings-title">Settings</h3>
                <button className="close-settings" onClick={closeSettings}>
                  ×
                </button>
              </div>
              <div className="settings-actions">
                <button className="btn btn-primary" onClick={openEdit}>
                  Edit Profile
                </button>
                <button className="btn btn-danger" onClick={handleLogout}>
                  Logout
                </button>
                <button className="btn btn-primary" onClick={handleEmailVerification} disabled={emailVerificationTimer > 0 || isEmailVerified}>
                  {isEmailVerified ? "Email Verified" : emailVerificationTimer > 0 ? `Resend in ${emailVerificationTimer}s` : `Resend Email Verification`}
                </button>
                <button
                  onClick={() => setOpen(true)}
                  className="delete-account-button btn btn-danger"
                >
                  Delete Account
                </button>

                <DeleteAccount isOpen={open} onClose={() => setOpen(false)} />
                <button className="btn btn-neutral" onClick={closeSettings}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={editing}
          onClose={closeEdit}
          profile={profile}
          onSave={saveProfile}
          onUploadPhoto={handlePhotoSelected}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />

        {/* Edit Item Modal */}
        <EditItemModal
          isOpen={!!editingItem}
          item={editingItem}
          onClose={closeEditItem}
          onSave={saveItemEdits}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="confirm-modal-overlay">
            <div className="confirm-modal">
              <div className="confirm-icon">⚠</div>
              <h2>Delete Post?</h2>
              <p>This action cannot be undone.</p>
              <div className="confirm-actions">
                <button 
                  className="btn btn-cancel" 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setItemToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-confirm-delete" 
                  onClick={deleteItem}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Success Modal */}
        {showDeleteSuccess && (
          <div className="success-modal-overlay">
            <div className="success-modal">
              <div className="success-icon">✓</div>
              <h2>Success!</h2>
              <p>{deleteSuccessMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;