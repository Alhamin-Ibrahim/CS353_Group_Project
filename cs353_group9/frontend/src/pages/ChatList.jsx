import React, { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/contexts'
import { db } from '../firebase'
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore'
import './ChatList.css'

export default function ChatList() {
  const { currentUser } = useContext(AuthContext)
  const [convos, setConvos] = useState([])
  const [userProfiles, setUserProfiles] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'conversations'),
      where('participantsArray', 'array-contains', currentUser.uid),
      orderBy('lastUpdated', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setConvos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, err => console.warn(err))
    return () => unsub()
  }, [currentUser])

  useEffect(() => {
    if (!convos.length) return
    let mounted = true
    const missing = new Set()
    convos.forEach(c => {
      const other = (c.participantsArray || []).find(u => u !== currentUser?.uid)
      if (other && !userProfiles[other]) missing.add(other)
    })
    if (!missing.size) return
    ;(async () => {
      const updates = {}
      for (const uid of missing) {
        try {
          const snap = await getDoc(doc(db, 'users', uid))
          updates[uid] = snap.exists() ? snap.data() : { missing: true }
        } catch {
          updates[uid] = { missing: true }
        }
      }
      if (mounted) setUserProfiles(prev => ({ ...prev, ...updates }))
    })()
    return () => { mounted = false }
  }, [convos, currentUser, userProfiles])

  const openChat = conv => {
    if (!currentUser) return
    const other = (conv.participantsArray || []).find(u => u !== currentUser.uid)
    if (!other) return
    navigate(`/chat/${other}`)
  }

  if (!currentUser) {
    return (
      <div className="chat-list-page">
        <div className="chat-list-container">
          Please sign in to view conversations.
        </div>
      </div>
    )
  }

  return (
    <div className="chat-list-page">
      <div className="chat-list-container">
        <div className="chat-list-header">Conversations</div>
        <div className="convo-area">
          {convos.length === 0 ? (
            <div className="no-convos">No conversations yet.</div>
          ) : (
            <div className="convo-list">
              {convos.map(c => {
                const other = (c.participantsArray || []).find(u => u !== currentUser.uid)
                const profile = other ? userProfiles[other] : null
                const displayName = profile ? (profile.name || 'Unknown User') : 'Loading...'
                const avatar = profile ? (profile.avatarUrl || profile.photoURL || profile.photoUrl) : null
                const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2D4343&color=fff&size=64`

                return (
                  <div
                    key={c.id}
                    className="convo-card"
                    onClick={() => openChat(c)}
                  >
                    <img className="convo-avatar" src={avatar || placeholder} alt={displayName} />
                    <div className="convo-info">
                      <div className="convo-name">{displayName}</div>
                      <div className="convo-last-message">{c.lastMessage || ''}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
