'use client'

import { t } from '../lib/traducciones'

export default function Rol({ idioma, onElegir }) {
  const roles = [
    { id: 'hogar', nombre: t(idioma, 'rol_hogar'), desc: t(idioma, 'rol_hogar_desc'), emoji: '🏠', color: 'bg-green-50 border-green-200 text-green-700' },
    { id: 'hospital', nombre: t(idioma, 'rol_hospital'), desc: t(idioma, 'rol_hospital_desc'), emoji: '🏥', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { id: 'farmacia', nombre: t(idioma, 'rol_farmacia'), desc: t(idioma, 'rol_farmacia_desc'), emoji: '💊', color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { id: 'medico', nombre: t(idioma, 'rol_medico'), desc: t(idioma, 'rol_medico_desc'), emoji: '👨‍⚕️', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  ]

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center">{t(idioma, 'rol_titulo')}</h1>
      <p className="text-gray-500 text-center mb-8 text-sm">{t(idioma, 'rol_subtitulo')}</p>

      <div className="space-y-3">
        {roles.map(r => (
          <button
            key={r.id}
            onClick={() => onElegir(r.id)}
            className={`w-full ${r.color} border-2 rounded-xl px-4 py-4 flex items-center gap-4 hover:shadow-md transition-all`}
          >
            <div className="text-3xl">{r.emoji}</div>
            <div className="flex-1 text-left">
              <div className="font-bold text-lg">{r.nombre}</div>
              <div className="text-xs opacity-80">{r.desc}</div>
            </div>
            <div className="text-2xl">›</div>
          </button>
        ))}
      </div>
    </div>
  )
}