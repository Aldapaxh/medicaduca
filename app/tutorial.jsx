'use client'

import { useState } from 'react'

const pasos = [
  { icono:'📅', label:'Paso 1 de 4', titulo:'¿Tienes medicamentos caducados sin saberlo?', cuerpo:'La mayoría de los hogares tienen medicamentos caducados en el cajón. MediCaduca te lo dice antes de que ocurra.', color:'bg-red-50' },
  { icono:'➕', label:'Paso 2 de 4', titulo:'Añadir un medicamento es muy fácil', cuerpo:'Tienes dos formas. Escanea el código de barras o escribe el nombre a mano. Tú eliges.', color:'bg-green-50' },
  { icono:'🔔', label:'Paso 3 de 4', titulo:'Los colores te lo dicen todo de un vistazo', cuerpo:'Verde: bien. Naranja: caduca pronto. Rojo: atención urgente. Sin complicaciones.', color:'bg-amber-50' },
  { icono:'❤️', label:'Paso 4 de 4', titulo:'Es gratis. De verdad.', cuerpo:'Puedes usar MediCaduca sin pagar nada. El Premium cuesta menos que un café al mes.', color:'bg-green-50' },
]

export default function Tutorial({ onFinalizar, onSaltar }) {
  const [paso, setPaso] = useState(0)
  const s = pasos[paso]
  const siguiente = () => paso < pasos.length - 1 ? setPaso(paso + 1) : onFinalizar()
  const anterior = () => paso > 0 && setPaso(paso - 1)

  return (
    <div className="py-8 max-w-md mx-auto">
      <div className="flex gap-2 mb-8">
        {pasos.map((_,i) => (
          <div key={i} className={`flex-1 h-1 rounded-full ${i <= paso ? 'bg-green-500' : 'bg-gray-200'}`}></div>
        ))}
      </div>
      <div className="flex justify-center mb-6">
        <div className={`w-28 h-28 rounded-full ${s.color} flex items-center justify-center text-5xl`}>{s.icono}</div>
      </div>
      <div className="text-xs font-medium text-green-600 uppercase tracking-wider text-center mb-2">{s.label}</div>
      <h2 className="text-2xl font-bold text-center mb-3">{s.titulo}</h2>
      <p className="text-gray-500 text-center mb-8">{s.cuerpo}</p>
      <div className="flex items-center justify-between">
        {paso > 0
          ? <button onClick={anterior} className="border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm">← Atrás</button>
          : <button onClick={onSaltar} className="text-gray-400 text-sm">← Volver</button>
        }
        {paso < pasos.length - 1 && <button onClick={onSaltar} className="text-gray-400 text-sm">Saltar</button>}
        <button onClick={siguiente} className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
          {paso === pasos.length - 1 ? '¡Empezar! →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}