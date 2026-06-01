'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ROLE_CONFIG = {
  hogar:    { icono:'🏠', nombre:'Hogar',    org: false },
  hospital: { icono:'🏥', nombre:'Hospital', org: true,  label:'Nombre del hospital',   ph:'Hospital La Paz' },
  farmacia: { icono:'🏪', nombre:'Farmacia', org: true,  label:'Nombre de la farmacia', ph:'Farmacia Central' },
  medico:   { icono:'👨‍⚕️', nombre:'Médico',   org: true,  label:'Centro de trabajo',     ph:'Centro de Salud Norte' },
}

export default function Registro({ rol, onRegistrado, onVolver }) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizacion, setOrganizacion] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const cfg = ROLE_CONFIG[rol]

  const handleSubmit = async () => {
    setError('')
    if (!nombre || !email || !password) {
      setError('Rellena todos los campos')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setCargando(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setCargando(false)
      return
    }

    if (data.user) {
      const { error: dbError } = await supabase
        .from('usuarios')
        .insert({
          id: data.user.id,
          nombre,
          email,
          rol,
          organizacion,
          plan: 'free',
        })

      if (dbError) {
        setError('Error al guardar el perfil: ' + dbError.message)
        setCargando(false)
        return
      }

      onRegistrado({ id: data.user.id, nombre, email, rol, organizacion })
    }

    setCargando(false)
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      <h1 className="font-bold text-2xl mb-1">Medi<span className="text-green-600">Caduca</span></h1>
      <p className="text-gray-500 text-sm mb-6">Cuenta gratuita · {cfg.icono} {cfg.nombre}</p>
      <div className="bg-gray-50 rounded-xl p-5 mb-6">
        <div className="text-sm font-medium text-gray-500 mb-4">Datos de acceso</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ana García" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ana@email.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
          </div>
        </div>
        {cfg.org && (
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">{cfg.label}</label>
            <input type="text" value={organizacion} onChange={e => setOrganizacion(e.target.value)} placeholder={cfg.ph} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
          </div>
        )}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Contraseña <span className="text-gray-400">(mínimo 6 caracteres)</span></label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="········" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
          ⚠️ {error}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onVolver} disabled={cargando} className="border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm disabled:opacity-50">← Atrás</button>
        <button onClick={handleSubmit} disabled={cargando} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
          {cargando ? 'Creando cuenta...' : 'Entrar gratis →'}
        </button>
      </div>
    </div>
  )
}