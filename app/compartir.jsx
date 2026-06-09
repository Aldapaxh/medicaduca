'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../lib/traducciones'

export default function Compartir({ usuario, idioma, isPremium, onVolver }) {
  const [emailInvitar, setEmailInvitar] = useState('')
  const [miembros, setMiembros] = useState([])
  const [invitaciones, setInvitaciones] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    cargarTodo()
  }, [])

  const cargarTodo = async () => {
    setCargando(true)

    // Miembros que yo he invitado
    const { data: mios } = await supabase
      .from('miembros_botiquin')
      .select('*')
      .eq('dueno_id', usuario.id)

    if (mios && mios.length > 0) {
      const ids = mios.map(m => m.miembro_id)
      const { data: perfiles } = await supabase
        .from('usuarios')
        .select('id, nombre, email')
        .in('id', ids)

      const miembrosConDatos = mios.map(m => {
        const p = perfiles?.find(p => p.id === m.miembro_id)
        return { ...m, nombre: p?.nombre, emailMiembro: p?.email }
      })
      setMiembros(miembrosConDatos)
    } else {
      setMiembros([])
    }

    // Invitaciones pendientes que YO he recibido
    const { data: pendientes } = await supabase
      .from('miembros_botiquin')
      .select('*')
      .eq('miembro_id', usuario.id)
      .eq('estado', 'pendiente')

    if (pendientes && pendientes.length > 0) {
      const ids = pendientes.map(p => p.dueno_id)
      const { data: perfiles } = await supabase
        .from('usuarios')
        .select('id, nombre, email')
        .in('id', ids)

      const invitacionesConDatos = pendientes.map(p => {
        const d = perfiles?.find(u => u.id === p.dueno_id)
        return { ...p, nombreDueno: d?.nombre, emailDueno: d?.email }
      })
      setInvitaciones(invitacionesConDatos)
    } else {
      setInvitaciones([])
    }

    setCargando(false)
  }

  const invitar = async () => {
    setError('')
    setMensaje('')
    if (!emailInvitar) {
      setError(t(idioma, 'error_completa_campos'))
      return
    }
    if (emailInvitar === usuario.email) {
      setError(t(idioma, 'error_generico'))
      return
    }
    if (miembros.length >= 4) {
      setError(t(idioma, 'limite_invitados'))
      return
    }

    setCargando(true)

    // Buscar usuario por email
    const { data: perfilBuscado } = await supabase
      .from('usuarios')
      .select('id, email')
      .ilike('email', emailInvitar)
      .single()

    if (!perfilBuscado) {
      setError(t(idioma, 'error_generico') + ' — Usuario no encontrado')
      setCargando(false)
      return
    }

    // Comprobar si ya existe invitación
    const { data: existente } = await supabase
      .from('miembros_botiquin')
      .select('id')
      .eq('dueno_id', usuario.id)
      .eq('miembro_id', perfilBuscado.id)
      .maybeSingle()

    if (existente) {
      setError('Ya existe una invitación a este usuario')
      setCargando(false)
      return
    }

    // Crear invitación
    const { error: errInsert } = await supabase
      .from('miembros_botiquin')
      .insert({
        dueno_id: usuario.id,
        miembro_id: perfilBuscado.id,
        estado: 'pendiente',
      })

    if (errInsert) {
      setError(errInsert.message)
      setCargando(false)
      return
    }

    setMensaje(t(idioma, 'invitacion_enviada'))
    setEmailInvitar('')
    cargarTodo()
  }

  const aceptarInvitacion = async (id) => {
    setCargando(true)
    await supabase.from('miembros_botiquin').update({ estado: 'aceptada' }).eq('id', id)
    cargarTodo()
  }

  const rechazarInvitacion = async (id) => {
    setCargando(true)
    await supabase.from('miembros_botiquin').delete().eq('id', id)
    cargarTodo()
  }

  const eliminarMiembro = async (id) => {
    setCargando(true)
    await supabase.from('miembros_botiquin').delete().eq('id', id)
    cargarTodo()
  }

  if (!isPremium) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <button onClick={onVolver} className="text-sm text-gray-500 mb-4">{t(idioma, 'volver')}</button>
        <h2 className="text-2xl font-bold mb-4">{t(idioma, 'compartir_titulo')}</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm text-amber-800">{t(idioma, 'compartir_premium_aviso')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <button onClick={onVolver} className="text-sm text-gray-500 mb-4">{t(idioma, 'volver')}</button>
      <h2 className="text-2xl font-bold mb-6">{t(idioma, 'compartir_titulo')}</h2>

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

      {invitaciones.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="text-sm font-medium text-blue-800 mb-3">{t(idioma, 'invitaciones_pendientes')}</div>
          {invitaciones.map(inv => (
            <div key={inv.id} className="bg-white rounded-lg p-3 mb-2 last:mb-0">
              <div className="text-sm font-medium">{inv.nombreDueno}</div>
              <div className="text-xs text-gray-500 mb-2">{inv.emailDueno}</div>
              <div className="flex gap-2">
                <button onClick={() => aceptarInvitacion(inv.id)} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg">
                  {t(idioma, 'aceptar')}
                </button>
                <button onClick={() => rechazarInvitacion(inv.id)} className="border border-gray-200 text-gray-500 text-xs px-3 py-1.5 rounded-lg">
                  {t(idioma, 'rechazar')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-5 mb-4">
        <div className="text-sm font-medium text-gray-700 mb-3">{t(idioma, 'invitar_familiar')}</div>
        <input
          type="email"
          value={emailInvitar}
          onChange={e => setEmailInvitar(e.target.value)}
          placeholder={t(idioma, 'invitar_email')}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
        />
        <button onClick={invitar} disabled={cargando} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          {cargando ? t(idioma, 'cargando') : t(idioma, 'invitar_boton')}
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-5">
        <div className="text-sm font-medium text-gray-700 mb-3">{t(idioma, 'miembros_titulo')}</div>
        {miembros.length === 0 && (
          <p className="text-sm text-gray-500">{t(idioma, 'sin_miembros')}</p>
        )}
        {miembros.map(m => (
          <div key={m.id} className="bg-white rounded-lg p-3 mb-2 last:mb-0 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{m.nombre}</div>
              <div className="text-xs text-gray-500">{m.emailMiembro}</div>
              <div className="text-xs mt-1">
                <span className={`px-2 py-0.5 rounded-full ${
                  m.estado === 'aceptada' ? 'bg-green-100 text-green-700' :
                  m.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {m.estado}
                </span>
              </div>
            </div>
            <button onClick={() => eliminarMiembro(m.id)} className="text-gray-400 hover:text-red-500 text-sm">
              {t(idioma, 'eliminar')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}