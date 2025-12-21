import React, {useContext, useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

const AuthContext = React.createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({children}) {
    const [currentUser, setCurrentUser] = useState()
    const [loading, setLoading] = useState(true)

    async function register(username, email, password){
                return createUserWithEmailAndPassword(auth, email, password)
                .then(async (userCredential) => {
                        const user = userCredential.user

                        // Set display name on Auth profile
                        await updateProfile(user, {
                                displayName: username
                        })

                        // Create a Firestore users/{uid} document (does NOT store password)
                        try {
                            const userRef = doc(db, 'users', user.uid)
                            await setDoc(userRef, {
                                name: username,
                                email: email,
                                avatarUrl: user.photoURL || null,
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                            }, { merge: true })
                        } catch (err) {
                            console.error('Failed to create user document in Firestore:', err)
                        }
                })
    }

    function login(email, password){
        return signInWithEmailAndPassword(auth, email, password)
    }

    useEffect(() =>{
        const unsubscribe = onAuthStateChanged(auth, user => {
                        setCurrentUser(user)
                        // Ensure a users/{uid} doc exists (migration / sign-in flow)
                        (async () => {
                            if (user) {
                                try {
                                    const userRef = doc(db, 'users', user.uid)
                                    const snap = await getDoc(userRef)
                                    if (!snap.exists()) {
                                        await setDoc(userRef, {
                                            name: user.displayName || null,
                                            email: user.email || null,
                                            avatarUrl: user.photoURL || null,
                                            createdAt: serverTimestamp(),
                                            updatedAt: serverTimestamp()
                                        }, { merge: true })
                                    } else {
                                        //  UYpdates last seen timestamp
                                        await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true })
                                    }
                                } catch (err) {
                                    console.error('Error ensuring user document exists:', err)
                                }
                            }
                            setLoading(false)
                        })()
        })
        return unsubscribe
    }, [])

    const value = {
        currentUser,
        register,
        login
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
