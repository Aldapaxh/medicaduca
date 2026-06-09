'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { t, IDIOMAS } from '../lib/traducciones'

export default function Login({ idioma, onCambiarIdioma, onLogin, onIrRegistro }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [vista, setVista] = useState('login')
  const [emailRecuperar, setEmailRecuperar] = useState('')
  const [mensajeRecuperar, setMensajeRecuperar] = useState('')

  const entrar = async () => {
    setError('')
    if (!email || !password) {
      setError(t(idioma, 'error_completa_campos'))
      return
    }
    setCargando(true)
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) {
      setError(t(idioma, 'error_email_password'))
      setCargando(false)
      return
    }
    const { data: perfil } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', data.user.id)
      .single()
    setCargando(false)
    onLogin(perfil || { id: data.user.id, email })
  }

  const recuperar = async () => {
    setError('')
    setMensajeRecuperar('')
    if (!emailRecuperar) {
      setError(t(idioma, 'error_completa_campos'))
      return
    }
    setCargando(true)
    const { error: errRec } = await supabase.auth.resetPasswordForEmail(emailRecuperar, {
      redirectTo: window.location.origin,
    })
    setCargando(false)
    if (errRec) {
      setError(errRec.message)
    } else {
      setMensajeRecuperar(t(idioma, 'recuperar_enviado'))
    }
  }

  if (vista === 'recuperar') {
    return (
      <div className="min-h-screen flex flex-col justify-center px-6 py-8 max-w-md mx-auto">
        <button onClick={() => setVista('login')} className="text-sm text-gray-500 mb-4 self-start">
          {t(idioma, 'volver')}
        </button>
        <h1 className="text-3xl font-bold mb-2">{t(idioma, 'recuperar_titulo')}</h1>
        <p className="text-gray-500 text-sm mb-6">{t(idioma, 'recuperar_texto')}</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">⚠️ {error}</div>}
        {mensajeRecuperar && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2 mb-4">✓ {mensajeRecuperar}</div>}

        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'email')}</label>
          <input type="email" value={emailRecuperar} onChange={e => setEmailRecuperar(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>

        <button onClick={recuperar} disabled={cargando} className="bg-green-600 text-white px-4 py-3 rounded-xl mt-6 font-medium disabled:opacity-50">
          {cargando ? t(idioma, 'cargando') : t(idioma, 'recuperar_boton')}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-8 max-w-md mx-auto">

      {/* Selector idioma */}
      <div className="flex justify-end mb-4">
        <select
          value={idioma}
          onChange={e => onCambiarIdioma(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
        >
          {IDIOMAS.map(i => (
            <option key={i.codigo} value={i.codigo}>{i.nombre}</option>
          ))}
        </select>
      </div>

      <h1 className="text-3xl font-bold mb-6">{t(idioma, 'login_titulo')}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'email')}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'password')}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <button onClick={entrar} disabled={cargando} className="bg-green-600 text-white px-4 py-3 rounded-xl mt-6 font-medium disabled:opacity-50">
        {cargando ? t(idioma, 'cargando') : t(idioma, 'iniciar_sesion')}
      </button>

      <button onClick={() => setVista('recuperar')} className="text-sm text-gray-500 mt-3 hover:text-gray-700">
        {t(idioma, 'olvide_password')}
      </button>

      <button onClick={onIrRegistro} className="text-sm text-green-600 mt-4 hover:text-green-700">
        {t(idioma, 'no_tengo_cuenta')}
      </button>
    </div>
  )
}