import { Route, Routes } from 'react-router'
import { RottaProtetta } from './auth/RottaProtetta'
import { Layout } from './layout/Layout'
import { Accesso } from './pages/Accesso'
import { DettaglioAuto } from './pages/DettaglioAuto'
import { Notifiche } from './pages/Notifiche'
import { Preferiti } from './pages/Preferiti'
import { Vetrina } from './pages/Vetrina'

function InCostruzione() {
  return <p className="py-20 text-center text-slate-500 dark:text-slate-400">Pagina in costruzione</p>
}

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
        <Route path="*" element={<InCostruzione />} />
      </Route>
    </Routes>
  )
}

export default App
