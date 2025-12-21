import React, { useState } from "react";
import { useFavorites } from "../contexts/FavoritesContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import ContactSellerModal from "../components/ContactSeller";
import "./Favorites.css";

export default function Favorites() {
  const {
    favoriteItems,
    removeFromFavorites,
    clearFavorites
  } = useFavorites(); // ✅ clearFavorites restored

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sellerInfo, setSellerInfo] = useState(null);

  const handleItemClick = async (item) => {
    try {
      if (!item.userId) return;

      const sellerRef = doc(db, "users", item.userId);
      const sellerSnap = await getDoc(sellerRef);

      if (sellerSnap.exists()) {
        const sellerData = sellerSnap.data();
        setSellerInfo({
          name: sellerData.name || "User",
          phone: sellerData.phone || "Not provided",
          email: sellerData.email || "Not provided",
          message: (
            <a
              href={`/chat/${item.userId}`}
              className="text-blue-600 hover:underline"
            >
              Message Seller Here!
            </a>
          ),
        });
      } else {
        setSellerInfo({
          name: item.username || "User",
          phone: "Not provided",
          email: "Not provided",
          message: "Not provided",
        });
      }

      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch seller info:", err);
      alert("Failed to load seller information");
    }
  };

  return (
    <div className="favorites-page">
      <div className="favorites-container">
        <div className="favorites-header">
          <h1>Your Favorites </h1>
        </div>

        {favoriteItems.length === 0 ? (
          <p className="empty-favorites">Your favorites list is empty.</p>
        ) : (
          <>
            <div className="favorites-items">
              {favoriteItems.map((item) => (
                <div
                  key={item.id}
                  className="favorites-item"
                  onClick={() => handleItemClick(item)}
                  style={{ cursor: "pointer" }}
                >
                  {item.imageUrls && (
                    <img
                      src={
                        Array.isArray(item.imageUrls)
                          ? item.imageUrls[0]
                          : item.imageUrls
                      }
                      alt={item.description}
                      className="favorites-image"
                    />
                  )}

                  <div className="favorites-info">
                    <h3>{item.description}</h3>
                    {item.price && <p>€{Number(item.price).toFixed(2)}</p>}

                    <button
                      className="remove-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // prevents opening modal
                        removeFromFavorites(item.id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="clear-btn" onClick={clearFavorites}>
              Clear All Favorites
            </button>
          </>
        )}
      </div>

      {/* Modal */}
      <ContactSellerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        name={sellerInfo?.name}
        phone={sellerInfo?.phone}
        email={sellerInfo?.email}
        message={sellerInfo?.message}
      />
    </div>
  );
}
