'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../lib/traducciones'

export default function Registro({ idioma, rol, onRegistrado, onIrLogin }) {
  const [nombre, setNombre] = useState('')
  const [organizacion, setOrganizacion] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const LABELS_ORG = {
    hospital: idioma === 'es' ? 'Nombre del hospital' : idioma === 'eu' ? 'Ospitalearen izena' : "Nom de l'hospital",
    farmacia: idioma === 'es' ? 'Nombre de la farmacia' : idioma === 'eu' ? 'Farmaziaren izena' : 'Nom de la farmàcia',
    medico: idioma === 'es' ? 'Centro de trabajo' : idioma === 'eu' ? 'Lan-zentroa' : 'Centre de treball',
  }
  const labelOrg = LABELS_ORG[rol]

  const registrar = async () => {
    setError('')
    if (!nombre || !email || !password) {
      setError(t(idioma, 'error_completa_campos'))
      return
    }
    if (password.length < 6) {
      setError(t(idioma, 'error_password_corta'))
      return
    }
    setCargando(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message.includes('already') ? t(idioma, 'error_email_existe') : authError.message)
      setCargando(false)
      return
    }

    if (!authData.user) {
      setError(t(idioma, 'error_generico'))
      setCargando(false)
      return
    }

    const { error: dbError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        nombre,
        email,
        rol,
        organizacion,
        plan: 'free',
        notificaciones_email: false,
        idioma,
      })

    if (dbError) {
      setError(dbError.message)
      setCargando(false)
      return
    }

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    setCargando(false)
    onRegistrado(perfil || { id: authData.user.id, nombre, email, rol, idioma })
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-2">{t(idioma, 'registro_titulo')}</h1>
      <p className="text-gray-500 text-sm mb-6">{t(idioma, 'rol_' + rol)}</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'nombre')}</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>

        {labelOrg && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{labelOrg}</label>
            <input value={organizacion} onChange={e => setOrganizacion(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'email')}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'password')}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <button
        onClick={registrar}
        disabled={cargando}
        className="bg-green-600 text-white px-4 py-3 rounded-xl mt-6 font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {cargando ? t(idioma, 'cargando') : t(idioma, 'crear_cuenta')}
      </button>

      <button onClick={onIrLogin} className="text-sm text-gray-500 mt-4 text-center hover:text-gray-700">
        {t(idioma, 'ya_tengo_cuenta')}
      </button>
    </div>
  )
}