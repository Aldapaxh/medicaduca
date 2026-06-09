'use client'

import { useState } from 'react'
import { t, IDIOMAS } from '../lib/traducciones'

export default function Tutorial({ idioma, onCambiarIdioma, onTerminar }) {
  const [paso, setPaso] = useState(0)

  const pasos = [
    { titulo: t(idioma, 'tutorial_paso1_titulo'), texto: t(idioma, 'tutorial_paso1_texto'), emoji: '👋' },
    { titulo: t(idioma, 'tutorial_paso2_titulo'), texto: t(idioma, 'tutorial_paso2_texto'), emoji: '💊' },
    { titulo: t(idioma, 'tutorial_paso3_titulo'), texto: t(idioma, 'tutorial_paso3_texto'), emoji: '🔔' },
    { titulo: t(idioma, 'tutorial_paso4_titulo'), texto: t(idioma, 'tutorial_paso4_texto'), emoji: '👨‍👩‍👧' },
  ]

  const actual = pasos[paso]
  const esUltimo = paso === pasos.length - 1

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 max-w-md mx-auto">

      {/* Selector idioma arriba */}
      <div className="flex justify-end mb-4">
        <select
          value={idioma}
          onChange={e => onCambiarIdioma(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
        >
          {IDIOMAS.map(i => (
            <option key={i.codigo} value={i.codigo}>{i.nombre}</option>
          ))}
        </select>
      </div>

      {/* Barra de progreso */}
      <div className="flex gap-1 mb-8">
        {pasos.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full ${i <= paso ? 'bg-green-500' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-7xl mb-6">{actual.emoji}</div>
        <h1 className="text-3xl font-bold mb-4">{actual.titulo}</h1>
        <p className="text-gray-600 text-lg leading-relaxed">{actual.texto}</p>
      </div>

      {/* Botones */}
      <div className="flex flex-col gap-2 mt-8">
        <button
          onClick={() => esUltimo ? onTerminar() : setPaso(paso + 1)}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800"
        >
          {esUltimo ? t(idioma, 'tutorial_empezar') : t(idioma, 'siguiente')}
        </button>
        {!esUltimo && (
          <button
            onClick={onTerminar}
            className="text-gray-400 text-sm hover:text-gray-600"
          >
            {t(idioma, 'tutorial_empezar')}
          </button>
        )}
      </div>

    </div>
  )
}