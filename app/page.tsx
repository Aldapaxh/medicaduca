'use client'

import { useState } from 'react'
import Tutorial from './tutorial'
import Rol from './rol'
import Registro from './registro'
import Login from './login'
import AppPrincipal from './appPrincipal'

export default function Home() {
  const [pantalla, setPantalla] = useState('landing')
  const [rol, setRol] = useState('')
  const [usuario, setUsuario] = useState(null)

  return (
    <main className="min-h-screen bg-white max-w-2xl mx-auto px-4">

      {/* ═══════════ LANDING ═══════════ */}
      {pantalla === 'landing' && (
        <div>
          <div className="flex items-center justify-between py-6">
            <h1 className="font-bold text-2xl">Medi<span className="text-green-600">Caduca</span></h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setPantalla('login')} className="text-gray-500 text-sm font-medium hover:text-gray-700 px-3 py-2">
                Iniciar sesión
              </button>
              <button onClick={() => setPantalla('tutorial')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                🚀 Empezar gratis
              </button>
            </div>
          </div>
          <div className="text-center py-10">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-medium px-4 py-2 rounded-full mb-4">
              ✅ 100% gratuito · Sin registro obligatorio
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              ¿Tienes medicamentos caducados<br />
              <span className="text-green-600 italic">en casa sin saberlo?</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-md mx-auto mb-8">
              MediCaduca te avisa antes de que caduquen tus medicamentos. Fácil, rápido y gratis. Para toda la familia.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => setPantalla('tutorial')} className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700">
                🚀 Empezar gratis ahora
              </button>
              <button onClick={() => setPantalla('login')} className="border border-gray-200 text-gray-500 px-6 py-3 rounded-xl hover:bg-gray-50">
                Ya tengo cuenta
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">Sin tarjeta de crédito · Sin letra pequeña · Para siempre gratis</p>
          </div>
          <div className="flex justify-center mb-10">
            <div className="w-52 bg-white border-2 border-gray-200 rounded-3xl p-3 shadow-sm">
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-3"></div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-xs">Medi<span className="text-green-600">Caduca</span></span>
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-medium">AG</div>
              </div>
              <div className="grid grid-cols-3 gap-1 mb-2">
                <div className="bg-gray-50 rounded p-1"><div className="text-xs text-gray-400">Total</div><div className="text-sm font-medium text-green-600">8</div></div>
                <div className="bg-gray-50 rounded p-1"><div className="text-xs text-gray-400">Pronto</div><div className="text-sm font-medium text-amber-600">2</div></div>
                <div className="bg-gray-50 rounded p-1"><div className="text-xs text-gray-400">Caduc.</div><div className="text-sm font-medium text-red-500">1</div></div>
              </div>
              {[
                {ico:'💊',name:'Ibuprofeno 600mg',meta:'Caduca en 12 días',color:'bg-red-50',badge:'Urgente',badgeColor:'bg-red-100 text-red-700'},
                {ico:'🌿',name:'Loratadina 10mg',meta:'Caduca en 75 días',color:'bg-amber-50',badge:'Pronto',badgeColor:'bg-amber-100 text-amber-700'},
                {ico:'🧡',name:'Vitamina D3',meta:'En vigor · 2027',color:'bg-green-50',badge:'Bien',badgeColor:'bg-green-100 text-green-700'},
              ].map((item,i) => (
                <div key={i} className={`flex items-center gap-1.5 ${item.color} rounded-lg p-1.5 mb-1`}>
                  <span className="text-sm">{item.ico}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.meta}</div>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${item.badgeColor}`}>{item.badge}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="py-6 border-t border-gray-100">
            <div className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">Cómo funciona</div>
            <h3 className="text-2xl font-bold mb-1">Tres pasos y listo</h3>
            <p className="text-gray-500 text-sm mb-6">No hace falta ser experto en tecnología.</p>
            {[
              {n:'1',t:'Añade tus medicamentos',d:'Escanea el código de barras de la caja o escribe el nombre a mano. Tú pones la fecha mirando la caja.'},
              {n:'2',t:'MediCaduca los vigila por ti',d:'La app colorea cada medicamento: verde si está bien, naranja si caduca pronto, rojo si ya caducó.'},
              {n:'3',t:'Actúa antes de que sea tarde',d:'Consulta la pestaña de Alertas para ver qué medicamentos necesitan atención.'},
            ].map((s,i) => (
              <div key={i} className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-medium flex items-center justify-center flex-shrink-0">{s.n}</div>
                <div><div className="font-medium mb-0.5">{s.t}</div><div className="text-sm text-gray-500">{s.d}</div></div>
              </div>
            ))}
          </div>
          <div className="py-6 border-t border-gray-100">
            <div className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">Para quién es</div>
            <h3 className="text-2xl font-bold mb-4">Para todo el mundo, <span className="italic text-green-600">de verdad</span></h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {ico:'🏠',t:'Familias',d:'Controla el botiquín de toda la familia en un solo sitio.'},
                {ico:'👴',t:'Personas mayores',d:'Tan sencilla que la usa sola tu madre de 80 años.'},
                {ico:'🏥',t:'Hospitales y farmacias',d:'Control de stock, lotes y caducidades profesional.'},
                {ico:'❤️',t:'Cuidadores',d:'Gestiona los medicamentos de quien cuidas sin estrés.'},
              ].map((c,i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl mb-2">{c.ico}</div>
                  <div className="font-medium text-sm mb-1">{c.t}</div>
                  <div className="text-xs text-gray-500">{c.d}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="py-6 border-t border-gray-100">
            <div className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">Precio</div>
            <h3 className="text-2xl font-bold mb-1">Gratis para siempre.<br />Premium si quieres más.</h3>
            <p className="text-gray-500 text-sm mb-4">La versión gratuita tiene todo lo que necesitas.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full">Gratis</span>
                <div className="text-2xl font-bold mt-2">0 €</div>
                <div className="text-xs text-gray-400 mb-3">para siempre</div>
                {['Medicamentos ilimitados','Alertas de caducidad','Los 4 perfiles'].map((f,i) => <div key={i} className="text-xs flex items-center gap-1.5 mb-1"><span className="text-green-500">✓</span>{f}</div>)}
                <div className="text-xs flex items-center gap-1.5 text-gray-400 mt-1"><span>−</span>Con anuncios</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full">Premium</span>
                <div className="text-2xl font-bold mt-2 text-amber-800">1,99 €</div>
                <div className="text-xs text-amber-600 mb-3">al mes</div>
                {['Todo lo de Gratis','Sin anuncios','Exportar PDF','Soporte prioritario'].map((f,i) => <div key={i} className="text-xs flex items-center gap-1.5 mb-1 text-amber-800"><span className="text-amber-600">✓</span>{f}</div>)}
              </div>
            </div>
          </div>
          <div className="py-6 border-t border-gray-100">
            <div className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">Lo que dicen</div>
            <h3 className="text-2xl font-bold mb-4">Ya lo usan miles de familias</h3>
            {[
              {t:'Llevaba años con el botiquín sin revisar. En cinco minutos lo tenía todo controlado.',n:'María P.',r:'Badajoz · Hogar',av:'MP',bg:'bg-green-100 text-green-700'},
              {t:'Se la recomendé a mi madre de 74 años y la usa ella sola.',n:'Juan R.',r:'Madrid · Cuidador',av:'JR',bg:'bg-blue-100 text-blue-700'},
              {t:'En nuestra farmacia la usamos para el control de stock. Nos ha evitado más de un susto.',n:'Laura C.',r:'Sevilla · Farmacéutica',av:'LC',bg:'bg-amber-100 text-amber-700'},
            ].map((t,i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 mb-3">
                <div className="text-amber-400 text-xs mb-2">★★★★★</div>
                <p className="text-sm mb-3">{t.t}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${t.bg}`}>{t.av}</div>
                  <div><div className="text-xs font-medium">{t.n}</div><div className="text-xs text-gray-400">{t.r}</div></div>
                </div>
              </div>
            ))}
          </div>
          <div className="py-6 border-t border-gray-100">
            <div className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">Preguntas frecuentes</div>
            <h3 className="text-2xl font-bold mb-4">¿Tienes dudas?</h3>
            {[
              {q:'¿Hay que registrarse?',a:'No es obligatorio. Puedes empezar a usarla de inmediato sin crear ninguna cuenta.'},
              {q:'¿Funciona sin internet?',a:'Sí. Una vez instalada puedes consultar tus medicamentos sin conexión.'},
              {q:'¿Es segura? ¿Quién ve mis datos?',a:'Tus datos son tuyos. No los vendemos ni compartimos. Cumplimos con el RGPD.'},
              {q:'¿Puedo cancelar el Premium cuando quiera?',a:'Sí, en cualquier momento. Sin permanencia ni penalizaciones.'},
            ].map((f,i) => (
              <div key={i} className="py-3 border-b border-gray-100 last:border-0">
                <div className="font-medium text-sm mb-1 flex items-center gap-2"><span className="text-green-500">✓</span>{f.q}</div>
                <div className="text-sm text-gray-500 pl-5">{f.a}</div>
              </div>
            ))}
          </div>
          <div className="bg-green-50 rounded-2xl p-8 text-center my-8">
            <h3 className="text-2xl font-bold mb-2">Tu botiquín seguro,<br /><span className="italic text-green-600">empieza hoy</span></h3>
            <p className="text-gray-500 text-sm mb-4">Gratis, sin registro, sin complicaciones.</p>
            <button onClick={() => setPantalla('tutorial')} className="bg-green-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-green-700">
              🚀 Empezar gratis ahora
            </button>
          </div>
          <div className="text-center text-xs text-gray-400 py-6 border-t border-gray-100 flex gap-4 justify-center flex-wrap">
            <span>© 2026 MediCaduca</span>
            <span>Privacidad</span>
            <span>Términos</span>
            <span>Contacto</span>
          </div>
        </div>
      )}

      {/* ═══════════ TUTORIAL ═══════════ */}
      {pantalla === 'tutorial' && (
        <Tutorial
          onFinalizar={() => setPantalla('rol')}
          onSaltar={() => setPantalla('rol')}
        />
      )}

      {/* ═══════════ ROL ═══════════ */}
      {pantalla === 'rol' && (
        <Rol onSeleccionar={(r) => { setRol(r); setPantalla('registro') }} />
      )}

      {/* ═══════════ REGISTRO ═══════════ */}
      {pantalla === 'registro' && (
        <Registro
          rol={rol}
          onRegistrado={(u) => { setUsuario(u); setPantalla('app') }}
          onVolver={() => setPantalla('rol')}
        />
      )}

      {/* ═══════════ LOGIN ═══════════ */}
      {pantalla === 'login' && (
        <Login
          onLogin={(u) => { setUsuario(u); setPantalla('app') }}
          onIrARegistro={() => setPantalla('tutorial')}
        />
      )}

      {/* ═══════════ APP PRINCIPAL ═══════════ */}
      {pantalla === 'app' && (
        <AppPrincipal
          usuario={usuario}
          onCerrarSesion={() => { setUsuario(null); setPantalla('landing') }}
        />
      )}

    </main>
  )
}