'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function RestablecerPassword() {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)

  useEffect(() => {
    // Comprobar si hay una sesión activa de recuperación
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setListo(true)
      } else {
        setError('Enlace expirado o inválido. Pide otro enlace de recuperación.')
      }
    })
  }, [])

  const handleSubmit = async () => {
    setError('')
    setMensaje('')

    if (!password || !password2) {
      setError('Rellena ambos campos')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== password2) {
      setError('Las contraseñas no coinciden')
      return
    }

    setCargando(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
      setCargando(false)
      return
    }

    setMensaje('¡Contraseña actualizada! Ya puedes entrar con la nueva contraseña.')
    setCargando(false)

    // Después de 3 segundos redirigir al login
    setTimeout(() => {
      window.location.href = '/'
    }, 3000)
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="font-bold text-2xl mb-1 text-center">Medi<span className="text-green-600">Caduca</span></h1>
        <p className="text-gray-500 text-sm mb-6 text-center">Restablecer contraseña</p>

        {!listo && !error && (
          <div className="text-center text-gray-500 text-sm py-8">
            Cargando...
          </div>
        )}

        {error && !listo && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
            ⚠️ {error}
          </div>
        )}

        {listo && !mensaje && (
          <>
            <div className="bg-gray-50 rounded-xl p-5 mb-6">
              <div className="text-sm font-medium text-gray-500 mb-4">Nueva contraseña</div>

              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="········"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Repetir contraseña</label>
                <input
                  type="password"
                  value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  placeholder="········"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={cargando}
              className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {cargando ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </>
        )}

        {mensaje && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-3 text-center">
            ✅ {mensaje}
          </div>
        )}

        <div className="text-center mt-4">
          <a href="/" className="text-xs text-gray-500 hover:underline">← Volver al inicio</a>
        </div>
      </div>
    </main>
  )
}