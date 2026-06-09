'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { t, IDIOMAS } from '../lib/traducciones'

export default function Perfil({ usuario, idioma, onCambiarIdioma, onActualizar, onVolver }) {
  const [nombre, setNombre] = useState(usuario?.nombre || '')
  const [organizacion, setOrganizacion] = useState(usuario?.organizacion || '')
  const [notifEmail, setNotifEmail] = useState(usuario?.notificaciones_email || false)
  const [idiomaElegido, setIdiomaElegido] = useState(idioma || 'es')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [textoConfirm, setTextoConfirm] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const LABELS_ORG = {
    es: { hospital: 'Nombre del hospital', farmacia: 'Nombre de la farmacia', medico: 'Centro de trabajo' },
    eu: { hospital: 'Ospitalearen izena', farmacia: 'Farmaziaren izena', medico: 'Lan-zentroa' },
    ca: { hospital: "Nom de l'hospital", farmacia: 'Nom de la farmàcia', medico: 'Centre de treball' },
  }
  const labelOrg = LABELS_ORG[idioma]?.[usuario?.rol] || LABELS_ORG.es[usuario?.rol]
  const esPremium = usuario?.plan === 'premium'

  const TEXTO_CONFIRMACION = {
    es: 'ELIMINAR',
    eu: 'EZABATU',
    ca: 'ELIMINAR',
  }
  const palabraConfirmar = TEXTO_CONFIRMACION[idioma] || 'ELIMINAR'

  const guardarPerfil = async () => {
    setError('')
    setMensaje('')
    setCargando(true)
    const { error: dbErr } = await supabase
      .from('usuarios')
      .update({
        nombre,
        organizacion,
        notificaciones_email: notifEmail,
        idioma: idiomaElegido,
      })
      .eq('id', usuario.id)
    if (dbErr) {
      setError(dbErr.message)
    } else {
      setMensaje(t(idioma, 'perfil_actualizado'))
      onCambiarIdioma(idiomaElegido)
      onActualizar({ ...usuario, nombre, organizacion, notificaciones_email: notifEmail, idioma: idiomaElegido })
    }
    setCargando(false)
  }

  const cambiarPassword = async () => {
    setError('')
    setMensaje('')
    if (nuevaPassword.length < 6) {
      setError(t(idioma, 'error_password_corta'))
      return
    }
    setCargando(true)
    const { error: authErr } = await supabase.auth.updateUser({ password: nuevaPassword })
    if (authErr) {
      setError(authErr.message)
    } else {
      setMensaje(t(idioma, 'password_cambiada'))
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
        setError(data.error || t(idioma, 'error_generico'))
        setCargando(false)
      }
    } catch (err) {
      setError(err.message)
      setCargando(false)
    }
  }

  const eliminarCuenta = async () => {
    setError('')
    if (textoConfirm !== palabraConfirmar) {
      setError(t(idioma, 'escribe_eliminar'))
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
      <button onClick={onVolver} className="text-sm text-gray-500 mb-4">{t(idioma, 'volver')}</button>
      <h2 className="text-2xl font-bold mb-1">{t(idioma, 'mi_perfil')}</h2>
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
        <div className="text-sm font-medium text-gray-500 mb-3">{t(idioma, 'datos_personales')}</div>
        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'nombre')}</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        {labelOrg && (
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">{labelOrg}</label>
            <input value={organizacion} onChange={e => setOrganizacion(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        )}
        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'idioma')}</label>
          <select value={idiomaElegido} onChange={e => setIdiomaElegido(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            {IDIOMAS.map(i => (
              <option key={i.codigo} value={i.codigo}>{i.nombre}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
          <input type="checkbox" checked={notifEmail} onChange={e => setNotifEmail(e.target.checked)} />
          {t(idioma, 'recibir_avisos')}
        </label>
        <button onClick={guardarPerfil} disabled={cargando} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          {t(idioma, 'guardar_cambios')}
        </button>
      </div>

      {esPremium && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4">
          <div className="text-sm font-medium text-amber-800 mb-1">{t(idioma, 'suscripcion_activa')}</div>
          <p className="text-xs text-amber-700 mb-3">{t(idioma, 'suscripcion_descripcion')}</p>
          <button onClick={gestionarSuscripcion} disabled={cargando} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {cargando ? t(idioma, 'abriendo') : t(idioma, 'gestionar_suscripcion')}
          </button>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-5 mb-4">
        <div className="text-sm font-medium text-gray-500 mb-3">{t(idioma, 'cambiar_password')}</div>
        <input type="password" value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} placeholder={t(idioma, 'nueva_password')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
        <button onClick={cambiarPassword} disabled={cargando} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          {t(idioma, 'cambiar_password')}
        </button>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <div className="text-sm font-medium text-red-700 mb-2">{t(idioma, 'zona_peligrosa')}</div>
        <p className="text-xs text-red-600 mb-3">{t(idioma, 'eliminar_cuenta_aviso')}</p>
        {!confirmEliminar ? (
          <button onClick={() => setConfirmEliminar(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {t(idioma, 'eliminar_mi_cuenta')}
          </button>
        ) : (
          <div>
            <p className="text-xs text-red-700 mb-2">{t(idioma, 'escribe_eliminar').replace('ELIMINAR', palabraConfirmar)} <strong>{palabraConfirmar}</strong></p>
            <input value={textoConfirm} onChange={e => setTextoConfirm(e.target.value)} className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm mb-3" />
            <div className="flex gap-2">
              <button onClick={eliminarCuenta} disabled={cargando} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {t(idioma, 'confirmar_eliminacion')}
              </button>
              <button onClick={() => { setConfirmEliminar(false); setTextoConfirm('') }} className="border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm">
                {t(idioma, 'cancelar')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}