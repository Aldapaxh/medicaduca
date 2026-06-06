'use client'

import { useRef, useState } from 'react'

export default function Escaner({ onCodigoLeido, onCancelar }) {
  const inputRef = useRef(null)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')

  const handleFoto = async (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    setProcesando(true)
    setError('')

    try {
      const url = URL.createObjectURL(archivo)
      const img = new Image()
      img.src = url
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const { DecodeHintType, BarcodeFormat } = await import('@zxing/library')

      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
      ])
      hints.set(DecodeHintType.TRY_HARDER, true)

      const lector = new BrowserMultiFormatReader(hints)

      try {
        const result = await lector.decodeFromImageElement(img)
        URL.revokeObjectURL(url)
        const texto = result.getText()
        onCodigoLeido(texto, 'EAN_13')
      } catch (decodeErr) {
        URL.revokeObjectURL(url)
        setError('No se ha podido leer el código. Prueba con mejor luz y enfoque.')
        setProcesando(false)
      }
    } catch (err) {
      setError('Error al procesar la imagen: ' + err.message)
      setProcesando(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-3 text-center">
      <div className="text-4xl mb-3">📷</div>
      <div className="text-sm font-medium mb-2">Haz una foto del código de barras</div>
      <div className="text-xs text-gray-500 mb-4">
        Las rayas verticales de la caja del medicamento.
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
          ⚠️ {error}
        </div>
      )}

      {procesando ? (
        <div className="text-sm text-gray-500 py-4">🔍 Procesando imagen...</div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFoto}
            className="hidden"
          />
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => inputRef.current?.click()}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              📸 Hacer foto
            </button>
            <button onClick={onCancelar} className="border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm">
              ✕ Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  )
}