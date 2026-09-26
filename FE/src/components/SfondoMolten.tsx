import { useState } from 'react'
import { usePreferisceMenoAnimazioni } from '../utils/animazioni'
import MoltenMetal from './MoltenMetal'

// Sfondo animato "molten metal" a tutta la pagina, dietro al contenuto di ogni schermata.
// Reso una volta nel Layout: resta montato tra un cambio pagina e l'altro (niente re-init del WebGL).
// Non compare se l'utente ha ridotto le animazioni o se manca WebGL2 (resta lo sfondo normale).
export function SfondoMolten() {
  const ridotto = usePreferisceMenoAnimazioni()
  const [webglOk] = useState(() => {
    try {
      return !!document.createElement('canvas').getContext('webgl2')
    } catch {
      return false
    }
  })

  if (ridotto || !webglOk) return null

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <MoltenMetal
        color1="#0c0628"
        color2="#deabdc"
        color3="#571212"
        speed={0.35}
        scale={6}
        detail={3}
        glow={1.6}
        coreSize={0.1}
        swirl={1}
        fold={-0.25}
        blackPoint={0.08}
        brightness={1.6}
        colorMode="molten"
        grain
        grainIntensity={0.05}
        mouseInteraction={false}
        opacity={0.6}
      />
    </div>
  )
}
