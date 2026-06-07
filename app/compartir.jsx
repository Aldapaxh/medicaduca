'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const MAX_MIEMBROS = 4 // 4 invitados + 1 dueño = 5

export default function Compartir({ usuario, isPremium, onVolver }) {
  const [emailInvitar, setEmailInvitar] = useState('')
  const [miembros, setMiembros] = useState([])
  const [invitacionesRecibidas, setInvitacionesRecibidas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    // Miembros que YO he invitado (soy dueño)
    const { data: misMiembros } = await supabase
      .from('miembros_botiquin')
      .select('id, miembro_id, estado, created_at')
      .eq('dueno_id', usuario.id)

    if (misMiembros && misMiembros.length > 0) {
      const ids = misMiembros.map(m => m.miembro_id)
      const { data: perfiles } = await supabase
        .from('usuarios')
        .select('id, nombre, email')
        .in('id', ids)

      const miembrosCompletos = misMiembros.map(m => {
        const perfil = perfiles?.find(p => p.id === m.miembro_id)
        return { ...m, nombre: perfil?.nombre, email: perfil?.email }
      })
      setMiembros(miembrosCompletos)
    } else {
      setMiembros([])
    }

    // Invitaciones donde YO soy el invitado (pendientes)
    const { data: invitaciones } = await supabase
      .from('miembros_botiquin')
      .select('id, dueno_id, estado, created_at')
      .eq('miembro_id', usuario.id)
      .eq('estado', 'pendiente')

    if (invitaciones && invitaciones.length > 0) {
      const ids = invitaciones.map(i => i.dueno_id)
      const { data: perfiles } = await supabase
        .from('usuarios')
        .select('id, nombre, email')
        .in('id', ids)

      const invCompletas = invitaciones.map(i => {
        const perfil = perfiles?.find(p => p.id === i.dueno_id)
        return { ...i, nombreDueno: perfil?.nombre, emailDueno: perfil?.email }
      })
      setInvitacionesRecibidas(invCompletas)
    } else {
      setInvitacionesRecibidas([])
    }

    setCargando(false)
  }

  const invitar = async () => {
    setError('')
    setMensaje('')

    if (!isPremium) {
      setError('Invitar miembros es una función Premium')
      return
    }

    if (!emailInvitar) {
      setError('Escribe el email de la persona a invitar')
      return
    }

    if (emailInvitar === usuario.email) {
      setError('No puedes invitarte a ti mismo')
      return
    }

    if (miembros.length >= MAX_MIEMBROS) {
      setError(`Máximo ${MAX_MIEMBROS} invitados por botiquín`)
      return
    }

    setEnviando(true)

    // Buscar el usuario por email
    const { data: usuarioInvitado, error: buscarErr } = await supabase
      .from('usuarios')
      .select('id, nombre, email')
      .eq('email', emailInvitar)
      .maybeSingle()

    if (buscarErr || !usuarioInvitado) {
      setError('No existe ningún usuario con ese email. Pídele que se registre en MediCaduca primero.')
      setEnviando(false)
      return
    }

    // Comprobar que no esté ya invitado
    const yaInvitado = miembros.find(m => m.miembro_id === usuarioInvitado.id)
    if (yaInvitado) {
      setError('Ya has invitado a esta persona')
      setEnviando(false)
      return
    }

    // Crear invitación
    const { error: insertErr } = await supabase
      .from('miembros_botiquin')
      .insert({
        dueno_id: usuario.id,
        miembro_id: usuarioInvitado.id,
        estado: 'pendiente',
      })

    if (insertErr) {
      setError('Error al invitar: ' + insertErr.message)
    } else {
      setMensaje(`Invitación enviada a ${usuarioInvitado.nombre}`)
      setEmailInvitar('')
      cargarDatos()
    }

    setEnviando(false)
  }

  const responderInvitacion = async (id, aceptar) => {
    const { error } = await supabase
      .from('miembros_botiquin')
      .update({ estado: aceptar ? 'aceptada' : 'rechazada' })
      .eq('id', id)

    if (error) {
      setError('Error: ' + error.message)
    } else {
      setMensaje(aceptar ? 'Invitación aceptada' : 'Invitación rechazada')
      cargarDatos()
    }
  }

  const eliminarMiembro = async (id) => {
    const { error } = await supabase
      .from('miembros_botiquin')
      .delete()
      .eq('id', id)

    if (error) {
      setError('Error: ' + error.message)
    } else {
      setMensaje('Miembro eliminado')
      cargarDatos()
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <button onClick={onVolver} className="text-sm text-gray-500 mb-4">← Volver</button>
      <h2 className="text-2xl font-bold mb-1">Compartir botiquín</h2>
      <p className="text-sm text-gray-500 mb-6">Invita hasta 4 familiares o cuidadores</p>

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

      {/* Invitaciones recibidas pendientes */}
      {invitacionesRecibidas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="text-sm font-medium text-amber-800 mb-3">📩 Invitaciones recibidas</div>
          {invitacionesRecibidas.map(inv => (
            <div key={inv.id} className="bg-white rounded-lg p-3 mb-2">
              <div className="text-sm font-medium">{inv.nombreDueno}</div>
              <div className="text-xs text-gray-500 mb-3">{inv.emailDueno} te invita a su botiquín</div>
              <div className="flex gap-2">
                <button onClick={() => responderInvitacion(inv.id, true)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                  ✓ Aceptar
                </button>
                <button onClick={() => responderInvitacion(inv.id, false)} className="border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg text-xs">
                  ✕ Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invitar nuevo miembro */}
      <div className="bg-gray-50 rounded-xl p-5 mb-4">
        <div className="text-sm font-medium text-gray-500 mb-3">
          Invitar a alguien
          {!isPremium && <span className="ml-2 text-xs text-amber-600">👑 Solo Premium</span>}
        </div>
        <p className="text-xs text-gray-500 mb-3">
          La persona invitada podrá ver tu botiquín en modo lectura. Solo tú puedes añadir o eliminar medicamentos.
        </p>
        <input
          type="email"
          value={emailInvitar}
          onChange={e => setEmailInvitar(e.target.value)}
          placeholder="email@ejemplo.com"
          disabled={!isPremium || enviando}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 disabled:opacity-50"
        />
        <button
          onClick={invitar}
          disabled={!isPremium || enviando}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {enviando ? 'Enviando...' : 'Enviar invitación'}
        </button>
      </div>

      {/* Miembros actuales */}
      <div className="bg-gray-50 rounded-xl p-5">
        <div className="text-sm font-medium text-gray-500 mb-3">
          Miembros de mi botiquín ({miembros.length}/{MAX_MIEMBROS})
        </div>
        {cargando && <p className="text-xs text-gray-400">Cargando...</p>}
        {!cargando && miembros.length === 0 && (
          <p className="text-xs text-gray-400">Aún no has invitado a nadie</p>
        )}
        {miembros.map(m => (
          <div key={m.id} className="bg-white rounded-lg p-3 mb-2 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{m.nombre || 'Sin nombre'}</div>
              <div className="text-xs text-gray-500 truncate">{m.email}</div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              m.estado === 'aceptada' ? 'bg-green-100 text-green-700' :
              m.estado === 'rechazada' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {m.estado === 'aceptada' ? 'Activo' : m.estado === 'rechazada' ? 'Rechazada' : 'Pendiente'}
            </span>
            <button onClick={() => eliminarMiembro(m.id)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}