import { useEffect, useState } from 'react'

// true se l'utente ha chiesto meno animazioni (impostazione del sistema operativo / browser).
// Usato per non avviare le animazioni pesanti (CountUp, sfondo WebGL) a chi le ha disattivate.
export function usePreferisceMenoAnimazioni(): boolean {
  const [ridotto, setRidotto] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setRidotto(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return ridotto
}
