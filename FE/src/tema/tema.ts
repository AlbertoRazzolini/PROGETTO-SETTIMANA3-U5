import { useCallback, useState } from 'react'

export type Tema = 'chiaro' | 'scuro'

const CHIAVE_TEMA = 'salone.tema'

// Il tema iniziale (scelta salvata o preferenza di sistema) lo applica lo script inline in index.html,
// prima del primo render, per evitare il lampo di tema chiaro.
function applicaTema(tema: Tema) {
  document.documentElement.classList.toggle('dark', tema === 'scuro')
  try {
    localStorage.setItem(CHIAVE_TEMA, tema)
  } catch {
    // la scelta vale solo per questa sessione
  }
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(() =>
    document.documentElement.classList.contains('dark') ? 'scuro' : 'chiaro',
  )

  const cambiaTema = useCallback(() => {
    const nuovo = tema === 'scuro' ? 'chiaro' : 'scuro'
    applicaTema(nuovo)
    setTema(nuovo)
  }, [tema])

  return { tema, cambiaTema }
}
