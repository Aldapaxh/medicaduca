'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login({ onLogin, onIrARegistro }) {
  const [modo, setModo] = useState('login') // 'login' o 'recuperar'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const handleSubmit = async () => {
    setError('')
    setMensaje('')
    if (!email || !password) {
      setError('Rellena email y contraseña')
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
      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (perfilError) {
        setError('Error al cargar perfil: ' + perfilError.message)
        setCargando(false)
        return
      }

      onLogin({
        id: perfil.id,
        nombre: perfil.nombre,
        email: perfil.email,
        rol: perfil.rol,
        organizacion: perfil.organizacion,
      })
    }

    setCargando(false)
  }

  const handleRecuperar = async () => {
    setError('')
    setMensaje('')
    if (!email) {
      setError('Escribe tu email')
      return
    }

    setCargando(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setMensaje('Te hemos enviado un email con las instrucciones para recuperar tu contraseña. Revisa tu bandeja de entrada.')
    }

    setCargando(false)
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      <h1 className="font-bold text-2xl mb-1">Medi<span className="text-green-600">Caduca</span></h1>
      <p className="text-gray-500 text-sm mb-6">
        {modo === 'login' ? 'Bienvenido de nuevo' : 'Recuperar contraseña'}
      </p>

      {modo === 'login' ? (
        <>
          <div className="bg-gray-50 rounded-xl p-5 mb-4">
            <div className="text-sm font-medium text-gray-500 mb-4">Inicia sesión</div>
            <div className="mb-3">
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ana@email.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="········" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
            </div>
            <button onClick={() => { setModo('recuperar'); setError(''); setMensaje('') }} className="text-xs text-green-600 hover:underline mt-2">
              ¿Has olvidado tu contraseña?
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={cargando} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 mb-3">
            {cargando ? 'Entrando...' : 'Entrar →'}
          </button>

          <div className="text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <button onClick={onIrARegistro} className="text-green-600 font-medium hover:underline">
              Regístrate gratis
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="bg-gray-50 rounded-xl p-5 mb-4">
            <div className="text-sm font-medium text-gray-500 mb-3">Te enviaremos un email con instrucciones para crear una nueva contraseña.</div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ana@email.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
              ⚠️ {error}
            </div>
          )}

          {mensaje && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2 mb-4">
              ✓ {mensaje}
            </div>
          )}

          <button onClick={handleRecuperar} disabled={cargando} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 mb-3">
            {cargando ? 'Enviando...' : 'Enviar email de recuperación →'}
          </button>

          <button onClick={() => { setModo('login'); setError(''); setMensaje('') }} className="w-full text-center text-sm text-gray-500 hover:underline">
            ← Volver al login
          </button>
        </>
      )}
    </div>
  )
}