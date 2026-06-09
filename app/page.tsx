'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TRADUCCIONES } from '../lib/traducciones'

import Tutorial from './tutorial'
import Rol from './rol'
import Registro from './registro'
import Login from './login'
import AppPrincipal from './appPrincipal'

export default function Page() {
  const [pantalla, setPantalla] = useState<string>('cargando')
  const [usuario, setUsuario] = useState<any>(null)
  const [rolElegido, setRolElegido] = useState<string>('')
  const [idioma, setIdioma] = useState<string>('es')

  useEffect(() => {
    const idiomaGuardado = typeof window !== 'undefined' ? localStorage.getItem('idioma_medicaduca') : null
    if (idiomaGuardado && ['es','eu','ca'].includes(idiomaGuardado)) {
      setIdioma(idiomaGuardado)
    }
    comprobarSesion()
  }, [])

  const comprobarSesion = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data: perfil } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (perfil) {
        // Si el perfil tiene idioma guardado, lo usamos.
        // Si no, mantenemos el que eligió en el login (localStorage)
        const idiomaLocal = typeof window !== 'undefined' ? localStorage.getItem('idioma_medicaduca') : null
        const idiomaAUsar = perfil.idioma || idiomaLocal || 'es'
        setUsuario({ ...perfil, idioma: idiomaAUsar })
        setIdioma(idiomaAUsar)
        if (typeof window !== 'undefined') localStorage.setItem('idioma_medicaduca', idiomaAUsar)
        // Si el perfil no tenía idioma, lo guardamos en Supabase
        if (!perfil.idioma && idiomaLocal) {
          await supabase.from('usuarios').update({ idioma: idiomaLocal }).eq('id', perfil.id)
        }
        setPantalla('app')
        return
      }
    }
    const tutorialVisto = typeof window !== 'undefined' ? localStorage.getItem('tutorial_medicaduca') : null
    setPantalla(tutorialVisto === 'visto' ? 'login' : 'tutorial')
  }

  const cambiarIdioma = (nuevo: string) => {
    setIdioma(nuevo)
    if (typeof window !== 'undefined') localStorage.setItem('idioma_medicaduca', nuevo)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    setUsuario(null)
    setPantalla('login')
  }

  if (pantalla === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">{(TRADUCCIONES as any)[idioma]?.cargando || 'Cargando...'}</div>
      </div>
    )
  }

  if (pantalla === 'tutorial') {
    return (
      <Tutorial
        idioma={idioma}
        onCambiarIdioma={cambiarIdioma}
        onTerminar={() => {
          if (typeof window !== 'undefined') localStorage.setItem('tutorial_medicaduca', 'visto')
          setPantalla('rol')
        }}
      />
    )
  }

  if (pantalla === 'rol') {
    return (
      <Rol
        idioma={idioma}
        onElegir={(r: string) => {
          setRolElegido(r)
          setPantalla('registro')
        }}
      />
    )
  }

  if (pantalla === 'registro') {
    return (
      <Registro
        idioma={idioma}
        rol={rolElegido}
        onRegistrado={(u: any) => {
          setUsuario(u)
          setPantalla('app')
        }}
        onIrLogin={() => setPantalla('login')}
      />
    )
  }

  if (pantalla === 'login') {
    return (
      <Login
        idioma={idioma}
        onCambiarIdioma={cambiarIdioma}
        onLogin={(u: any) => {
          // Si el usuario que hace login no tiene idioma guardado, le ponemos el actual
          const idiomaAUsar = u.idioma || idioma
          setUsuario({ ...u, idioma: idiomaAUsar })
          cambiarIdioma(idiomaAUsar)
          // Guardamos el idioma en su perfil si no lo tenía
          if (!u.idioma && idioma) {
            supabase.from('usuarios').update({ idioma }).eq('id', u.id)
          }
          setPantalla('app')
        }}
        onIrRegistro={() => setPantalla('tutorial')}
      />
    )
  }

  if (pantalla === 'app' && usuario) {
    return (
      <AppPrincipal
        usuario={usuario}
        idioma={idioma}
        onCambiarIdioma={cambiarIdioma}
        onCerrarSesion={cerrarSesion}
      />
    )
  }

  return null
}