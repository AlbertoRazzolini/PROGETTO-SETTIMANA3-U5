import { Route, Routes } from 'react-router'

function App() {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <main className="flex min-h-screen items-center justify-center">
            <h1 className="text-3xl font-bold">Salone Auto</h1>
          </main>
        }
      />
    </Routes>
  )
}

export default App
