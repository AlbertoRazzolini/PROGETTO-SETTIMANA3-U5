import { Route, Routes } from 'react-router'
import { RottaProtetta } from './auth/RottaProtetta'
import { Layout } from './layout/Layout'
import { Accesso } from './pages/Accesso'
import { AdminAnnunci } from './pages/admin/AdminAnnunci'
import { AdminImporta } from './pages/admin/AdminImporta'
import { AdminUtenti } from './pages/admin/AdminUtenti'
import { AreaGestione } from './pages/admin/AreaGestione'
import { DettaglioAuto } from './pages/DettaglioAuto'
import { NonTrovata } from './pages/NonTrovata'
import { Notifiche } from './pages/Notifiche'
import { Preferiti } from './pages/Preferiti'
import { Vetrina } from './pages/Vetrina'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Vetrina />} />
        <Route path="auto/:id" element={<DettaglioAuto />} />
        <Route path="login" element={<Accesso scheda="accedi" />} />
        <Route path="registrati" element={<Accesso scheda="registrati" />} />
        <Route
          path="preferiti"
          element={
            <RottaProtetta>
              <Preferiti />
            </RottaProtetta>
          }
        />
        <Route
          path="notifiche"
          element={
            <RottaProtetta>
              <Notifiche />
            </RottaProtetta>
          }
        />
        <Route
          path="admin"
          element={
            <RottaProtetta ruoli={['ADMIN', 'SUPER_ADMIN']}>
              <AreaGestione />
            </RottaProtetta>
          }
        >
          <Route index element={<AdminAnnunci />} />
          <Route path="importa" element={<AdminImporta />} />
          <Route
            path="utenti"
            element={
              <RottaProtetta ruoli={['SUPER_ADMIN']}>
                <AdminUtenti />
              </RottaProtetta>
            }
          />
        </Route>
        <Route path="*" element={<NonTrovata />} />
      </Route>
    </Routes>
  )
}

export default App
