import React, { createContext, useContext, useState, useEffect, useContext as useReactContext } from "react";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../contexts/contexts"; // use your existing AuthContext

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favoriteItems, setFavoriteItems] = useState([]);
  const { currentUser } = useReactContext(AuthContext); // get current logged-in user

  // Load or initialize Firestore favorites when currentUser is available
  useEffect(() => {
    if (!currentUser) {
      setFavoriteItems([]);
      return;
    }

    const initFavorites = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setFavoriteItems(userData.favorites || []);
        } else {
          // Create user document if it doesn't exist
          await setDoc(userRef, { favorites: [] }, { merge: true });
          setFavoriteItems([]);
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
        setFavoriteItems([]);
      }
    };

    initFavorites();
  }, [currentUser]);

  //  Add item to favorites
  const addToFavorites = async (item) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      let existingFavorites = [];

      if (userSnap.exists()) {
        const userData = userSnap.data();
        existingFavorites = userData.favorites || [];
      }

      // Avoid duplicates
      if (!existingFavorites.find(i => i.id === item.id)) {
        const updatedFavorites = [...existingFavorites, item];
        setFavoriteItems(updatedFavorites); // update local state
        await updateDoc(userRef, { favorites: updatedFavorites });
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
    }
  };

  //  Remove item from favorites
  const removeFromFavorites = async (itemId) => {
    if (!currentUser) return;

    try {
      const updatedFavorites = favoriteItems.filter((item) => item.id !== itemId);
      setFavoriteItems(updatedFavorites);

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { favorites: updatedFavorites });
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  };

  //  Clear favorites
  const clearFavorites = async () => {
    if (!currentUser) return;

    try {
      setFavoriteItems([]);
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { favorites: [] });
    } catch (error) {
      console.error("Error clearing favorites:", error);
    }
  };

  return (
    <FavoritesContext.Provider value={{ favoriteItems, addToFavorites, removeFromFavorites, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
