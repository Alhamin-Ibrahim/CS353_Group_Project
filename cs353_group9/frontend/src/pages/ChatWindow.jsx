// ChatWindow.js — updated: profile link in card messages (routes to /user/:userId)
import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/contexts';
import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  runTransaction,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import './ChatWindow.css';

function makeConversationId(a, b) {
  return [a, b].sort().join('_');
}

export default function ChatWindow() {
  const { uid: otherUid } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);
  const [otherItems, setOtherItems] = useState([]);
  const [modalSelectedItemId, setModalSelectedItemId] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [itemCache, setItemCache] = useState({});
  const [acceptConfirm, setAcceptConfirm] = useState(null);
  const [acceptInProgress, setAcceptInProgress] = useState(false);
  const listRef = useRef(null);

  // Load other user
  useEffect(() => {
    if (!otherUid) return;
    getDoc(doc(db, 'users', otherUid))
      .then(snap => setOther(snap.exists() ? snap.data() : { name: 'User' }))
      .catch(e => console.warn('Failed to load user', e));
  }, [otherUid]);

  // Load other user's items (only non-sold items)
  useEffect(() => {
    if (!otherUid) return;
    const q = query(collection(db, 'items'), where('userId', '==', otherUid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, s => {
      // Filter out sold items
      const items = s.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => !item.sold);
      setOtherItems(items);
    }, err => console.warn(err));
    return () => unsub();
  }, [otherUid]);

  // Subscribe to messages
  useEffect(() => {
    if (!currentUser || !otherUid) return;
    const convoId = makeConversationId(currentUser.uid, otherUid);
    const convoRef = doc(db, 'conversations', convoId);

    let unsub = () => {};
    const ensureAndSubscribe = async () => {
      try {
        const c = await getDoc(convoRef).catch(() => null);
        if (!c || !c.exists()) {
          await setDoc(convoRef, {
            participantsArray: [currentUser.uid, otherUid].sort(),
            unreadCounts: { [currentUser.uid]: 0, [otherUid]: 0 },
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
          });
        } else {
          // Ensure unreadCounts field exists for existing conversations
          const data = c.data();
          if (!data.unreadCounts) {
            await updateDoc(convoRef, { 
              unreadCounts: { [currentUser.uid]: 0, [otherUid]: 0 }
            }).catch(() => {});
          }
        }
        // Mark all messages as read when opening the chat
        await updateDoc(convoRef, { [`unreadCounts.${currentUser.uid}`]: 0 }).catch(() => {});

        const msgsRef = collection(db, 'conversations', convoId, 'messages');
        const q = query(msgsRef, orderBy('createdAt', 'asc'));
        unsub = onSnapshot(q, snap => {
          setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
        }, err => console.warn(err));
      } catch (err) {
        console.warn(err);
      }
    };
    ensureAndSubscribe();
    return () => { try { unsub(); } catch { /* ignore */ } };
  }, [currentUser, otherUid]);

  // Cache items for card messages
  useEffect(() => {
    const itemIds = Array.from(new Set(messages.map(m => m.card?.itemId).filter(Boolean)));
    const missing = itemIds.filter(id => !(id in itemCache));
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const updates = {};
      for (const id of missing) {
        try {
          const d = await getDoc(doc(db, 'items', id));
          updates[id] = d.exists() ? d.data() : null;
        } catch {
          updates[id] = null;
        }
      }
      if (!cancelled) setItemCache(prev => ({ ...prev, ...updates }));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

const handleSend = async () => {
  if (!text.trim() || !currentUser) return;

  const messageText = text.trim(); // store trimmed text
  setText(''); // clear input immediately

  const convoId = makeConversationId(currentUser.uid, otherUid);
  const msgsRef = collection(db, 'conversations', convoId, 'messages');

  try {
    // Add message to Firestore
    await addDoc(msgsRef, { 
      text: messageText, 
      senderId: currentUser.uid, 
      createdAt: serverTimestamp(), 
      type: 'text' 
    });

    // Update conversation metadata
    const convoRef = doc(db, 'conversations', convoId);
    const convoSnap = await getDoc(convoRef);
    const currentUnread = convoSnap.exists() ? (convoSnap.data().unreadCounts?.[otherUid] || 0) : 0;
    await updateDoc(convoRef, {
      lastMessage: messageText,
      lastUpdated: serverTimestamp(),
      lastSender: currentUser.uid,
      [`unreadCounts.${otherUid}`]: currentUnread + 1,
      [`unreadCounts.${currentUser.uid}`]: 0,
    });
  } catch (e) {
    console.error('Send failed', e);
    // Optionally, show a toast or notification that sending failed
  }
};


  // send listing card 
  const handleSendCard = async () => {
    if (!currentUser) return;
    const selected = otherItems.find(i => i.id === modalSelectedItemId);
    if (!selected) { 
      alert('Select a listing'); 
      return; 
    }

    // always store offeredPrice as a string for consistency
    let offeredPriceValue = '';
    if (offerPrice.trim()) {
      // remove any existing $ signs and convert to number
      const cleanPrice = offerPrice.replace(/[$€]/g, '').trim();
      const numericPrice = Number(cleanPrice);
      if (!isNaN(numericPrice) && numericPrice > 0) {
        offeredPriceValue = `€${numericPrice}`;
      } else {
        // if not a valid number store the original input
        offeredPriceValue = offerPrice.trim();
      }
    }

    const cardPayload = {
      itemId: selected.id,
      imageUrl: Array.isArray(selected.imageUrls) ? selected.imageUrls[0] || null : selected.imageUrls || null,
      title: selected.title || selected.description || 'Listing',
      priceText: selected.price ? (typeof selected.price === 'number' ? `€${selected.price}` : selected.price) : selected.priceText || null,
      offeredPrice: offeredPriceValue, // always a string or empty string
    };

    const convoId = makeConversationId(currentUser.uid, otherUid);
    try {
      // include senderId so the link and profile navigation can use it
      await addDoc(collection(db, 'conversations', convoId, 'messages'), { 
        senderId: currentUser.uid, 
        createdAt: serverTimestamp(), 
        type: 'card', 
        card: cardPayload 
      });
      
      const convoRef = doc(db, 'conversations', convoId);
      const convoSnap = await getDoc(convoRef);
      const currentUnread = convoSnap.exists() ? (convoSnap.data().unreadCounts?.[otherUid] || 0) : 0;
      
      await updateDoc(convoRef, {
        lastMessage: offeredPriceValue ? `[Offer] ${cardPayload.title} — Offer: ${offeredPriceValue}` : `[Listing] ${cardPayload.title}`,
        lastUpdated: serverTimestamp(),
        lastSender: currentUser.uid,
        [`unreadCounts.${otherUid}`]: currentUnread + 1,
        [`unreadCounts.${currentUser.uid}`]: 0,
      });
      
      setModalSelectedItemId(null); 
      setOfferPrice(''); 
      setShowCardModal(false);
    } catch (e) { 
      console.warn('non-critical error sending offer (message may have sent):', e); 

      // still reset the form even if there's an error
      setModalSelectedItemId(null); 
      setOfferPrice(''); 
      setShowCardModal(false);
    }
  };
 
  // Accept offer
  const handleAcceptOffer = async (convId, msgId, itemId) => {
    if (!currentUser) return;
    setAcceptInProgress(true);
    try {
      await runTransaction(db, async tx => {
        const itemRef = doc(db, 'items', itemId);
        const msgRef = doc(db, 'conversations', convId, 'messages', msgId);
        const convoRef = doc(db, 'conversations', convId);

        const itemSnap = await tx.get(itemRef); if (!itemSnap.exists()) throw new Error('Item not found');
        const item = itemSnap.data(); if (item.userId !== currentUser.uid) throw new Error('Only owner can accept'); if (item.sold) throw new Error('Already sold');

        const msgSnap = await tx.get(msgRef); if (!msgSnap.exists()) throw new Error('Message not found');
        const msg = msgSnap.data(); if (msg.type !== 'card' || !msg.card) throw new Error('Not a card'); if (msg.card.accepted) throw new Error('Offer already accepted');

        const buyerId = msg.senderId;
        const offeredPrice = msg.card.offeredPrice || null;

        tx.update(itemRef, { sold: true, buyerId, soldPrice: offeredPrice, soldAt: serverTimestamp() });
        tx.update(msgRef, { 'card.accepted': true, 'card.acceptedBy': currentUser.uid, 'card.acceptedAt': serverTimestamp() });
        tx.update(convoRef, { lastMessage: 'Offer accepted', lastUpdated: serverTimestamp() });
      });
      setItemCache(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || {}), sold: true, buyerId: true } }));
    } catch (e) { console.error(e); alert(e.message || 'Failed to accept offer'); }
    finally { setAcceptInProgress(false); setAcceptConfirm(null); }
  };

  const confirmAccept = async () => { if (!acceptConfirm) return; const { convId, msgId, itemId } = acceptConfirm; await handleAcceptOffer(convId, msgId, itemId); };

  if (!currentUser) return <div className="chat-page"><div>Please sign in to chat.</div></div>;

  return (
    <div className="chat-page">
      <div className="chat-window">
        {/* Header */}
        <div className="chat-header">
          <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
          <div className="user-info" onClick={() => navigate(`/user/${otherUid}`)} style={{ cursor: 'pointer' }}>
            <img src={other?.avatarUrl || '/placeholder.png'} alt="Profile" className="profile-pic" />
            <strong>{other?.name || 'User'}</strong>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map(m => (
            <div key={m.id} className={`message-row ${m.senderId === currentUser.uid ? 'sent' : 'received'}`}>
              <div className={`message-bubble ${m.senderId === currentUser.uid ? 'sent' : 'received'}`}>
                {m.type === 'card' && m.card ? (
                  <div className="card-message">
                    <div className="card-image">
                      {m.card.imageUrl ? <img src={m.card.imageUrl} alt={m.card.title || 'Listing'} /> : <div className="no-image">No image</div>}
                    </div>
                    <div className="card-content">
                      <div className="card-title">{m.card.title}</div>
                      {m.card.priceText && <div className="card-price">{m.card.priceText}</div>}
                      {m.card.offeredPrice && <div className="card-offer">Offer: {m.card.offeredPrice}</div>}
                              {/* Only show "View Seller Profile" if current user is NOT the seller */}
                              {m.card.itemId && itemCache[m.card.itemId]?.userId !== currentUser.uid && (
                                <Link
                                  to={`/user/${itemCache[m.card.itemId]?.userId}`}
                                  className="view-profile-button"
                                >
                                  View Seller Profile
                                </Link>
                              )}


                      {m.card.itemId && itemCache[m.card.itemId]?.userId === currentUser.uid && !m.card.accepted && !itemCache[m.card.itemId]?.sold &&
                        <div className="card-actions">
                          <button onClick={() => setAcceptConfirm({ convId: makeConversationId(currentUser.uid, otherUid), msgId: m.id, itemId: m.card.itemId })} disabled={acceptInProgress}>{acceptInProgress && acceptConfirm?.msgId===m.id ? 'Accepting...' : 'Accept Offer'}</button>
                        </div>
                      }
                      {m.card.accepted && <div className="card-accepted">Offer accepted</div>}
                    </div>
                  </div>
                ) : (
                  <div>{m.text}</div>
                )}
                <div className="message-time">{m.createdAt?.toDate ? new Date(m.createdAt.toDate()).toLocaleString() : ''}</div>
              </div>
            </div>
          ))}
          <div ref={listRef}></div>
        </div>

        {/* Input */}
        <div className="chat-input-container">
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a message..." />
          <button className="upload-button" style={{ width: '20%' }} onClick={handleSend}>Send</button>
          <button className="upload-button" style={{ width: '20%' }} onClick={() => setShowCardModal(true)}>Send Listing</button>
        </div>

        {/* Send Listing Modal */}
        {showCardModal && (
          <div className="modal-overlay">
            <div className="modal-content modal-content-large">
              <h3>Send a listing as an offer</h3>
              <div className="modal-flex">
                {/* Left: List of items */}
                <div className="modal-list">
                  {otherItems.length ? otherItems.map(it => (
                    <div key={it.id} className={`modal-list-item ${modalSelectedItemId===it.id?'selected':''}`} onClick={() => setModalSelectedItemId(it.id)}>
                      <div className="modal-list-item-image small-image">
                        {it.imageUrls?.[0] ? <img src={it.imageUrls[0]} alt={it.title} /> : <div className="no-image">No image</div>}
                      </div>
                      <div className="item-title">{it.title || it.description || 'Listing'}</div>
                      <div className="item-price">{it.price ? (typeof it.price==='number'?`€${it.price}`:it.price):it.priceText||''}</div>
                    </div>
                  )) : <div>No listings to choose from.</div>}
                </div>

                {/* Right: Selected item */}
                <div className="modal-selected">
                  {modalSelectedItemId ? (() => {
                    const sel = otherItems.find(i=>i.id===modalSelectedItemId);
                    if(!sel) return <div>Selected item not found</div>;
                    return (
                      <div className="modal-selected-box">
                        <div className="modal-selected-image small-image">
                          {sel.imageUrls?.[0] ? <img src={sel.imageUrls[0]} alt={sel.title} /> : <div className="no-image">No image</div>}
                        </div>
                            <div className="modal-selected-price">{sel.price ? (typeof sel.price==='number'?`€${sel.price}`:sel.price):sel.priceText||''}</div>
                            <div className="modal-selected-description">{sel.description}</div>
                          </div>
                    );
                  })() : <div>Please select a listing.</div>}

                  <div className="modal-form">
                    <label>Offer price</label>
                    <input value={offerPrice} onChange={e=>setOfferPrice(e.target.value)} placeholder="e.g. 50 or €50" />
                  </div>
                  <div className="modal-buttons">
                    <button className="btn" onClick={()=>{setShowCardModal(false); setModalSelectedItemId(null); setOfferPrice('')}}>Cancel</button>
                    <button className="upload-button" onClick={handleSendCard}>Send Offer</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accept Offer Modal */}
        {acceptConfirm && (
          <div className="modal-overlay accept-modal">
            <div className="modal-content">
              <h3>Confirm Accept Offer</h3>
              <div>Are you sure you want to accept this offer? This will mark the item as sold.</div>
              <div className="modal-buttons">
                <button className="btn" onClick={()=>setAcceptConfirm(null)} disabled={acceptInProgress}>Cancel</button>
                <button className="upload-button" onClick={confirmAccept} disabled={acceptInProgress}>{acceptInProgress?'Accepting...':'Confirm Accept'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
