'use client'

import { useEffect, useRef, useState } from 'react'

export default function Escaner({ onCodigoLeido, onCancelar }) {
  const videoRef = useRef(null)
  const lectorRef = useRef(null)
  const [error, setError] = useState('')
  const [iniciando, setIniciando] = useState(true)

  useEffect(() => {
    let activo = true

    const iniciar = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const { DecodeHintType, BarcodeFormat } = await import('@zxing/library')

        const hints = new Map()
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.DATA_MATRIX,
          BarcodeFormat.EAN_13,
          BarcodeFormat.QR_CODE,
        ])
        hints.set(DecodeHintType.TRY_HARDER, true)

        const lector = new BrowserMultiFormatReader(hints)
        lectorRef.current = lector

        if (!activo) return

        await lector.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, err) => {
            if (result && activo) {
              const formato = result.getBarcodeFormat()
              const texto = result.getText()
              const formatoStr = formato === 5 ? 'DATA_MATRIX' : formato === 13 ? 'EAN_13' : 'OTRO'
              activo = false
              try { lector.reset() } catch (e) {}
              onCodigoLeido(texto, formatoStr)
            }
          }
        )

        // Aplicar autoenfoque y zoom si el dispositivo lo permite
        try {
          const stream = videoRef.current?.srcObject
          if (stream) {
            const track = stream.getVideoTracks()[0]
            const cap = track.getCapabilities ? track.getCapabilities() : {}
            const advanced = []
            if (cap.focusMode && cap.focusMode.includes('continuous')) {
              advanced.push({ focusMode: 'continuous' })
            }
            if (advanced.length > 0) {
              await track.applyConstraints({ advanced })
            }
          }
        } catch (e) {}

        setIniciando(false)
      } catch (err) {
        setError('No se pudo acceder a la cámara: ' + err.message)
        setIniciando(false)
      }
    }

    iniciar()

    return () => {
      activo = false
      try {
        if (lectorRef.current) {
          lectorRef.current.reset()
        }
      } catch (e) {}
      const stream = videoRef.current?.srcObject
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
    }
  }, [onCodigoLeido])

  const cancelar = () => {
    try {
      if (lectorRef.current) lectorRef.current.reset()
    } catch (e) {}
    const stream = videoRef.current?.srcObject
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
    }
    onCancelar()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 text-center">
      <div className="text-sm font-medium mb-2">📷 Apunta al código de la caja</div>
      <div className="text-xs text-gray-500 mb-3">DataMatrix (cuadrado de puntos) o código de barras</div>
      <video
        ref={videoRef}
        className="w-full rounded-lg bg-gray-100 mb-3"
        style={{ maxHeight: '300px', objectFit: 'cover' }}
        playsInline
        muted
      />
      {iniciando && <p className="text-xs text-gray-400 mb-3">Activando la cámara...</p>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
          ⚠️ {error}
        </div>
      )}
      <button onClick={cancelar} className="border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm">
        ✕ Cancelar
      </button>
    </div>
  )
}