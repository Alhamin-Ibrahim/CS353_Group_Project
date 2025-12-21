import { NavLink, useLocation } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/contexts';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import logo from '../sellify4.png';

export default function Navbar() {
  const location = useLocation();
  const isHomePage = location.pathname === '/home';
  const { currentUser } = useContext(AuthContext);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setHasUnread(false);
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('participantsArray', 'array-contains', currentUser.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const unread = snapshot.docs.some(doc => {
        const data = doc.data();
        // Check if user has unread messages in this conversation
        const unreadCount = data.unreadCounts?.[currentUser.uid] || 0;
        return unreadCount > 0;
      });
      setHasUnread(unread);
    }, (err) => {
      console.warn('Error checking unread messages:', err);
    });

    return () => unsub();
  }, [currentUser]);

  return (
    <nav className="nav">
      {!isHomePage && (
        <NavLink to="/home" className="site-name">
          <img src={logo} alt="sellify4" className="site-logo" />
        </NavLink>
      )}
      <ul>
        <li>
          <NavLink to="/favorites" className="nav-link">❤️</NavLink>
        </li>
        <li>
          <NavLink to="/home" className="nav-link">Home</NavLink>
        </li>
        <li>
          <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
        </li>
        <li style={{ position: 'relative' }}>
          <NavLink to="/conversations" className="nav-link">
            Conversations
            {hasUnread && <span className="notification-dot"></span>}
          </NavLink>
        </li>
        <li>
          <NavLink to="/upload" className="nav-link">Upload</NavLink>
        </li>
        <li>
          <NavLink to="/profile" className="nav-link">Profile</NavLink>
        </li>
      </ul>
    </nav>
  );
}
