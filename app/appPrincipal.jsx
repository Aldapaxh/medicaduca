'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { buscarMedicamentoPorCodigo } from '../lib/cima'
import Escaner from './escaner'
import Perfil from './perfil'

const ICONOS = { analgésico:'💊', antibiótico:'🔬', antihistamínico:'🌿', digestivo:'🫙', vitamina:'🧡', otro:'📦' }

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const AÑOS = Array.from({length:10}, (_,i) => 2024 + i)

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

function getEtiqueta(estado) {
  return { ok:'En vigor', pronto:'Caduca pronto', urgente:'Muy pronto', caducado:'Caducado' }[estado]
}

function getDiasTexto(caducidad) {
  if (!caducidad) return 'Sin fecha'
  const partes = caducidad.split('-')
  if (partes.length < 2) return 'Sin fecha'
  const y = parseInt(partes[0])
  const m = parseInt(partes[1])
  if (isNaN(y) || isNaN(m)) return 'Sin fecha'
  const hoy = new Date()
  const fecha = new Date(y, m, 0)
  const dias = Math.ceil((fecha - hoy) / 86400000)
  if (dias < 0) return `Caducado hace ${Math.abs(dias)} días`
  if (dias === 0) return 'Caduca hoy'
  return `Caduca en ${dias} días`
}

const COLORES = {
  ok:       { fondo:'bg-green-50',  badge:'bg-green-100 text-green-700' },
  pronto:   { fondo:'bg-amber-50',  badge:'bg-amber-100 text-amber-700' },
  urgente:  { fondo:'bg-red-50',    badge:'bg-red-100 text-red-700' },
  caducado: { fondo:'bg-red-50',    badge:'bg-red-100 text-red-700' },
}

const EXTRA_LABEL = { hospital:'Planta / Unidad', farmacia:'Referencia / Lote', medico:'Paciente / Expediente' }

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

function SelectorFecha({ value, onChange }) {
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
        <option value="">Mes</option>
        {MESES.map((mes, i) => (
          <option key={i} value={String(i+1).padStart(2,'0')}>{mes}</option>
        ))}
      </select>
      <select value={añoActual} onChange={e => handleAño(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400">
        <option value="">Año</option>
        {AÑOS.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  )
}

export default function AppPrincipal({ usuario, onCerrarSesion }) {
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

  const initials = (usuarioActual?.organizacion || usuarioActual?.nombre || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)
  const display = usuarioActual?.organizacion || usuarioActual?.nombre || 'Usuario'
  const extraLabel = EXTRA_LABEL[usuarioActual?.rol]

  useEffect(() => {
    cargarMedicamentos()
    cargarPerfilCompleto()
  }, [])

  const cargarPerfilCompleto = async () => {
    const { data } = await supabase.from('usuarios').select('*').eq('id', usuario.id).single()
    if (data) {
      setUsuarioActual({ ...usuario, ...data })
      setIsPremium(data.plan === 'premium')
    }
  }

  const cargarMedicamentos = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('medicamentos')
      .select('*')
      .eq('usuario_id', usuario.id)
      .order('fecha_caducidad', { ascending: true })

    if (error) {
      console.error(error)
      mostrarToast('Error al cargar medicamentos')
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
      // Comprobar si hay que enviar notificación
      comprobarYNotificar(medsCargados)
    }
    setCargando(false)
  }

  const comprobarYNotificar = async (medsActuales) => {
    // Recargar perfil para tener datos actualizados
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', usuario.id).single()
    if (!perfil || !perfil.notificaciones_email) return

    const alertasActuales = medsActuales.filter(m => getEstado(m.caducidad) !== 'ok')
    if (alertasActuales.length === 0) return

    // Solo notificar máximo una vez al día
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
            dias: getDiasTexto(m.caducidad),
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
    const { error } = await supabase.from('medicamentos').delete().eq('id', id)
    if (error) { mostrarToast('Error al eliminar'); return }
    setMeds(meds.filter(m => m.id !== id))
    mostrarToast('Medicamento eliminado')
  }

  const añadir = async () => {
    if (!nombre || !caducidad || caducidad.includes('undefined')) { mostrarToast('Escribe el nombre y selecciona la fecha'); return }
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

    if (error) { mostrarToast('Error al añadir: ' + error.message); return }

    setMeds([...meds, {
      id: data.id,
      nombre: data.nombre,
      categoria: data.categoria,
      cantidad: data.cantidad || '',
      caducidad: fechaCaducidadCorta(data.fecha_caducidad),
      extra: data.extra || '',
    }])
    setNombre(''); setCaducidad(''); setCantidad(''); setExtra('')
    mostrarToast(`${nombre} añadido`)
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
    if (!scanCaducidad || scanCaducidad.includes('undefined')) { mostrarToast('Selecciona la fecha de caducidad'); return }
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

    if (error) { mostrarToast('Error al añadir: ' + error.message); return }

    setMeds([...meds, {
      id: data.id,
      nombre: data.nombre,
      categoria: data.categoria,
      cantidad: data.cantidad || '',
      caducidad: fechaCaducidadCorta(data.fecha_caducidad),
      extra: '',
    }])
    setMedEscaneado(null); setScanCaducidad(''); setScanCantidad('')
    mostrarToast(`${data.nombre} añadido`)
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
      mostrarToast('Exportar PDF es una función Premium')
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
      doc.text(`Botiquín de ${display}`, 14, 28)
      doc.setFontSize(10)
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 34)

      const filas = meds.map(m => [
        m.nombre,
        m.categoria,
        m.cantidad || '-',
        m.caducidad,
        getEtiqueta(getEstado(m.caducidad)),
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
      mostrarToast('PDF descargado')
    } catch (err) {
      mostrarToast('Error al generar PDF: ' + err.message)
    }
    setExportandoPDF(false)
  }

  const activarPremiumDemo = async () => {
    await supabase.from('usuarios').update({ plan: 'premium' }).eq('id', usuario.id)
    setIsPremium(true)
    mostrarToast('¡Premium activado!')
  }

  // Vista de perfil
  if (vista === 'perfil') {
    return (
      <Perfil
        usuario={usuarioActual}
        onActualizar={(u) => { setUsuarioActual(u); mostrarToast('Perfil actualizado') }}
        onVolver={() => setVista('app')}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">

      {/* TOPBAR */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-xl">Medi<span className="text-green-600">Caduca</span></div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-medium">{display}</div>
            <div className="text-xs text-gray-400 capitalize">
              {usuarioActual?.rol}
              {isPremium && <span className="ml-1 text-amber-600">· Premium</span>}
            </div>
          </div>
          <button onClick={() => setVista('perfil')} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            usuarioActual?.rol === 'hogar' ? 'bg-green-100 text-green-700' :
            usuarioActual?.rol === 'hospital' ? 'bg-blue-100 text-blue-700' :
            usuarioActual?.rol === 'farmacia' ? 'bg-amber-100 text-amber-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {initials}
          </button>
          <button onClick={onCerrarSesion} className="text-gray-400 text-xs hover:text-gray-600">Salir</button>
        </div>
      </div>

      {toast && (
        <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg mb-4 flex items-center gap-2">
          ✓ {toast}
        </div>
      )}

      {!isPremium && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Anuncio</span>
            <span className="text-xs text-gray-500">Seguro de salud desde 19 €/mes — Adeslas</span>
          </div>
          <button onClick={activarPremiumDemo} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">👑 Sin anuncios</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-400">Total</div><div className="text-xl font-medium text-green-600">{total}</div></div>
        <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-400">Pronto</div><div className="text-xl font-medium text-amber-500">{pronto}</div></div>
        <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-400">Caducados</div><div className="text-xl font-medium text-red-500">{caducados}</div></div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {[
          { id:'lista', label:'💊 Medicamentos' },
          { id:'añadir', label:'➕ Añadir' },
          { id:'alertas', label:'🔔 Alertas' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 text-xs py-2 rounded-lg transition-all ${tab === t.id ? 'bg-white font-medium shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: LISTA */}
      {tab === 'lista' && (
        <div>
          {!cargando && meds.length > 0 && (
            <div className="flex justify-end mb-3">
              <button onClick={exportarPDF} disabled={exportandoPDF} className={`text-xs px-3 py-1.5 rounded-lg border ${isPremium ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' : 'border-gray-200 text-gray-400'}`}>
                {exportandoPDF ? '📄 Generando...' : isPremium ? '📄 Exportar PDF' : '📄 Exportar PDF (Premium)'}
              </button>
            </div>
          )}
          <div className="space-y-2">
            {cargando && <div className="text-center py-10 text-gray-400 text-sm">Cargando...</div>}
            {!cargando && meds.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">Sin medicamentos. ¡Añade el primero!</div>}
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
                    <div className="text-xs text-gray-400">{m.categoria}{m.cantidad ? ` · ${m.cantidad}` : ''}{m.extra ? ` · ${m.extra}` : ''} · {getDiasTexto(m.caducidad)}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge} flex-shrink-0`}>{getEtiqueta(estado)}</span>
                  <button onClick={() => eliminar(m.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0 text-sm">✕</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB: AÑADIR */}
      {tab === 'añadir' && (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-sm font-medium mb-4">💊 Nuevo medicamento</div>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-4">
            <button onClick={() => { setModo('manual'); resetEscaneo(); setEscanerActivo(false) }} className={`flex-1 text-xs py-2 flex items-center justify-center gap-1.5 ${modo === 'manual' ? 'bg-gray-900 text-white font-medium' : 'bg-white text-gray-500'}`}>
              ⌨️ Escribir
            </button>
            <button onClick={() => { setModo('scan'); resetEscaneo() }} className={`flex-1 text-xs py-2 flex items-center justify-center gap-1.5 ${modo === 'scan' ? 'bg-gray-900 text-white font-medium' : 'bg-white text-gray-500'}`}>
              📷 Escanear código
            </button>
          </div>

          {modo === 'manual' && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                  <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ibuprofeno 400mg" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
                    <option value="analgésico">Analgésico</option>
                    <option value="antibiótico">Antibiótico</option>
                    <option value="antihistamínico">Antihistamínico</option>
                    <option value="digestivo">Digestivo</option>
                    <option value="vitamina">Vitamina</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">Fecha de caducidad <span className="text-gray-400">(está en la caja)</span></label>
                <SelectorFecha value={caducidad} onChange={setCaducidad} />
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">Cantidad (opcional)</label>
                <input value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="12 comp." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400" />
              </div>
              {extraLabel && (
                <div className="mb-3">
                  <label className="text-xs text-gray-500 mb-1 block">{extraLabel}</label>
                  <input value={extra} onChange={e => setExtra(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400" />
                </div>
              )}
              <button onClick={añadir} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
                ➕ Añadir medicamento
              </button>
            </div>
          )}

          {modo === 'scan' && (
            <div>
              {!escanerActivo && !medEscaneado && !buscandoCima && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3">📷</div>
                  <div className="text-sm font-medium mb-2">Escanea el código de barras</div>
                  <div className="text-xs text-gray-500 mb-4">Pulsa abajo y haz una foto del código</div>
                  {errorScan && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">
                      ⚠️ {errorScan}
                    </div>
                  )}
                  <button onClick={() => setEscanerActivo(true)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    📷 Activar cámara
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
                  <div className="text-sm font-medium">Buscando en CIMA...</div>
                </div>
              )}

              {medEscaneado && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-sm font-medium mb-1 flex items-center gap-2">✅ Medicamento detectado</div>
                  <div className="text-base font-medium mb-1">{medEscaneado.nombre}</div>
                  {medEscaneado.laboratorio && <div className="text-xs text-gray-400 mb-2">{medEscaneado.laboratorio}</div>}
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">Fecha de caducidad <span className="text-gray-400">(mírala en la caja)</span></label>
                    <SelectorFecha value={scanCaducidad} onChange={setScanCaducidad} />
                  </div>
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">Cantidad (opcional)</label>
                    <input value={scanCantidad} onChange={e => setScanCantidad(e.target.value)} placeholder="12 comp." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={añadirEscaneado} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">✓ Guardar</button>
                    <button onClick={resetEscaneo} className="border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm">✕ Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: ALERTAS */}
      {tab === 'alertas' && (
        <div className="space-y-2">
          {alertas.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">✅ Sin alertas pendientes</div>}
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
                  <div className="text-xs text-gray-400">{getDiasTexto(m.caducidad)}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{getEtiqueta(estado)}</span>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}