import React, { useContext, useState, useEffect } from 'react'
import { AuthContext, PostContext } from '../contexts/contexts'
import { db } from '../firebase'
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

// just the style
const styles = {
  page: { fontFamily: "system-ui, sans-serif", background: "#B0BCBF", minHeight: "100vh", color: "#2D4343", padding: "40px 20px" },
  container: { maxWidth: 1200, margin: "0 auto", padding: 0 },
  header: { background: "#fff", padding: "20px 24px", border: "none", borderRadius: 16, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)" },
  title: { fontSize: 24, fontWeight: 700, color: "#2D4343" },
  small: { color: "#6F8B8F", fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 },
  card: { background: "#fff", border: "2px solid #88A699", borderRadius: 16, padding: 20, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)", transition: "all 0.3s ease" },
  sectionTitle: { fontWeight: 700, marginBottom: 12, color: "#2D4343", fontSize: 18 },
  kpiValue: { fontSize: 28, fontWeight: 700, marginTop: 8, color: "#2D4343" },
  rowGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "12px 10px", color: "#6F8B8F", borderBottom: "2px solid #88A699", fontWeight: 600 },
  td: { padding: "12px 10px", borderBottom: "1px solid #e8f0f0", color: "#2D4343" },
  category: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  categoryBar: (width) => ({ 
    height: 10, 
    background: "#88A699", 
    borderRadius: 6, 
    flex: width 
  })
};

// Header component
const Header = () => (
  <div style={styles.header}>
    <div style={styles.title}>Analytics Dashboard</div>
    <div style={styles.small}>Marketplace Activity</div>
  </div>
);

// User Profile Card component
const UserProfileCard = ({ userProfile, currentUser, onViewProfile }) => (
  <div style={styles.card}>
    <div style={{display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16}}>
      <img 
        src={currentUser?.photoURL || '/test.png'} 
        alt="Profile" 
        style={{
          width: 90, 
          height: 90, 
          borderRadius: '50%', 
          objectFit: 'cover',
          border: '4px solid #88A699',
          boxShadow: '0 4px 15px rgba(136, 166, 153, 0.3)'
        }}
      />
      <div style={{flex: 1}}>
        <div style={{fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#2D4343'}}>
          {userProfile?.name || currentUser?.displayName || 'User'}
        </div>
        <div style={{fontSize: 13, color: '#6F8B8F', marginBottom: 6}}>
          {currentUser?.email}
        </div>
        {userProfile?.phone && (
          <div style={{fontSize: 13, color: '#6F8B8F', marginBottom: 6}}>
            📞 {userProfile.phone}
          </div>
        )}
      </div>
    </div>
    {userProfile?.bio && (
      <div style={{
        padding: 14, 
        background: '#f0f4f3', 
        borderRadius: 10, 
        fontSize: 14,
        color: '#6F8B8F',
        marginBottom: 16,
        lineHeight: '1.5'
      }}>
        {userProfile.bio}
      </div>
    )}
    <button 
      onClick={onViewProfile}
      style={{
        width: '100%',
        padding: '12px 20px',
        background: '#88A699',
        color: 'white',
        border: 'none',
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(136, 166, 153, 0.3)'
      }}
      onMouseOver={(e) => {
        e.target.style.background = '#6F8B8F';
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 4px 12px rgba(136, 166, 153, 0.4)';
      }}
      onMouseOut={(e) => {
        e.target.style.background = '#88A699';
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 2px 8px rgba(136, 166, 153, 0.3)';
      }}
    >
      View Full Profile
    </button>
  </div>
);

// KPI Grid component
const KPIGrid = ({kpis}) => (
  <div style={styles.grid}>
    {kpis.map((k) => (
      <div key={k.label} style={styles.card}>
        <div style={styles.small}>{k.label}</div>
        <div style={styles.kpiValue}>{k.value}</div>
      </div>
    ))}
  </div>
);

// Category Distribution component
const CategoryDistribution = ({ categories }) => {
  if (!categories || categories.length === 0) {
    return (
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Category Distribution</div>
        <div style={{padding: 20, textAlign: 'center', color: '#94a3b8'}}>
          No items listed yet. Upload items to see category distribution!
        </div>
      </div>
    );
  }
  
  const maxCount = Math.max(...categories.map(c => c.count), 1);
  
  return (
    <div style={styles.card}>
      <div style={styles.sectionTitle}>Category Distribution</div>
      {categories.map(({category, count}) => (
        <div key={category} style={styles.category}>
          <div style={{width: 100}}>{category}</div>
          <div style={styles.categoryBar(count/maxCount)} />
          <div style={styles.small}>{count}</div>
        </div>
      ))}
    </div>
  );
};

// Selling History component
const SellingHistory = ({ history, buyerNames = {} }) => (
  <div style={styles.card}>
    <div style={styles.sectionTitle}>My Selling History</div>
    {history.length === 0 ? (
      <div style={{padding: 20, textAlign: 'center', color: '#94a3b8'}}>
        No items listed yet. Start selling to see your history!
      </div>
    ) : (
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Item</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}>Price</th>
            <th style={styles.th}>Buyer</th>
            <th style={styles.th}>Date Listed</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => {
            let bgColor = '#fef3c7'; // Yellow for Active
            let textColor = '#a16207';
            
            if (item.sold) {
              bgColor = '#dcfce7'; // Green for Sold
              textColor = '#15803d';
            } else if (item.reported) {
              bgColor = '#fee2e2'; // Red for Reported
              textColor = '#991b1b';
            }
            
            const buyerDisplay = item.buyerId ? (buyerNames[item.buyerId] || item.buyerId) : '-';
            return (
              <tr key={item.id}>
                <td style={styles.td}>{item.description.substring(0, 40)}{item.description.length > 40 ? '...' : ''}</td>
                <td style={styles.td}>{item.category}</td>
                <td style={styles.td}>{item.price}</td>
                <td style={styles.td}>{item.sold ? buyerDisplay : '-'}</td>
                <td style={styles.td}>{item.date}</td>
                <td style={styles.td}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    background: bgColor,
                    color: textColor
                  }}>
                    {item.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </div>
);

// Selling Insights component
const SellingInsights = ({ insights }) => (
  <div style={styles.card}>
    <div style={styles.sectionTitle}>Quick Insights</div>
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      <div style={{padding: 14, background: '#f0f4f3', borderRadius: 10}}>
        <div style={{fontSize: 12, color: '#6F8B8F', marginBottom: 4}}>Most Popular Category</div>
        <div style={{fontSize: 18, fontWeight: 600, color: '#2D4343'}}>{insights.topCategory}</div>
      </div>
      <div style={{padding: 14, background: '#f0f4f3', borderRadius: 10}}>
        <div style={{fontSize: 12, color: '#6F8B8F', marginBottom: 4}}>Best Selling Item</div>
        <div style={{fontSize: 14, fontWeight: 600, color: '#2D4343'}}>{insights.bestSellingItem}</div>
      </div>
      <div style={{padding: 14, background: '#f0f4f3', borderRadius: 10}}>
        <div style={{fontSize: 12, color: '#6F8B8F', marginBottom: 4}}>Success Rate</div>
        <div style={{fontSize: 18, fontWeight: 600, color: '#2D4343'}}>{insights.successRate}</div>
      </div>
    </div>
  </div>
);

// Reported Posts component
const ReportedPosts = ({ reportedItems }) => {
  if (reportedItems.length === 0) {
    return null;
  }

  return (
    <div style={styles.card}>
      <div style={{...styles.sectionTitle, display: 'flex', alignItems: 'center', gap: 8}}>
        ⚠️ Reported Posts
        <span style={{
          background: '#dc2626',
          color: 'white',
          borderRadius: '50%',
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700
        }}>
          {reportedItems.length}
        </span>
      </div>
      <div style={{fontSize: 13, color: '#6F8B8F', marginBottom: 12}}>
        Your posts that have been reported by the community. Posts with 2 or more reports will be automatically removed.
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        {reportedItems.map((item) => {
          const reportCount = item.reports.length;
          const isDeleted = item.reports.some(r => r.status === 'resolved');
          
          return (
            <div 
              key={item.id} 
              style={{
                padding: 14,
                background: isDeleted ? '#f9fafb' : '#fef2f2',
                borderLeft: isDeleted ? '3px solid #6b7280' : '3px solid #dc2626',
                borderRadius: 8
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6}}>
                <div style={{fontSize: 14, fontWeight: 600, color: '#2D4343', flex: 1}}>
                  {isDeleted ? '🚫 Post Deleted' : '⚠️ Post Under Review'}
                </div>
                <span style={{
                  background: reportCount >= 2 ? '#dc2626' : '#f59e0b',
                  color: 'white',
                  borderRadius: 12,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {reportCount} report{reportCount !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div style={{fontSize: 13, color: '#6F8B8F', marginBottom: 8, lineHeight: 1.5}}>
                <strong>Post:</strong> {item.description.substring(0, 80)}
                {item.description.length > 80 ? '...' : ''}
              </div>
              
              {isDeleted ? (
                <div style={{
                  padding: 8,
                  background: '#fee2e2',
                  borderRadius: 6,
                  fontSize: 12,
                  color: '#991b1b'
                }}>
                  This post has been removed due to multiple community reports.
                </div>
              ) : (
                <div style={{
                  padding: 8,
                  background: '#fef3c7',
                  borderRadius: 6,
                  fontSize: 12,
                  color: '#92400e'
                }}>
                  {reportCount >= 2 
                    ? 'This post will be removed automatically.'
                    : `${2 - reportCount} more report${2 - reportCount !== 1 ? 's' : ''} needed before automatic removal.`
                  }
                </div>
              )}
              
              <div style={{marginTop: 8, fontSize: 11, color: '#94a3b8'}}>
                Reasons: {[...new Set(item.reports.map(r => r.reason))].join(', ')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Recent Activity component
const RecentActivity = ({ activities }) => (
  <div style={styles.card}>
    <div style={styles.sectionTitle}>Recent Activity</div>
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>User</th>
          <th style={styles.th}>Action</th>
          <th style={styles.th}>Category</th>
          <th style={styles.th}>Date</th>
        </tr>
      </thead>
      <tbody>
        {activities.map((activity) => (
          <tr key={activity.id}>
            <td style={styles.td}>{activity.user}</td>
            <td style={styles.td}>{activity.action}</td>
            <td style={styles.td}>{activity.category}</td>
            <td style={styles.td}>{activity.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Footer = () => (
  <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", padding: "8px 0" }}>
    Group 9 CS353 Project
  </div>
);

//smosh it all together, Dashboard is a wrapper
export default function Dashboard() {
  const { posts } = useContext(PostContext);
  const { currentUser } = useContext(AuthContext);
  const [buyerNames, setBuyerNames] = useState({}); // buyerId -> displayName
  const [userProfile, setUserProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [userPosts, setUserPosts] = useState([]); // Store user's posts separately for real-time updates
  const navigate = useNavigate();

  console.log('Dashboard - Current User:', currentUser);
  console.log('Dashboard - All Posts:', posts);
  
  // Subscribe to user's posts in real-time
  useEffect(() => {
    if (!currentUser?.uid) {
      setUserPosts([]);
      return;
    }
    
    const q = query(
      collection(db, 'items'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      console.log('Dashboard - User posts updated:', items);
      setUserPosts(items);
    }, (error) => {
      console.error('Error fetching user posts:', error);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Fetch user profile data with real-time updates
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
        console.log('Dashboard - User profile updated:', docSnap.data());
      }
    }, (error) => {
      console.error('Error fetching user profile:', error);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch reported items with real-time updates
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const q = query(
      collection(db, 'items'),
      where('userId', '==', currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportedItems = [];
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        
        // Only include items that have reports
        if (data.reports && data.reports.length > 0) {
          reportedItems.push({
            id: docSnap.id,
            description: data.description || 'No description',
            reports: data.reports.map(r => ({
              id: r.userId,
              reason: r.reason,
              reportedAt: r.reportedAt,
              status: 'pending'
            }))
          });
        }
      });
      
      console.log('Dashboard - Reported items updated:', reportedItems);
      setNotifications(reportedItems);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Calculate KPIs and analytics using userPosts instead of filtered posts
  const kpis = React.useMemo(() => {
    const myPosts = userPosts.length;
    
    // Calculate total income from user's items
    const totalIncome = userPosts.reduce((sum, post) => {
      const sold = post.sold || false;
      // Handle soldPrice which can be a number or a string like "$50"
      let soldPrice = post.soldPrice;
      if (typeof soldPrice === 'string') {
        soldPrice = parseFloat(soldPrice.replace(/[$,]/g, ''));
      } else if (soldPrice !== undefined && soldPrice !== null) {
        soldPrice = parseFloat(soldPrice);
      } else {
        soldPrice = NaN;
      }
      const fallbackPrice = parseFloat(post.price) || 0;
      const priceToUse = sold ? (isNaN(soldPrice) ? fallbackPrice : soldPrice) : 0;
      return sum + priceToUse;
    }, 0);
    
    // Count sold items
    const soldItems = userPosts.filter(post => post.sold).length;
    
    // Calculate potential earnings (active listings)
    const potentialEarnings = userPosts.reduce((sum, post) => {
      const price = parseFloat(post.price) || 0;
      const sold = post.sold || false;
      return sum + (sold ? 0 : price);
    }, 0);
    
    // Calculate average item price
    const totalPrice = userPosts.reduce((sum, post) => {
      return sum + (parseFloat(post.price) || 0);
    }, 0);
    const avgPrice = myPosts > 0 ? totalPrice / myPosts : 0;

    return [
      { label: "My Total Items", value: myPosts },
      { label: "Items Sold", value: soldItems },
      { label: "Total Income", value: `€${totalIncome.toFixed(2)}` },
      { label: "Active Listings", value: myPosts - soldItems },
      { label: "Potential Earnings", value: `€${potentialEarnings.toFixed(2)}` },
      { label: "Average Price", value: `€${avgPrice.toFixed(2)}` },
    ];
  }, [userPosts]);
  
  const categoryAnalytics = React.useMemo(() => {
    const categoryCounts = userPosts.reduce((acc, post) => {
      const category = post.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [userPosts]);
  
  const sellingHistory = React.useMemo(() => {
    return userPosts
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      })
      .slice(0, 10)
      .map(post => {
        const reportCount = post.reports?.length || 0;
        let status = 'Active';
        if (post.sold) {
          status = 'Sold';
        } else if (reportCount > 0) {
          status = `Reported (${reportCount})`;
        }

        const soldPriceVal = post.soldPrice !== undefined && post.soldPrice !== null ? parseFloat(post.soldPrice) : NaN;
        const displayPrice = post.sold
          ? (isNaN(soldPriceVal) ? (post.price ? `€${parseFloat(post.price).toFixed(2)}` : 'N/A') : `€${soldPriceVal.toFixed(2)}`)
          : (post.price ? `€${parseFloat(post.price).toFixed(2)}` : 'N/A');

        return {
          id: post.id,
          description: post.description || 'No description',
          category: post.category || 'Other',
          price: displayPrice,
          date: post.createdAt?.toDate 
            ? post.createdAt.toDate().toLocaleDateString() 
            : new Date(post.createdAt).toLocaleDateString(),
          status: status,
          sold: post.sold || false,
          reported: reportCount > 0,
          buyerId: post.buyerId || null,
          soldPrice: isNaN(soldPriceVal) ? null : soldPriceVal
        };
      });
  }, [userPosts]);
  
  const insights = React.useMemo(() => {
    if (userPosts.length === 0) {
      return {
        topCategory: 'N/A',
        bestSellingItem: 'No items yet',
        successRate: '0%'
      };
    }
    
    // Find most common category
    const categoryCounts = userPosts.reduce((acc, post) => {
      acc[post.category] = (acc[post.category] || 0) + 1;
      return acc;
    }, {});
    const topCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    // Find highest priced sold item
    const soldItems = userPosts.filter(post => post.sold);
    const bestItem = soldItems.reduce((best, post) => {
      const price = parseFloat(post.price) || 0;
      return price > (parseFloat(best?.price) || 0) ? post : best;
    }, null);
    
    // Calculate success rate
    const soldCount = soldItems.length;
    const successRate = userPosts.length > 0 
      ? `${((soldCount / userPosts.length) * 100).toFixed(0)}%` 
      : '0%';
    
    return {
      topCategory,
      bestSellingItem: bestItem ? `${bestItem.description.substring(0, 30)}... (€${parseFloat(bestItem.price).toFixed(2)})` : 'No sales yet',
      successRate
    };
  }, [userPosts]);

  // Resolve buyer display names for sold items
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ids = Array.from(new Set(userPosts.filter(p => p.sold && p.buyerId).map(p => p.buyerId)));
        if (ids.length === 0) return;
        const map = {};
        for (const id of ids) {
          try {
            const u = await getDoc(doc(db, 'users', id));
            map[id] = u.exists() ? (u.data().name || u.data().displayName || id) : id;
          } catch { 
            map[id] = id;
          }
        }
        if (mounted) setBuyerNames(map);
      } catch (error) {
        console.warn('Failed to resolve buyer names', error);
      }
    })();
    return () => { mounted = false };
  }, [userPosts]);

  console.log('Dashboard - Category Analytics:', categoryAnalytics);
  console.log('Dashboard - User Posts Count:', userPosts.length);
  console.log('Dashboard - KPIs:', kpis);

  const handleViewProfile = () => {
    navigate('/profile');
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Header />
        
        {/* Reported Posts section - show at top if there are any */}
        {notifications.length > 0 && (
          <div style={{marginTop: 12}}>
            <ReportedPosts reportedItems={notifications} />
          </div>
        )}
        
        {/* User Profile and KPIs side by side */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginTop: 12}}>
          <UserProfileCard 
            userProfile={userProfile} 
            currentUser={currentUser}
            onViewProfile={handleViewProfile}
          />
          <div style={styles.grid}>
            {kpis.map((k) => (
              <div key={k.label} style={styles.card}>
                <div style={styles.small}>{k.label}</div>
                <div style={styles.kpiValue}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Selling History and Insights side by side */}
        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 12}}>
          <SellingHistory history={sellingHistory} buyerNames={buyerNames} />
          <SellingInsights insights={insights} />
        </div>
        
        {/* Category Distribution */}
        <div style={{marginTop: 12}}>
          <CategoryDistribution categories={categoryAnalytics} />
        </div>
        <Footer/>
      </div>
    </div>
  );
}