'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Perfil({ usuario, onActualizar, onVolver }) {
  const [nombre, setNombre] = useState(usuario?.nombre || '')
  const [organizacion, setOrganizacion] = useState(usuario?.organizacion || '')
  const [notifEmail, setNotifEmail] = useState(usuario?.notificaciones_email || false)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [textoConfirm, setTextoConfirm] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const ROLE_EXTRA_LABEL = {
    hospital: 'Nombre del hospital',
    farmacia: 'Nombre de la farmacia',
    medico: 'Centro de trabajo',
  }
  const labelOrg = ROLE_EXTRA_LABEL[usuario?.rol]
  const esPremium = usuario?.plan === 'premium'

  const guardarPerfil = async () => {
    setError('')
    setMensaje('')
    setCargando(true)
    const { error: dbErr } = await supabase
      .from('usuarios')
      .update({ nombre, organizacion, notificaciones_email: notifEmail })
      .eq('id', usuario.id)
    if (dbErr) {
      setError('Error al guardar: ' + dbErr.message)
    } else {
      setMensaje('Perfil actualizado correctamente')
      onActualizar({ ...usuario, nombre, organizacion, notificaciones_email: notifEmail })
    }
    setCargando(false)
  }

  const cambiarPassword = async () => {
    setError('')
    setMensaje('')
    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setCargando(true)
    const { error: authErr } = await supabase.auth.updateUser({ password: nuevaPassword })
    if (authErr) {
      setError('Error al cambiar contraseña: ' + authErr.message)
    } else {
      setMensaje('Contraseña cambiada correctamente')
      setNuevaPassword('')
    }
    setCargando(false)
  }

  const gestionarSuscripcion = async () => {
    setError('')
    setMensaje('')
    setCargando(true)
    try {
      const respuesta = await fetch('/api/stripe-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: usuario.id }),
      })
      const data = await respuesta.json()
      if (data.ok && data.url) {
        window.location.href = data.url
      } else {
        setError('Error: ' + (data.error || 'No se pudo abrir el portal'))
        setCargando(false)
      }
    } catch (err) {
      setError('Error: ' + err.message)
      setCargando(false)
    }
  }

  const eliminarCuenta = async () => {
    setError('')
    if (textoConfirm !== 'ELIMINAR') {
      setError('Escribe ELIMINAR para confirmar')
      return
    }
    setCargando(true)
    await supabase.from('medicamentos').delete().eq('usuario_id', usuario.id)
    await supabase.from('usuarios').delete().eq('id', usuario.id)
    await supabase.auth.signOut()
    setCargando(false)
    onVolver()
    window.location.reload()
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <button onClick={onVolver} className="text-sm text-gray-500 mb-4">← Volver</button>
      <h2 className="text-2xl font-bold mb-1">Mi perfil</h2>
      <p className="text-sm text-gray-500 mb-6">{usuario?.email}</p>

      {mensaje && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2 mb-4">
          ✓ {mensaje}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-5 mb-4">
        <div className="text-sm font-medium text-gray-500 mb-3">Datos personales</div>
        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        {labelOrg && (
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">{labelOrg}</label>
            <input value={organizacion} onChange={e => setOrganizacion(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
          <input type="checkbox" checked={notifEmail} onChange={e => setNotifEmail(e.target.checked)} />
          Recibir avisos por email cuando un medicamento caduque pronto
        </label>
        <button onClick={guardarPerfil} disabled={cargando} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          Guardar cambios
        </button>
      </div>

      {esPremium && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4">
          <div className="text-sm font-medium text-amber-800 mb-1">👑 Suscripción Premium activa</div>
          <p className="text-xs text-amber-700 mb-3">Gestiona tu suscripción, cambia el método de pago, ve tus facturas o cancela cuando quieras.</p>
          <button onClick={gestionarSuscripcion} disabled={cargando} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {cargando ? 'Abriendo...' : 'Gestionar suscripción'}
          </button>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-5 mb-4">
        <div className="text-sm font-medium text-gray-500 mb-3">Cambiar contraseña</div>
        <input type="password" value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} placeholder="Nueva contraseña (mín. 6 caracteres)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
        <button onClick={cambiarPassword} disabled={cargando} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          Cambiar contraseña
        </button>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <div className="text-sm font-medium text-red-700 mb-2">Zona peligrosa</div>
        <p className="text-xs text-red-600 mb-3">Eliminar tu cuenta borrará todos tus medicamentos y datos para siempre. No se puede deshacer.</p>
        {!confirmEliminar ? (
          <button onClick={() => setConfirmEliminar(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Eliminar mi cuenta
          </button>
        ) : (
          <div>
            <p className="text-xs text-red-700 mb-2">Escribe <strong>ELIMINAR</strong> para confirmar:</p>
            <input value={textoConfirm} onChange={e => setTextoConfirm(e.target.value)} className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm mb-3" />
            <div className="flex gap-2">
              <button onClick={eliminarCuenta} disabled={cargando} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                Confirmar eliminación
              </button>
              <button onClick={() => { setConfirmEliminar(false); setTextoConfirm('') }} className="border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}