import { Route, Routes } from 'react-router'
import { PulsanteTema } from './tema/PulsanteTema'

function App() {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <main className="flex min-h-screen flex-col items-center justify-center gap-4">
            <h1 className="text-3xl font-bold">Salone Auto</h1>
            <PulsanteTema />
          </main>
        }
      />
    </Routes>
  )
}

export default App
