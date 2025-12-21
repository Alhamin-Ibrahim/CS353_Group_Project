import React, { useState, useEffect } from 'react';
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query, doc, getDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate, Link } from 'react-router-dom';
import './Home.css';
import ImageSlider from '../components/ImageSlider';
import ContactSellerModal from '../components/ContactSeller';
import { useFavorites } from '../contexts/FavoritesContext';

export default function Home() {
  const [showCategoryPrompt, setShowCategoryPrompt] = useState(true);
  const [tempCategories, setTempCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isPriceRangeOpen, setIsPriceRangeOpen] = useState(true);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6); // Number of posts to show initially
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingItem, setReportingItem] = useState(null);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [reportReason, setReportReason] = useState('');
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sellerInfo, setSellerInfo] = useState(null);
  const [isContactToastOpen, setIsContactToastOpen] = useState(false);
  const { favoriteItems, addToFavorites, removeFromFavorites } = useFavorites();

  // Check if an item is in favorites
  const isFavorited = (itemId) => {
    return favoriteItems.some(favItem => favItem.id === itemId);
  };

  // Toggle favorite status
  const toggleFavorite = async (item, e) => {
    e.stopPropagation();
    
    // Prevents users from favoriting their own posts
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser && item.userId === currentUser.uid) {
      return; // Don't allow favoriting own posts
    }
    
    if (isFavorited(item.id)) {
      await removeFromFavorites(item.id);
    } else {
      await addToFavorites(item);
    }
  };


  // Fetch user category preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const prefs = userDoc.data().categoryPreferences || [];
            if (prefs.length > 0) {
              setSelectedCategories(prefs);
              setShowCategoryPrompt(false);
            }
          }
        }
      } catch (e) {
        console.warn("Failed to fetch user preferences", e);
      }
      setIsLoadingPrefs(false);
    };
    fetchPreferences();
  }, []);

  // Define categories - matching Upload page
  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'ticket', label: 'Tickets & Events' },
    { value: 'textbooks', label: 'Books & Materials' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Build a set of userIds that are missing inline usernames so we can fetch them
      const missingUids = Array.from(new Set(
        list.filter((it) => !it.username && it.userId).map((it) => it.userId)
      ));

      const userMap = {};
      await Promise.all(
        missingUids.map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, "users", uid));
            if (snap.exists()) {
              const data = snap.data();
              userMap[uid] = data.name || data.email || "User";
            }
          } catch (e) {
            console.warn("Failed to fetch user doc for uid", uid, e);
          }
        })
      );

      const enriched = list.map((it) => ({
        ...it,
        username: it.username || (it.userId && userMap[it.userId]) || "User",
      }));

      setItems(enriched);
    });
    return unsubscribe;
  }, []);

  // Calculate total available items (non-sold)
  const availableItems = items.filter(item => !item.sold);

  // Filter items based on category and search query
  useEffect(() => {
    let filtered = items;

    // Filter out sold items
    filtered = filtered.filter(item => !item.sold);

    // Debug: Log all unique categories
    const uniqueCategories = [...new Set(filtered.map(item => item.category).filter(Boolean))];
    console.log('Available categories in items:', uniqueCategories);

    // Filter by category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.category) return false;
        const itemCat = item.category.toLowerCase().trim();
        // Exact match
        return selectedCategories.some(cat => cat.toLowerCase().trim() === itemCat);
      });
      console.log(`Filtered by category "${selectedCategories}":`, filtered.length, 'items');
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(item =>
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by price range
    filtered = filtered.filter(item => {
      const itemPrice = parseFloat(item.price) || 0;
      return itemPrice >= minPrice && itemPrice <= maxPrice;
    });

    setFilteredItems(filtered);
    setVisibleCount(6); // Reset visible count when filters/search change
  }, [items, selectedCategories, searchQuery, minPrice, maxPrice]);

  

  const handleUploadClick = () => {
    console.log("Navigating to upload page from dashboard...");
    navigate("/upload");
  };

  // Category selection popup modal
  const handleApplyFilters = async () => {
    // If no categories selected, show an alert or just close without saving
    if (tempCategories.length === 0) {
      alert("Please select at least one category to apply filters");
      return;
    }
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { categoryPreferences: tempCategories }, { merge: true });
      }
    } catch (e) {
      console.warn("Failed to save user preferences", e);
    }
    setSelectedCategories(tempCategories);
    setShowCategoryPrompt(false);
  };

  const handleReportClick = (item, e) => {
    e.stopPropagation();
    setReportingItem(item);
    setReportModalOpen(true);
    setReportReason('');
  };

  const handleSubmitReport = async () => {
    if (!reportReason) {
      alert('Please select a reason for reporting');
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        alert('You must be logged in to report a post');
        return;
      }

      // Get the current item data
      const itemRef = doc(db, 'items', reportingItem.id);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        alert('This post no longer exists.');
        setReportModalOpen(false);
        return;
      }

      const itemData = itemDoc.data();
      const reports = itemData.reports || [];
      
      // Check if user already reported
      if (reports.some(r => r.userId === user.uid)) {
        alert('You have already reported this post.');
        setReportModalOpen(false);
        return;
      }

      // Add new report to the array
      const newReport = {
        userId: user.uid,
        reason: reportReason,
        reportedAt: new Date().toISOString()
      };
      
      const updatedReports = [...reports, newReport];
      
      console.log(`Item ${reportingItem.id} now has ${updatedReports.length} reports`);

      // If 2 or more reports, delete the item
      if (updatedReports.length >= 2) {
        console.log('Threshold reached, deleting item:', reportingItem.id);
        
        // Delete the item from items collection
        await deleteDoc(itemRef);
        console.log('Item deleted successfully');
        
        alert('Report submitted. This post has been removed due to multiple reports.');
      } else {
        // Update item with new reports array
        await updateDoc(itemRef, {
          reports: updatedReports
        });
        
        alert('Report submitted successfully. Thank you for keeping our community safe!');
      }
      
      setReportModalOpen(false);
      setReportingItem(null);
      setReportReason('');
    } catch (error) {
      console.error('Error submitting report:', error);
      console.error('Error details:', error.message);
      alert(`Failed to submit report: ${error.message}\n\nPlease update your Firestore security rules to allow updates to items.`);
    }
  };

  const CategoryPrompt = () => (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Select Categories</h2>
        <div className="modal-checkbox-list">
          {categories.map(cat => (
            <label key={cat.value} className="modal-checkbox-option">
              <input
                type="checkbox"
                value={cat.value}
                checked={tempCategories.includes(cat.value)}
                onChange={(e) => {
                  const value = e.target.value;
                  if (tempCategories.includes(value)) {
                    setTempCategories(tempCategories.filter(c => c !== value));
                  } else {
                    setTempCategories([...tempCategories, value]);
                  }
                }}
              />
              {cat.label}
            </label>
          ))}
        </div>
        <button
          className="modal-confirm-btn"
          onClick={handleApplyFilters}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  const ReportModal = () => (
    <div className="modal-overlay" onClick={() => setReportModalOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <h2>Report Post</h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Help us keep the community safe by reporting inappropriate content.
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Reason for reporting *
          </label>
          <select 
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '6px', 
              border: '1px solid #ccc',
              fontSize: '14px'
            }}
          >
            <option value="">Select a reason...</option>
            <option value="illegal">Illegal content or activity</option>
            <option value="inappropriate">Inappropriate or offensive</option>
            <option value="scam">Scam or fraud</option>
            <option value="spam">Spam</option>
            <option value="misleading">Misleading information</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setReportModalOpen(false)}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitReport}
            className="modal-confirm-btn"
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: '#dc2626',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoadingPrefs) {
    return null; // or a loading spinner if you prefer
  }

  if (isLoadingPrefs) {
    return null; // or a loading spinner if you prefer
  }

  return (
    <>
      {showCategoryPrompt && <CategoryPrompt />}
      {reportModalOpen && <ReportModal />}
      {/* ...existing code... */}
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="header-search-wrapper">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <svg
                className="search-icon"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button onClick={handleUploadClick} className="upload-button-header">Upload Item</button>
          </div>
        </div>
         <button
    className="contact-fab"
    onClick={() => setIsContactToastOpen(prev => !prev)}
    aria-label="Contact support"
  >
    ?
  </button>

  {isContactToastOpen && (
    <div className="contact-toast">
      <button
        className="contact-toast-close"
        onClick={() => setIsContactToastOpen(false)}
        aria-label="Close contact info"
      >
        ×
      </button>

      <h4>Need help?</h4>
      <p>
        Email:{" "}
        <a href="mailto:support@sellify.com">
          support@sellify.com
        </a>
      </p>
      <p>
        Phone:{" "}
        <a href="tel:+35312345678">
          +353 1 234 5678
        </a>
      </p>
    </div>
  )}

        {/* Main Content Area with Sidebar */}
        <div className="content-wrapper">
          {/* Sidebar Toggle Button - Only show when sidebar is closed */}
          {!isSidebarOpen && (
            <button 
              className="sidebar-toggle-home"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open filters"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          )}

          {/* Sidebar */}
          <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <div className="sidebar-header-left">
                <button 
                  className="sidebar-toggle-inside"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Toggle filters"
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
                <h2>Filters</h2>
              </div>
              <button 
                className="sidebar-close"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close filters"
              >
                ×
              </button>
            </div>

            <div className="sidebar-content">
              {/* Category Filter */}
              <div className="filter-group">
                <h3 
                  className="filter-group-header"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                >
                  Category
                  <span className={`dropdown-arrow ${isCategoryOpen ? 'open' : ''}`}>
                    ▼
                  </span>
                </h3>
                {isCategoryOpen && (
                  <div className="category-list">
                    {/* All option */}
                    <label className="category-option">
                      <input
                        type="checkbox"
                        checked={selectedCategories.length === 0}
                        onChange={() => setSelectedCategories([])}
                      />
                      <span>All</span>
                    </label>
                    {categories.map(cat => (
                      <label key={cat.value} className="category-option">
                        <input
                          type="checkbox"
                          value={cat.value}
                          checked={selectedCategories.includes(cat.value)}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (selectedCategories.includes(value)) {
                              setSelectedCategories(selectedCategories.filter(c => c !== value));
                            } else {
                              setSelectedCategories([...selectedCategories, value]);
                            }
                          }}
                        />
                        <span>{cat.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range Filter */}
              <div className="filter-group">
                <h3 
                  className="filter-group-header"
                  onClick={() => setIsPriceRangeOpen(!isPriceRangeOpen)}
                >
                  Price Range
                  <span className={`dropdown-arrow ${isPriceRangeOpen ? 'open' : ''}`}>
                    ▼
                  </span>
                </h3>
                {isPriceRangeOpen && (
                  <div className="price-range-container">
                    <div className="price-inputs">
                      <div className="price-input-group">
                        <label>Min: ${minPrice}</label>
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="10"
                          value={minPrice}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value <= maxPrice) {
                              setMinPrice(value);
                            }
                          }}
                          className="price-slider"
                        />
                      </div>
                      <div className="price-input-group">
                        <label>Max: ${maxPrice}</label>
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="10"
                          value={maxPrice}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value >= minPrice) {
                              setMaxPrice(value);
                            }
                          }}
                          className="price-slider"
                        />
                      </div>
                    </div>
                    <div className="price-range-display">
                      ${minPrice} - ${maxPrice}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Clear Filters Button */}
            {(selectedCategories.length > 0 || searchQuery || minPrice > 0 || maxPrice < 1000) && (
              <div className="sidebar-footer">
                <button 
                  onClick={() => {
                    setSelectedCategories([]);
                    setSearchQuery('');
                    setMinPrice(0);
                    setMaxPrice(1000);
                  }}
                  className="clear-filters-btn"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <div className="main-content">
            {/* Results Info */}
            <div className="results-info">
              <span>Showing {filteredItems.length} of {availableItems.length} items</span>
            </div>

            <div className="posts-grid">
              {filteredItems && filteredItems.length > 0 ? (
                filteredItems.slice(0, visibleCount).map(item => (
                  <div 
                    key={item.id} 
                    className="post-card" 
                    //onClick={() => item.userId && navigate(`/user/${item.userId}`)}
                    style={{ cursor: item.userId ? 'pointer' : 'default' }}
                  >
                    {/* Favorite Button */}
                    <button
                      className={`favorite-btn ${isFavorited(item.id) ? 'favorited' : ''} ${(() => {
                        const auth = getAuth();
                        const currentUser = auth.currentUser;
                        return currentUser && item.userId === currentUser.uid ? 'disabled' : '';
                      })()}`}
                      onClick={(e) => toggleFavorite(item, e)}
                      title={(() => {
                        const auth = getAuth();
                        const currentUser = auth.currentUser;
                        if (currentUser && item.userId === currentUser.uid) {
                          return 'Cannot favorite your own post';
                        }
                        return isFavorited(item.id) ? 'Remove from favorites' : 'Add to favorites';
                      })()}
                      disabled={(() => {
                        const auth = getAuth();
                        const currentUser = auth.currentUser;
                        return currentUser && item.userId === currentUser.uid;
                      })()}
                    >
                      {isFavorited(item.id) ? '❤️' : '🤍'}
                    </button>

                    {/* Display multiple images if available */}
                    {Array.isArray(item.imageUrls) && item.imageUrls.length > 0 ? (
                      <ImageSlider images={item.imageUrls} />
                    ) : (
                      item.imageUrls && <img src={item.imageUrls} alt="item" className="post-image" />
                    )}
      

              <div className="post-content">
                      <p>{item.description}</p>
                      
                      {/* ✅ Show category */}
                      {item.category && (
                        <span className="item-category-badge">{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                      )}
      
                
                      {/* ✅ Show original price text */}
                      {item.priceText && (
                        <p className="item-price">€ {item.priceText}</p>
                      )}

                <div className="post-meta">
                        {item.userId ? (
                          <span>
                            Posted by: <Link to={`/user/${item.userId}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>{item.username || 'User'}</Link>
                          </span>
                        ) : (
                          <span>Posted by: {item.username || 'User'}</span>
                        )}
                        {item.createdAt && (
                          <span>
                            {item.createdAt?.toDate
                              ? new Date(item.createdAt.toDate()).toLocaleDateString()
                              : new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/*Buy Button */} 
                      <div className="post-buttons">
                      <button
                        className='upload-button' //to match other button (using same css)
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            // Fetch seller info from Firestore
                            const sellerRef = doc(db, 'users', item.userId);
                            const sellerSnap = await getDoc(sellerRef);
                            
                            if (sellerSnap.exists()) {
                              const sellerData = sellerSnap.data();
                              setSellerInfo({
                                name: sellerData.name || 'User',
                                phone: sellerData.phone || 'Not provided',
                                email: sellerData.email || 'Not provided',
                                message: <Link to={`/chat/${item.userId}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>{"Message Seller Here!"}</Link>
                              });
                            } else {
                              setSellerInfo({
                                name: item.username || 'User',
                                phone: 'Not provided',
                                email: 'Not provided',
                                message: 'Not provided'
                              });
                            }
                            setIsModalOpen(true);
                          } catch (error) {
                            console.error('Error fetching seller info:', error);
                            alert('Failed to load seller information');
                          }
                        }}
                        //style={upload-button}
                      >
                        Contact Seller
                      </button>
                        <button
                          onClick={(e) => handleReportClick(item, e)}
                          style={{
                            padding: '12px 24px',
                            borderRadius: '10px',
                            border: '1px solid #dc2626',
                            background: 'white',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '700',
                            transition: 'all 0.3s ease',
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)',
                            height: '80px',
                          }}
                          onMouseOver={(e) => {
                            e.target.style.background = '#dc2626';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.color = '#dc2626';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.2)';
                          }}
                          title="Report this post"
                        >
                          🚩 Report
                        </button>
                      </div>
                    </div>
                  </div>  
                ))
              ) : (
                <p className="no-posts">No items yet. Be the first to share something!</p>
              )}
              <ContactSellerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                name={sellerInfo?.name}
                phone={sellerInfo?.phone}
                email={sellerInfo?.email}
                message={sellerInfo?.message}
              />
            </div>
            {visibleCount < filteredItems.length && (
              <button
                className="upload-button"
                onClick={() => setVisibleCount(visibleCount + 6)}
                style={{ margin: '2rem auto', display: 'block' }}
              >
                Load More
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}