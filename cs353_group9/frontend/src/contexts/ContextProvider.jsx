import React, { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, updateProfile, signOut, sendEmailVerification } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { AuthContext, PostContext } from './contexts'

// Auth provider component only (no createContext here to keep Fast Refresh happy)
function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState()
  const [loading, setLoading] = useState(true)

  async function register(username, email, password) {
    return createUserWithEmailAndPassword(auth, email, password).then(async (userCredential) => {
      const user = userCredential.user
      await updateProfile(user, { displayName: username })
      
      // Create user document in Firestore
      try {
        const userRef = doc(db, 'users', user.uid)
        await setDoc(userRef, {
          name: username,
          email: email,
          avatarUrl: null,
          bio: '',
          phone: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }, { merge: true })
      } catch (err) {
        console.error('Failed to create user document in Firestore:', err)
      }
      
      await sendEmailVerification(user)
    })
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function logout(){
          return signOut(auth)
  }

function emailVerification(){
  return sendEmailVerification(auth.currentUser)
}

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = { currentUser, register, login, logout, emailVerification }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

// Posts provider component only
function PostProvider({ children }) {
  const [posts, setPosts] = useState([]);

  // Fetch posts from Firestore
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        
        const q = query(
          collection(db, 'items'),
          orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedPosts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log('PostProvider - fetched posts from Firestore:', fetchedPosts);
          setPosts(fetchedPosts);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading posts:', error);
      }
    };
    
    loadPosts();
  }, []);

  console.log('PostProvider - current posts:', posts);

  const createPost = async (newPost) => {
    return new Promise((resolve) => {
      setPosts((prev) => {
        const updated = [newPost, ...prev]
        console.log('Creating new post, updated posts:', updated);
        resolve(updated)
        return updated
      })
    })
  }

  const value = { posts, createPost }

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>
}

// Convenience wrapper that provides both contexts
export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <PostProvider>{children}</PostProvider>
    </AuthProvider>
  )
}

export default AppProviders
