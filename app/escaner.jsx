'use client'

import { useEffect, useRef, useState } from 'react'

export default function Escaner({ onCodigoLeido, onCancelar }) {
  const scannerRef = useRef(null)
  const [error, setError] = useState('')
  const [iniciando, setIniciando] = useState(true)

  useEffect(() => {
    let html5QrCode = null

    const iniciar = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        html5QrCode = new Html5Qrcode('qr-reader', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.DATA_MATRIX,
          ],
        })
        scannerRef.current = html5QrCode

        await html5QrCode.start(
          {
            facingMode: 'environment',
          },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
            videoConstraints: {
              facingMode: 'environment',
              focusMode: 'continuous',
              advanced: [
                { focusMode: 'continuous' },
                { focusDistance: 0.1 },
              ],
            },
          },
          (decodedText, decodedResult) => {
            const formato = decodedResult?.result?.format?.formatName || 'DATA_MATRIX'
            html5QrCode.stop().then(() => {
              onCodigoLeido(decodedText, formato)
            })
          },
          () => {}
        )

        // Intentar aplicar autoenfoque continuo y zoom moderado
        try {
          const track = html5QrCode.getRunningTrackSettings ? null : null
          const stream = document.querySelector('#qr-reader video')?.srcObject
          if (stream) {
            const videoTrack = stream.getVideoTracks()[0]
            const capabilities = videoTrack.getCapabilities()
            const constraints = { advanced: [] }
            if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
              constraints.advanced.push({ focusMode: 'continuous' })
            }
            if (capabilities.zoom) {
              const zoomDeseado = Math.min(capabilities.zoom.max, 2)
              constraints.advanced.push({ zoom: zoomDeseado })
            }
            if (constraints.advanced.length > 0) {
              await videoTrack.applyConstraints(constraints)
            }
          }
        } catch (e) {
          // Si no se puede aplicar, ignoramos
        }

        setIniciando(false)
      } catch (err) {
        setError('No se pudo acceder a la cámara. Comprueba los permisos.')
        setIniciando(false)
      }
    }

    iniciar()

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [onCodigoLeido])

  const cancelar = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop()
    }
    onCancelar()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 text-center">
      <div className="text-sm font-medium mb-2">📷 Apunta al DataMatrix</div>
      <div className="text-xs text-gray-500 mb-3">El cuadrado pequeño con puntos · Mantén el móvil firme y a unos 10 cm</div>
      <div id="qr-reader" className="rounded-lg overflow-hidden mb-3 bg-gray-50 min-h-[200px]"></div>
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