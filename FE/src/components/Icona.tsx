// Icona Material Symbols: "nome" e' il nome dell'icona (es. "favorite", "directions_car")
export function Icona({ nome, piena = false, className = '' }: { nome: string; piena?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={`icona ${piena ? 'icona-piena' : ''} ${className}`}>
      {nome}
    </span>
  )
}
