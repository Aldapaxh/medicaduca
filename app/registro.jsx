'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../lib/traducciones'

const ROLE_CONFIG = {
  hogar:    { icono:'🏠', orgKey: null },
  hospital: { icono:'🏥', orgKey: 'org_hospital' },
  farmacia: { icono:'🏪', orgKey: 'org_farmacia' },
  medico:   { icono:'👨‍⚕️', orgKey: 'org_centro' },
}

export default function Registro({ idioma, rol, onRegistrado, onIrLogin }) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizacion, setOrganizacion] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const cfg = ROLE_CONFIG[rol]
  const nombreRol = t(idioma, `rol_${rol}`)

  const handleSubmit = async () => {
    setError('')
    if (!nombre || !email || !password) {
      setError(t(idioma, 'error_campos_vacios'))
      return
    }
    if (password.length < 6) {
      setError(t(idioma, 'error_password_corta'))
      return
    }

    setCargando(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          rol,
          organizacion,
          idioma,
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setCargando(false)
      return
    }

    if (data.user) {
      // Esperamos un poco para que el trigger termine de crear el perfil
      await new Promise(r => setTimeout(r, 800))

      const { data: perfil } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (perfil) {
        onRegistrado(perfil)
      } else {
        onRegistrado({ id: data.user.id, nombre, email, rol, organizacion, idioma, plan: 'free' })
      }
    }

    setCargando(false)
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      <h1 className="font-bold text-2xl mb-1">Medi<span className="text-green-600">Caduca</span></h1>
      <p className="text-gray-500 text-sm mb-6">{t(idioma, 'cuenta_gratuita')} · {cfg.icono} {nombreRol}</p>

      <div className="bg-gray-50 rounded-xl p-5 mb-6">
        <div className="text-sm font-medium text-gray-500 mb-4">{t(idioma, 'datos_acceso')}</div>

        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'nombre')}</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder={t(idioma, 'placeholder_nombre')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'email')}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
        </div>

        {cfg.orgKey && (
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">{t(idioma, cfg.orgKey)}</label>
            <input type="text" value={organizacion} onChange={e => setOrganizacion(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'password')} <span className="text-gray-400">({t(idioma, 'min_6_caracteres')})</span></label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="········" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
          ⚠️ {error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={cargando} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 mb-3">
        {cargando ? t(idioma, 'creando_cuenta') : t(idioma, 'crear_cuenta')}
      </button>

      <div className="text-center text-sm text-gray-500">
        <button onClick={onIrLogin} className="text-green-600 font-medium hover:underline">
          {t(idioma, 'ya_tienes_cuenta')}
        </button>
      </div>
    </div>
  )
}