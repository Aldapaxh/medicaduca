'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { buscarMedicamentoPorCodigo } from '../lib/cima'
import { t } from '../lib/traducciones'
import Escaner from './escaner'
import Perfil from './perfil'
import Compartir from './compartir'

const ICONOS = { analgésico:'💊', antibiótico:'🔬', antihistamínico:'🌿', digestivo:'🫙', vitamina:'🧡', otro:'📦' }

function getEstado(caducidad) {
  if (!caducidad) return 'ok'
  const partes = caducidad.split('-')
  if (partes.length < 2) return 'ok'
  const y = parseInt(partes[0])
  const m = parseInt(partes[1])
  if (isNaN(y) || isNaN(m)) return 'ok'
  const hoy = new Date()
  const fecha = new Date(y, m, 0)
  const dias = (fecha - hoy) / 86400000
  if (dias < 0) return 'caducado'
  if (dias < 60) return 'urgente'
  if (dias < 180) return 'pronto'
  return 'ok'
}

function getEtiqueta(estado, idioma) {
  return t(idioma, 'estado_' + estado)
}

function getDiasTexto(caducidad, idioma) {
  if (!caducidad) return t(idioma, 'sin_fecha')
  const partes = caducidad.split('-')
  if (partes.length < 2) return t(idioma, 'sin_fecha')
  const y = parseInt(partes[0])
  const m = parseInt(partes[1])
  if (isNaN(y) || isNaN(m)) return t(idioma, 'sin_fecha')
  const hoy = new Date()
  const fecha = new Date(y, m, 0)
  const dias = Math.ceil((fecha - hoy) / 86400000)
  if (dias < 0) return t(idioma, 'dias_caducado', { dias: Math.abs(dias) })
  if (dias === 0) return t(idioma, 'dias_caduca_hoy')
  return t(idioma, 'dias_caduca_en', { dias })
}

const COLORES = {
  ok:       { fondo:'bg-green-50',  badge:'bg-green-100 text-green-700' },
  pronto:   { fondo:'bg-amber-50',  badge:'bg-amber-100 text-amber-700' },
  urgente:  { fondo:'bg-red-50',    badge:'bg-red-100 text-red-700' },
  caducado: { fondo:'bg-red-50',    badge:'bg-red-100 text-red-700' },
}

const EXTRA_LABEL = {
  es: { hospital:'Planta / Unidad', farmacia:'Referencia / Lote', medico:'Paciente / Expediente' },
  eu: { hospital:'Solairua / Unitatea', farmacia:'Erreferentzia / Lotea', medico:'Pazientea / Espedientea' },
  ca: { hospital:'Planta / Unitat', farmacia:'Referència / Lot', medico:'Pacient / Expedient' },
}

function fechaCaducidadCompleta(yearMonth) {
  if (!yearMonth) return null
  const partes = yearMonth.split('-')
  if (partes.length < 2) return null
  return `${partes[0]}-${partes[1]}-01`
}

function fechaCaducidadCorta(fechaCompleta) {
  if (!fechaCompleta) return ''
  return fechaCompleta.substring(0, 7)
}

function SelectorFecha({ value, onChange, idioma }) {
  const MESES = t(idioma, 'meses')
  const AÑOS = Array.from({length:10}, (_,i) => 2024 + i)
  const partes = value ? value.split('-') : ['', '']
  const añoActual = partes[0] || ''
  const mesActual = partes[1] || ''

  const handleMes = (m) => {
    const a = añoActual || new Date().getFullYear()
    onChange(`${a}-${m}`)
  }
  const handleAño = (a) => {
    const m = mesActual || '01'
    onChange(`${a}-${m}`)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <select value={mesActual} onChange={e => handleMes(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400">
        <option value="">{t(idioma, 'mes')}</option>
        {MESES.map((mes, i) => (
          <option key={i} value={String(i+1).padStart(2,'0')}>{mes}</option>
        ))}
      </select>
      <select value={añoActual} onChange={e => handleAño(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400">
        <option value="">{t(idioma, 'anio')}</option>
        {AÑOS.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  )
}

export default function AppPrincipal({ usuario, idioma, onCambiarIdioma, onCerrarSesion }) {
  const [vista, setVista] = useState('app')
  const [usuarioActual, setUsuarioActual] = useState(usuario)
  const [tab, setTab] = useState('lista')
  const [meds, setMeds] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modo, setModo] = useState('manual')
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('analgésico')
  const [caducidad, setCaducidad] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [extra, setExtra] = useState('')
  const [escanerActivo, setEscanerActivo] = useState(false)
  const [buscandoCima, setBuscandoCima] = useState(false)
  const [medEscaneado, setMedEscaneado] = useState(null)
  const [scanCaducidad, setScanCaducidad] = useState('')
  const [scanCantidad, setScanCantidad] = useState('')
  const [toast, setToast] = useState('')
  const [errorScan, setErrorScan] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const [exportandoPDF, setExportandoPDF] = useState(false)
  const [botiquines, setBotiquines] = useState([])
  const [botiquinActivo, setBotiquinActivo] = useState(usuario.id)
  const [invitacionesPendientes, setInvitacionesPendientes] = useState(0)
  const [activandoPremium, setActivandoPremium] = useState(false)

  const esBotiquinPropio = botiquinActivo === usuario.id
  const initials = (usuarioActual?.organizacion || usuarioActual?.nombre || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)
  const display = usuarioActual?.organizacion || usuarioActual?.nombre || 'Usuario'
  const extraLabel = EXTRA_LABEL[idioma]?.[usuarioActual?.rol] || EXTRA_LABEL.es[usuarioActual?.rol]

  const CATEGORIAS = [
    { val: 'analgésico', label: t(idioma, 'cat_analgesico') },
    { val: 'antibiótico', label: t(idioma, 'cat_antibiotico') },
    { val: 'antihistamínico', label: t(idioma, 'cat_antihistaminico') },
    { val: 'digestivo', label: t(idioma, 'cat_digestivo') },
    { val: 'vitamina', label: t(idioma, 'cat_vitamina') },
    { val: 'otro', label: t(idioma, 'cat_otro') },
  ]

  useEffect(() => {
    cargarPerfilCompleto()
    cargarBotiquines()
    const params = new URLSearchParams(window.location.search)
    if (params.get('pago') === 'ok') {
      mostrarToast('¡Pago realizado! Activando Premium...')
      window.history.replaceState({}, document.title, '/')
      setTimeout(() => cargarPerfilCompleto(), 3000)
    }
  }, [])

  useEffect(() => {
    cargarMedicamentos()
  }, [botiquinActivo])

  const cargarPerfilCompleto = async () => {
    const { data } = await supabase.from('usuarios').select('*').eq('id', usuario.id).single()
    if (data) {
      setUsuarioActual({ ...usuario, ...data })
      setIsPremium(data.plan === 'premium')
    }
  }

  const cargarBotiquines = async () => {
    const { data: comoMiembro } = await supabase
      .from('miembros_botiquin')
      .select('dueno_id')
      .eq('miembro_id', usuario.id)
      .eq('estado', 'aceptada')

    let listaBotiquines = [{ id: usuario.id, nombre: t(idioma, 'mi_botiquin'), esMio: true }]

    if (comoMiembro && comoMiembro.length > 0) {
      const ids = comoMiembro.map(m => m.dueno_id)
      const { data: perfiles } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .in('id', ids)

      if (perfiles) {
        perfiles.forEach(p => {
          listaBotiquines.push({ id: p.id, nombre: `${t(idioma, 'botiquin_de')} ${p.nombre}`, esMio: false })
        })
      }
    }

    setBotiquines(listaBotiquines)

    const { count } = await supabase
      .from('miembros_botiquin')
      .select('id', { count: 'exact', head: true })
      .eq('miembro_id', usuario.id)
      .eq('estado', 'pendiente')

    setInvitacionesPendientes(count || 0)
  }

  const cargarMedicamentos = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('medicamentos')
      .select('*')
      .eq('usuario_id', botiquinActivo)
      .order('fecha_caducidad', { ascending: true })

    if (error) {
      console.error(error)
      mostrarToast(t(idioma, 'error_generico'))
    } else {
      const medsCargados = data.map(m => ({
        id: m.id,
        nombre: m.nombre,
        categoria: m.categoria,
        cantidad: m.cantidad || '',
        caducidad: fechaCaducidadCorta(m.fecha_caducidad),
        extra: m.extra || '',
      }))
      setMeds(medsCargados)
      if (botiquinActivo === usuario.id) {
        comprobarYNotificar(medsCargados)
      }
    }
    setCargando(false)
  }

  const comprobarYNotificar = async (medsActuales) => {
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', usuario.id).single()
    if (!perfil || !perfil.notificaciones_email) return

    const alertasActuales = medsActuales.filter(m => getEstado(m.caducidad) !== 'ok')
    if (alertasActuales.length === 0) return

    const ultima = perfil.ultima_notificacion ? new Date(perfil.ultima_notificacion) : null
    const hoy = new Date()
    if (ultima && (hoy - ultima) < 86400000) return

    try {
      await fetch('/api/enviar-aviso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: perfil.email,
          nombre: perfil.nombre,
          medicamentos: alertasActuales.map(m => ({
            nombre: m.nombre,
            estado: getEstado(m.caducidad),
            dias: getDiasTexto(m.caducidad, idioma),
          })),
        }),
      })
      await supabase.from('usuarios').update({ ultima_notificacion: hoy.toISOString() }).eq('id', usuario.id)
    } catch (e) {
      console.error('Error notificación:', e)
    }
  }

  const total = meds.length
  const pronto = meds.filter(m => getEstado(m.caducidad) === 'pronto').length
  const caducados = meds.filter(m => ['urgente','caducado'].includes(getEstado(m.caducidad))).length
  const alertas = meds.filter(m => getEstado(m.caducidad) !== 'ok')

  const mostrarToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const eliminar = async (id) => {
    if (!esBotiquinPropio) { mostrarToast(t(idioma, 'solo_dueno_eliminar')); return }
    const { error } = await supabase.from('medicamentos').delete().eq('id', id)
    if (error) { mostrarToast(t(idioma, 'error_generico')); return }
    setMeds(meds.filter(m => m.id !== id))
    mostrarToast(t(idioma, 'medicamento_eliminado'))
  }

  const añadir = async () => {
    if (!esBotiquinPropio) { mostrarToast(t(idioma, 'solo_dueno_anadir')); return }
    if (!nombre || !caducidad || caducidad.includes('undefined')) { mostrarToast(t(idioma, 'rellena_nombre_fecha')); return }
    const { data, error } = await supabase
      .from('medicamentos')
      .insert({
        usuario_id: usuario.id,
        nombre,
        categoria,
        cantidad,
        fecha_caducidad: fechaCaducidadCompleta(caducidad),
        extra,
      })
      .select()
      .single()

    if (error) { mostrarToast(error.message); return }

    setMeds([...meds, {
      id: data.id,
      nombre: data.nombre,
      categoria: data.categoria,
      cantidad: data.cantidad || '',
      caducidad: fechaCaducidadCorta(data.fecha_caducidad),
      extra: data.extra || '',
    }])
    const nombreGuardado = nombre
    setNombre(''); setCaducidad(''); setCantidad(''); setExtra('')
    mostrarToast(t(idioma, 'medicamento_anadido', { nombre: nombreGuardado }))
    setTab('lista')
  }

  const handleCodigoLeido = async (codigo, formato) => {
    setEscanerActivo(false)
    setBuscandoCima(true)
    setErrorScan('')

    const resultado = await buscarMedicamentoPorCodigo(codigo, formato)
    setBuscandoCima(false)

    if (!resultado.ok) {
      setErrorScan(resultado.error + ` (código: ${codigo})`)
      return
    }

    setMedEscaneado(resultado.medicamento)
    if (resultado.medicamento.caducidad) {
      setScanCaducidad(resultado.medicamento.caducidad)
    }
  }

  const añadirEscaneado = async () => {
    if (!esBotiquinPropio) { mostrarToast(t(idioma, 'solo_dueno_anadir')); return }
    if (!scanCaducidad || scanCaducidad.includes('undefined')) { mostrarToast(t(idioma, 'rellena_nombre_fecha')); return }
    const { data, error } = await supabase
      .from('medicamentos')
      .insert({
        usuario_id: usuario.id,
        nombre: medEscaneado.nombre,
        categoria: medEscaneado.categoria,
        cantidad: scanCantidad,
        fecha_caducidad: fechaCaducidadCompleta(scanCaducidad),
        extra: '',
      })
      .select()
      .single()

    if (error) { mostrarToast(error.message); return }

    setMeds([...meds, {
      id: data.id,
      nombre: data.nombre,
      categoria: data.categoria,
      cantidad: data.cantidad || '',
      caducidad: fechaCaducidadCorta(data.fecha_caducidad),
      extra: '',
    }])
    const nombreGuardado = data.nombre
    setMedEscaneado(null); setScanCaducidad(''); setScanCantidad('')
    mostrarToast(t(idioma, 'medicamento_anadido', { nombre: nombreGuardado }))
    setTab('lista')
  }

  const resetEscaneo = () => {
    setMedEscaneado(null)
    setScanCaducidad('')
    setScanCantidad('')
    setErrorScan('')
  }

  const exportarPDF = async () => {
    if (!isPremium) {
      mostrarToast(t(idioma, 'pdf_premium_aviso'))
      return
    }
    setExportandoPDF(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const autoTableMod = await import('jspdf-autotable')
      const doc = new jsPDF()
      doc.setFontSize(20)
      doc.setTextColor(29, 158, 117)
      doc.text('MediCaduca', 14, 20)
      doc.setFontSize(12)
      doc.setTextColor(100)
      const botiquinNombre = botiquines.find(b => b.id === botiquinActivo)?.nombre || 'Botiquín'
      doc.text(botiquinNombre, 14, 28)
      doc.setFontSize(10)
      doc.text(`${new Date().toLocaleDateString()}`, 14, 34)

      const filas = meds.map(m => [
        m.nombre,
        m.categoria,
        m.cantidad || '-',
        m.caducidad,
        getEtiqueta(getEstado(m.caducidad), idioma),
      ])

      const autoTable = autoTableMod.default || autoTableMod
      autoTable(doc, {
        head: [['Medicamento', 'Categoría', 'Cantidad', 'Caducidad', 'Estado']],
        body: filas,
        startY: 42,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [29, 158, 117] },
      })

      doc.save(`medicaduca-${new Date().toISOString().split('T')[0]}.pdf`)
      mostrarToast(t(idioma, 'pdf_descargado'))
    } catch (err) {
      mostrarToast(err.message)
    }
    setExportandoPDF(false)
  }

  const activarPremium = async () => {
    setActivandoPremium(true)
    try {
      const respuesta = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: usuario.id,
          email: usuarioActual.email,
        }),
      })
      const data = await respuesta.json()
      if (data.ok && data.url) {
        window.location.href = data.url
      } else {
        mostrarToast(data.error || t(idioma, 'error_generico'))
        setActivandoPremium(false)
      }
    } catch (err) {
      mostrarToast(err.message)
      setActivandoPremium(false)
    }
  }

  if (vista === 'perfil') {
    return (
      <Perfil
        usuario={usuarioActual}
        idioma={idioma}
        onCambiarIdioma={onCambiarIdioma}
        onActualizar={(u) => { setUsuarioActual(u); mostrarToast(t(idioma, 'perfil_actualizado')) }}
        onVolver={() => setVista('app')}
      />
    )
  }

  if (vista === 'compartir') {
    return (
      <Compartir
        usuario={usuarioActual}
        idioma={idioma}
        isPremium={isPremium}
        onVolver={() => { setVista('app'); cargarBotiquines() }}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">

      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-xl">Medi<span className="text-green-600">Caduca</span></div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-medium">{display}</div>
            <div className="text-xs text-gray-400 capitalize">
              {t(idioma, 'rol_' + usuarioActual?.rol)}
              {isPremium && <span className="ml-1 text-amber-600">· Premium</span>}
            </div>
          </div>
          <button onClick={() => setVista('perfil')} className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            usuarioActual?.rol === 'hogar' ? 'bg-green-100 text-green-700' :
            usuarioActual?.rol === 'hospital' ? 'bg-blue-100 text-blue-700' :
            usuarioActual?.rol === 'farmacia' ? 'bg-amber-100 text-amber-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {initials}
            {invitacionesPendientes > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {invitacionesPendientes}
              </span>
            )}
          </button>
          <button onClick={onCerrarSesion} className="text-gray-400 text-xs hover:text-gray-600">{t(idioma, 'salir')}</button>
        </div>
      </div>

      {toast && (
        <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg mb-4 flex items-center gap-2">
          ✓ {toast}
        </div>
      )}

      {(botiquines.length > 1 || invitacionesPendientes > 0) && (
        <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center gap-2">
          <select
            value={botiquinActivo}
            onChange={e => setBotiquinActivo(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {botiquines.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
          <button onClick={() => setVista('compartir')} className="text-xs bg-white border border-gray-200 px-3 py-2 rounded-lg whitespace-nowrap">
            {t(idioma, 'compartir')}
            {invitacionesPendientes > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">{invitacionesPendientes}</span>
            )}
          </button>
        </div>
      )}

      {botiquines.length === 1 && invitacionesPendientes === 0 && (
        <div className="mb-4 text-right">
          <button onClick={() => setVista('compartir')} className="text-xs text-green-700 hover:underline">
            {t(idioma, 'compartir_mi_botiquin')}
          </button>
        </div>
      )}

      {!isPremium && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Ad</span>
            <span className="text-xs text-gray-500">Adeslas</span>
          </div>
          <button onClick={activarPremium} disabled={activandoPremium} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium whitespace-nowrap disabled:opacity-50">
            {activandoPremium ? '...' : t(idioma, 'sin_anuncios')}
          </button>
        </div>
      )}

      {!esBotiquinPropio && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg px-3 py-2 mb-4">
          {t(idioma, 'modo_lectura')}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-400">{t(idioma, 'total')}</div><div className="text-xl font-medium text-green-600">{total}</div></div>
        <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-400">{t(idioma, 'pronto')}</div><div className="text-xl font-medium text-amber-500">{pronto}</div></div>
        <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-400">{t(idioma, 'caducados')}</div><div className="text-xl font-medium text-red-500">{caducados}</div></div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {[
          { id:'lista', label: t(idioma, 'tab_medicamentos') },
          ...(esBotiquinPropio ? [{ id:'añadir', label: t(idioma, 'tab_anadir') }] : []),
          { id:'alertas', label: t(idioma, 'tab_alertas') },
        ].map(tabItem => (
          <button key={tabItem.id} onClick={() => setTab(tabItem.id)} className={`flex-1 text-xs py-2 rounded-lg transition-all ${tab === tabItem.id ? 'bg-white font-medium shadow-sm' : 'text-gray-500'}`}>
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'lista' && (
        <div>
          {!cargando && meds.length > 0 && esBotiquinPropio && (
            <div className="flex justify-end mb-3">
              <button onClick={exportarPDF} disabled={exportandoPDF} className={`text-xs px-3 py-1.5 rounded-lg border ${isPremium ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' : 'border-gray-200 text-gray-400'}`}>
                {exportandoPDF ? t(idioma, 'exportar_generando') : isPremium ? t(idioma, 'exportar_pdf') : t(idioma, 'exportar_pdf_premium')}
              </button>
            </div>
          )}
          <div className="space-y-2">
            {cargando && <div className="text-center py-10 text-gray-400 text-sm">{t(idioma, 'cargando')}</div>}
            {!cargando && meds.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">{t(idioma, 'sin_medicamentos')}</div>}
            {!cargando && meds.map(m => {
              const estado = getEstado(m.caducidad)
              const c = COLORES[estado]
              return (
                <div key={m.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-gray-200">
                  <div className={`w-9 h-9 rounded-lg ${c.fondo} flex items-center justify-center text-lg flex-shrink-0`}>
                    {ICONOS[m.categoria] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.nombre}</div>
                    <div className="text-xs text-gray-400">{m.categoria}{m.cantidad ? ` · ${m.cantidad}` : ''}{m.extra ? ` · ${m.extra}` : ''} · {getDiasTexto(m.caducidad, idioma)}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge} flex-shrink-0`}>{getEtiqueta(estado, idioma)}</span>
                  {esBotiquinPropio && (
                    <button onClick={() => eliminar(m.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0 text-sm">✕</button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'añadir' && esBotiquinPropio && (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-sm font-medium mb-4">{t(idioma, 'nuevo_medicamento')}</div>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-4">
            <button onClick={() => { setModo('manual'); resetEscaneo(); setEscanerActivo(false) }} className={`flex-1 text-xs py-2 flex items-center justify-center gap-1.5 ${modo === 'manual' ? 'bg-gray-900 text-white font-medium' : 'bg-white text-gray-500'}`}>
              {t(idioma, 'modo_escribir')}
            </button>
            <button onClick={() => { setModo('scan'); resetEscaneo() }} className={`flex-1 text-xs py-2 flex items-center justify-center gap-1.5 ${modo === 'scan' ? 'bg-gray-900 text-white font-medium' : 'bg-white text-gray-500'}`}>
              {t(idioma, 'modo_escanear')}
            </button>
          </div>

          {modo === 'manual' && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'nombre')}</label>
                  <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ibuprofeno 400mg" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'categoria')}</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
                    {CATEGORIAS.map(c => (
                      <option key={c.val} value={c.val}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'fecha_caducidad')} <span className="text-gray-400">{t(idioma, 'fecha_caducidad_ayuda')}</span></label>
                <SelectorFecha value={caducidad} onChange={setCaducidad} idioma={idioma} />
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'cantidad')}</label>
                <input value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="12" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400" />
              </div>
              {extraLabel && (
                <div className="mb-3">
                  <label className="text-xs text-gray-500 mb-1 block">{extraLabel}</label>
                  <input value={extra} onChange={e => setExtra(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400" />
                </div>
              )}
              <button onClick={añadir} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
                {t(idioma, 'boton_anadir_medicamento')}
              </button>
            </div>
          )}

          {modo === 'scan' && (
            <div>
              {!escanerActivo && !medEscaneado && !buscandoCima && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3">📷</div>
                  <div className="text-sm font-medium mb-2">{t(idioma, 'escanea_codigo')}</div>
                  <div className="text-xs text-gray-500 mb-4">{t(idioma, 'escanea_ayuda')}</div>
                  {errorScan && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">
                      ⚠️ {errorScan}
                    </div>
                  )}
                  <button onClick={() => setEscanerActivo(true)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    {t(idioma, 'activar_camara')}
                  </button>
                </div>
              )}

              {escanerActivo && (
                <Escaner
                  onCodigoLeido={handleCodigoLeido}
                  onCancelar={() => setEscanerActivo(false)}
                />
              )}

              {buscandoCima && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="text-sm font-medium">{t(idioma, 'buscando_cima')}</div>
                </div>
              )}

              {medEscaneado && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-sm font-medium mb-1 flex items-center gap-2">{t(idioma, 'medicamento_detectado')}</div>
                  <div className="text-base font-medium mb-1">{medEscaneado.nombre}</div>
                  {medEscaneado.laboratorio && <div className="text-xs text-gray-400 mb-2">{medEscaneado.laboratorio}</div>}
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'fecha_caducidad')} <span className="text-gray-400">{t(idioma, 'mira_caducidad_caja')}</span></label>
                    <SelectorFecha value={scanCaducidad} onChange={setScanCaducidad} idioma={idioma} />
                  </div>
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">{t(idioma, 'cantidad')}</label>
                    <input value={scanCantidad} onChange={e => setScanCantidad(e.target.value)} placeholder="12" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={añadirEscaneado} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">{t(idioma, 'guardar_medicamento')}</button>
                    <button onClick={resetEscaneo} className="border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm">✕ {t(idioma, 'cancelar')}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'alertas' && (
        <div className="space-y-2">
          {alertas.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">{t(idioma, 'sin_alertas')}</div>}
          {alertas.map(m => {
            const estado = getEstado(m.caducidad)
            const c = COLORES[estado]
            return (
              <div key={m.id} className={`border-l-4 ${estado === 'pronto' ? 'border-amber-400' : 'border-red-400'} bg-white rounded-r-xl px-4 py-3 flex items-center gap-3`}>
                <div className={`w-9 h-9 rounded-lg ${c.fondo} flex items-center justify-center text-lg flex-shrink-0`}>
                  {ICONOS[m.categoria] || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.nombre}</div>
                  <div className="text-xs text-gray-400">{getDiasTexto(m.caducidad, idioma)}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{getEtiqueta(estado, idioma)}</span>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}