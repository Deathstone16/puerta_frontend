import { useEffect, useMemo, useState } from 'react'
import { formatMoney } from '../data/mockData'
import Icon from './Icons'

const emptyPerson = () => ({ nombre: '', apellido: '', dni: '', metodo_pago: 'efectivo' })

export default function CashierSaleSheet({ open, busy, ticketPrice, onClose, onSubmit }) {
  const [people, setPeople] = useState([emptyPerson()])
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setPeople([emptyPerson()])
      setError('')
    }
  }, [open])

  const total = useMemo(() => people.length * Number(ticketPrice || 0), [people.length, ticketPrice])
  if (!open) return null

  const updatePerson = (index, field, value) => {
    setPeople((current) => current.map((person, personIndex) => personIndex === index ? { ...person, [field]: value } : person))
    setError('')
  }

  const addPerson = () => {
    if (people.length >= 6) return
    setPeople((current) => [...current, emptyPerson()])
  }

  const removePerson = (index) => {
    if (people.length === 1) return
    setPeople((current) => current.filter((_, personIndex) => personIndex !== index))
  }

  const submit = async (event) => {
    event.preventDefault()
    const invalid = people.some((person) => !person.nombre.trim() || !person.apellido.trim() || !/^\d{7,8}$/.test(person.dni))
    if (invalid) {
      setError('Completá nombre, apellido y un DNI válido de 7 u 8 dígitos para cada persona.')
      return
    }
    await onSubmit(people.map((person) => ({ ...person, nombre: person.nombre.trim(), apellido: person.apellido.trim() })))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/85 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Venta general">
      <form onSubmit={submit} className="mx-auto flex max-h-[94dvh] w-full max-w-xl flex-col border-t-2 border-amber-300 bg-floor sm:border-2">
        <header className="flex shrink-0 items-start justify-between border-b border-white/10 p-5">
          <div><p className="eyebrow text-amber-300">Venta general</p><h2 className="display-title mt-2 text-4xl">NUEVO INGRESO</h2><p className="mt-2 text-xs text-muted">Hasta 6 personas por operación.</p></div>
          <button type="button" disabled={busy} onClick={onClose} className="grid size-11 place-items-center border border-white/15 text-muted disabled:opacity-40" aria-label="Cerrar venta"><Icon name="close" /></button>
        </header>

        <div className="overflow-y-auto p-4">
          <div className="space-y-4">{people.map((person, index) => <fieldset key={index} className="border border-white/15 bg-void p-4"><legend className="px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">Persona {index + 1}</legend><div className="grid gap-3 sm:grid-cols-2"><input required className="field" placeholder="NOMBRE" value={person.nombre} onChange={(event) => updatePerson(index, 'nombre', event.target.value)} /><input required className="field" placeholder="APELLIDO" value={person.apellido} onChange={(event) => updatePerson(index, 'apellido', event.target.value)} /><input required inputMode="numeric" className="field sm:col-span-2" placeholder="DNI SIN PUNTOS" value={person.dni} onChange={(event) => updatePerson(index, 'dni', event.target.value.replace(/\D/g, '').slice(0, 8))} /></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => updatePerson(index, 'metodo_pago', 'efectivo')} className={`min-h-12 border font-mono text-[10px] font-bold uppercase ${person.metodo_pago === 'efectivo' ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300' : 'border-white/15 text-muted'}`}>Efectivo</button><button type="button" onClick={() => updatePerson(index, 'metodo_pago', 'transferencia')} className={`min-h-12 border font-mono text-[10px] font-bold uppercase ${person.metodo_pago === 'transferencia' ? 'border-uv bg-uv/15 text-violet-300' : 'border-white/15 text-muted'}`}>Transferencia</button></div>{people.length > 1 && <button type="button" onClick={() => removePerson(index)} className="mt-3 font-mono text-[9px] font-bold uppercase text-door-red">Quitar persona</button>}</fieldset>)}</div>
          <button type="button" disabled={people.length >= 6} onClick={addPerson} className="btn-secondary mt-4 min-h-14 w-full disabled:opacity-30"><Icon name="plus" size={17}/> Agregar persona</button>
          {error && <p className="mt-4 border-l-2 border-door-red bg-door-red/10 p-3 text-xs leading-5 text-door-red">{error}</p>}
        </div>

        <footer className="shrink-0 border-t border-white/10 bg-floor p-4 pb-[max(16px,env(safe-area-inset-bottom))]"><div className="mb-3 flex items-end justify-between"><span className="font-mono text-[10px] font-bold uppercase text-muted">{people.length} entrada{people.length === 1 ? '' : 's'}</span><strong className="font-mono text-2xl text-strobe">{formatMoney(total)}</strong></div><button disabled={busy} className="min-h-16 w-full bg-amber-300 px-5 font-display text-xl text-void disabled:opacity-50">{busy ? 'REGISTRANDO...' : 'CONFIRMAR VENTA'}</button></footer>
      </form>
    </div>
  )
}
