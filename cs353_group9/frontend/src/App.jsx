import React, { useContext } from 'react';
import './App.css';
import './components/Navbar.css';
import Navbar from './components/Navbar';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/contexts';

import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import UserProfile from './pages/UserProfile';
import ChatList from './pages/ChatList';
import ChatWindow from './pages/ChatWindow';
import Landing from './pages/Landing';
import Favorites from './pages/Favorites';


function App() {
  const location = useLocation();
  const { currentUser } = useContext(AuthContext);
  const hideNavbarOnPaths = ['/', '/login', '/register'];
  const shouldShowNavbar = !hideNavbarOnPaths.includes(location.pathname);

  console.log('Current path:', location.pathname);
  console.log('Show Navbar:', shouldShowNavbar);
  console.log('Current user:', currentUser);

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      console.log('No user, redirecting to landing page');
      return <Navigate to="/" />;
    }
    return children;
  };

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <div className='container'>
        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          
          {/* Protected Routes */}
          <Route path='/home' element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path='/dashboard' element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path='/upload' element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          } />
          <Route path='/profile' element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path='/user/:uid' element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path='/conversations' element={
            <ProtectedRoute>
              <ChatList />
            </ProtectedRoute>
          } />
          <Route path='/chat/:uid' element={
            <ProtectedRoute>
              <ChatWindow />
            </ProtectedRoute>
          } />
            <Route path='/favorites' element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </>
  );
}

export default App;
