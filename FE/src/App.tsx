import { Route, Routes } from 'react-router'
import { Layout } from './layout/Layout'
import { DettaglioAuto } from './pages/DettaglioAuto'
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
        <Route path="*" element={<InCostruzione />} />
      </Route>
    </Routes>
  )
}

export default App
