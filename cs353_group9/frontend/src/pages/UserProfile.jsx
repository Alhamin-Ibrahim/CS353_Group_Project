import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/contexts'
import { db } from '../firebase'
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import './Profile.css'

export default function UserProfile() {
  const { uid } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useContext(AuthContext)

  const [profile, setProfile] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let unsub = () => {}
    async function load() {
      try {
        if (!uid) {
          setError('No user specified')
          setLoading(false)
          return
        }
        // Load user profile document
        const userRef = doc(db, 'users', uid)
        const snap = await getDoc(userRef)
        const data = snap.exists() ? snap.data() : {}
        setProfile({
          name: data.name || 'User',
          email: data.email || '',
          bio: data.bio || '',
          phone: data.phone || '',
          avatarUrl: data.avatarUrl || '/test.png',
        })

        // Subscribe to user's items
        const q = query(
          collection(db, 'items'),
          where('userId', '==', uid),
          orderBy('createdAt', 'desc')
        )
        unsub = onSnapshot(q, (s) => {
          setItems(s.docs.map((d) => ({ id: d.id, ...d.data() })))
        })
      } catch (err) {
        console.error('Failed to load user profile:', err)
        setError('Failed to load user')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => unsub()
  }, [uid])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-lg">Loading…</div>
  if (error) return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">User</h2>
      <p className="text-red-500 mb-4">{error}</p>
      <button onClick={() => navigate('/home')} className="btn btn-primary">Back to Home</button>
    </div>
  )

  const isMe = currentUser?.uid === uid

  return (
    <div className="ig-profile max-w-4xl mx-auto p-6 bg-white my-8 rounded-lg shadow-sm">
      <div className="profile-top flex flex-col md:flex-row gap-6 items-start">
        <div className="avatar-col flex-shrink-0">
          <img src={profile?.avatarUrl || '/test.png'} alt="avatar" className="profile-avatar-large" />
        </div>

        <div className="flex-1">
          <div className="mb-4">
            <h2 className="username text-3xl font-light mb-4">{profile?.name || 'User'}</h2>
            <div className="flex">
              <div className="flex items-center mr-10">
                <span className="font-semibold">{items.length}</span>
                <span className="ml-2 text-gray-600"> posts</span>
              </div>
            </div>
          </div>

          <div className="bio text-sm text-gray-800 mb-2 flex items-center gap-8">
            <div>
              <strong>Contact:</strong> {profile?.email}
            </div>
            {profile?.phone && (<div>{profile.phone}</div>)}
          </div>
          <div className="bio text-sm text-gray-700">{profile?.bio || 'No bio yet.'}</div>

          {isMe && (
            <div className="profile-actions mb-4 mt-4 flex gap-3">
              <button className="btn btn-primary" onClick={() => navigate('/profile')}>Go to my profile</button>
              <button className="btn" onClick={() => navigate('/upload')}>Upload</button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="section-title mb-4">Posts</h3>
        <div className="posts-grid">
          {items && items.length > 0 ? (
            items.map(item => (
              <div key={item.id} className="post-card">
                {Array.isArray(item.imageUrls) ? (
                  item.imageUrls.length > 0 ? (
                    <img src={item.imageUrls[0]} alt="Post" className="post-image" />
                  ) : (
                    <div className="post-placeholder">Post</div>
                  )
                ) : (
                  item.imageUrls ? (
                    <img src={item.imageUrls} alt="Post" className="post-image" />
                  ) : (
                    <div className="post-placeholder">Post</div>
                  )
                )}
                <div className="post-content">
                  <p>{item.description || 'No description'}</p>
                  {item.category && (
                    <div className="post-meta"><span>Category: {item.category}</span></div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-posts">No posts yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
