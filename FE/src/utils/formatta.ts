import type { StatoAuto } from '../api/types'

const formatoPrezzo = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const formatoNumero = new Intl.NumberFormat('it-IT')

// 24900 -> "24.900 €"
export function formattaPrezzo(prezzo: number): string {
  return formatoPrezzo.format(prezzo)
}

// 45000 -> "45.000 km"
export function formattaKm(km: number): string {
  return `${formatoNumero.format(km)} km`
}

export const ETICHETTA_STATO: Record<StatoAuto, string> = {
  NUOVO: 'Nuovo',
  KM_0: 'Km 0',
  USATO: 'Usato',
}
