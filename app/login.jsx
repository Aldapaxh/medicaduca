'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../lib/traducciones'
import { IDIOMAS } from '../lib/traducciones'

export default function Login({ idioma, onCambiarIdioma, onLogin, onIrRegistro }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [olvido, setOlvido] = useState(false)
  const [emailOlvido, setEmailOlvido] = useState('')
  const [mensajeOlvido, setMensajeOlvido] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!email || !password) {
      setError(t(idioma, 'error_campos_vacios'))
      return
    }
    setCargando(true)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      setCargando(false)
      return
    }

    if (data.user) {
      // Cargar perfil completo de Supabase
      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (perfilError) {
        setError('Error: ' + perfilError.message + ' (código: ' + (perfilError.code || 'sin código') + ')')
        setCargando(false)
        return
      }
      if (!perfil) {
        setError('Perfil no encontrado para el id: ' + data.user.id)
        setCargando(false)
        return
      }

      onLogin(perfil)
    }

    setCargando(false)
  }

  const handleOlvido = async () => {
    setMensajeOlvido('')
    if (!emailOlvido) {
      setMensajeOlvido(t(idioma, 'introduce_email'))
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(emailOlvido)
    if (error) {
      setMensajeOlvido(error.message)
    } else {
      setMensajeOlvido(t(idioma, 'email_enviado'))
    }
  }

  if (olvido) {
    return (
      <div className="py-8 max-w-md mx-auto px-4">
        <h1 className="font-bold text-2xl mb-1">Medi<span className="text-green-600">Caduca</span></h1>
        <p className="text-gray-500 text-sm mb-6">{t(idioma, 'recuperar_password')}</p>

        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'email')}</label>
            <input type="email" value={emailOlvido} onChange={e => setEmailOlvido(e.target.value)} placeholder="email@ejemplo.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
          </div>
        </div>

        {mensajeOlvido && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-3 py-2 mb-4">
            {mensajeOlvido}
          </div>
        )}

        <button onClick={handleOlvido} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 mb-3">
          {t(idioma, 'enviar_email_recuperar')}
        </button>

        <button onClick={() => setOlvido(false)} className="w-full text-gray-500 text-sm hover:underline">
          {t(idioma, 'volver_login')}
        </button>
      </div>
    )
  }

  return (
    <div className="py-8 max-w-md mx-auto px-4">
      <div className="flex justify-end mb-4">
        <select value={idioma} onChange={e => onCambiarIdioma(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white">
          {IDIOMAS.map(i => (
            <option key={i.codigo} value={i.codigo}>{i.bandera} {i.nombre}</option>
          ))}
        </select>
      </div>

      <h1 className="font-bold text-2xl mb-1">Medi<span className="text-green-600">Caduca</span></h1>
      <p className="text-gray-500 text-sm mb-6">{t(idioma, 'bienvenido_de_nuevo')}</p>

      <div className="bg-gray-50 rounded-xl p-5 mb-6">
        <div className="text-sm font-medium text-gray-500 mb-4">{t(idioma, 'iniciar_sesion')}</div>
        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'email')}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'password')}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="········" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
          ⚠️ {error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={cargando} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 mb-3">
        {cargando ? t(idioma, 'entrando') : t(idioma, 'entrar')}
      </button>

      <div className="text-center mb-3">
        <button onClick={() => setOlvido(true)} className="text-xs text-gray-500 hover:underline">
          {t(idioma, 'olvide_password')}
        </button>
      </div>

      <div className="text-center text-sm text-gray-500">
        {t(idioma, 'no_tienes_cuenta')}{' '}
        <button onClick={onIrRegistro} className="text-green-600 font-medium hover:underline">
          {t(idioma, 'registrate_gratis')}
        </button>
      </div>
    </div>
  )
}