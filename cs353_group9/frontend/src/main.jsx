import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import AppProviders from './contexts/ContextProvider.jsx'
import { FavoritesProvider } from './contexts/FavoritesContext.jsx';
import '@fortawesome/fontawesome-free/css/all.min.css';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <FavoritesProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      </FavoritesProvider>
    </AppProviders>
  </StrictMode>,
)
