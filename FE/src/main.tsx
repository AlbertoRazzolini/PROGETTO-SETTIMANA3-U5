import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { NotificheProvider } from './notifiche/NotificheContext.tsx'
import { PreferitiProvider } from './preferiti/PreferitiContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PreferitiProvider>
          <NotificheProvider>
            <App />
          </NotificheProvider>
        </PreferitiProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
