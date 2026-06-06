'use client'

import { useRef, useState } from 'react'

export default function Escaner({ onCodigoLeido, onCancelar }) {
  const inputRef = useRef(null)
  const [procesando, setProcesando] = useState(false)
  const [progreso, setProgreso] = useState('')
  const [error, setError] = useState('')

  // Procesa una imagen aplicando escala de grises y aumento de contraste
  const preprocesarImagen = (imageData, factor = 1.5) => {
    const data = imageData.data
    const nueva = new ImageData(new Uint8ClampedArray(data), imageData.width, imageData.height)
    const nuevaData = nueva.data

    for (let i = 0; i < data.length; i += 4) {
      // Escala de grises
      const gris = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114
      // Aumentar contraste
      const ajustado = Math.max(0, Math.min(255, (gris - 128) * factor + 128))
      nuevaData[i] = ajustado
      nuevaData[i+1] = ajustado
      nuevaData[i+2] = ajustado
      nuevaData[i+3] = data[i+3]
    }
    return nueva
  }

  // Rota una imageData 90 grados
  const rotarImagen = (imageData) => {
    const { width: w, height: h, data } = imageData
    const rotada = new ImageData(h, w)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idxOrig = (y * w + x) * 4
        const idxRot = (x * h + (h - 1 - y)) * 4
        rotada.data[idxRot]     = data[idxOrig]
        rotada.data[idxRot + 1] = data[idxOrig + 1]
        rotada.data[idxRot + 2] = data[idxOrig + 2]
        rotada.data[idxRot + 3] = data[idxOrig + 3]
      }
    }
    return rotada
  }

  const intentarLectura = async (zbarMod, imageData) => {
    const scanImageData = zbarMod.scanImageData || zbarMod.default?.scanImageData
    if (!scanImageData) return null
    const symbols = await scanImageData(imageData)
    if (symbols && symbols.length > 0) {
      const symbol = symbols[0]
      const texto = symbol.decode()
      const tipoStr = symbol.typeName || ''
      const formato = tipoStr.toLowerCase().includes('matrix') ? 'DATA_MATRIX' : 'EAN_13'
      return { texto, formato }
    }
    return null
  }

  const handleFoto = async (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    setProcesando(true)
    setError('')
    setProgreso('Cargando imagen...')

    try {
      const url = URL.createObjectURL(archivo)
      const img = new Image()
      img.src = url

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageDataOriginal = ctx.getImageData(0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)

      const zbarMod = await import('@undecaf/zbar-wasm')

      // Intento 1: imagen tal cual
      setProgreso('Intentando leer código...')
      let resultado = await intentarLectura(zbarMod, imageDataOriginal)

      // Intento 2: escala de grises + contraste moderado
      if (!resultado) {
        setProgreso('Procesando imagen (1/3)...')
        const procesada1 = preprocesarImagen(imageDataOriginal, 1.5)
        resultado = await intentarLectura(zbarMod, procesada1)
      }

      // Intento 3: escala de grises + contraste fuerte
      if (!resultado) {
        setProgreso('Procesando imagen (2/3)...')
        const procesada2 = preprocesarImagen(imageDataOriginal, 2.5)
        resultado = await intentarLectura(zbarMod, procesada2)
      }

      // Intento 4: imagen rotada 90 grados
      if (!resultado) {
        setProgreso('Procesando imagen (3/3)...')
        const rotada = rotarImagen(imageDataOriginal)
        resultado = await intentarLectura(zbarMod, rotada)
      }

      // Intento 5: rotada + contraste
      if (!resultado) {
        setProgreso('Último intento...')
        const rotada = rotarImagen(imageDataOriginal)
        const rotadaContraste = preprocesarImagen(rotada, 2.0)
        resultado = await intentarLectura(zbarMod, rotadaContraste)
      }

      if (resultado) {
        onCodigoLeido(resultado.texto, resultado.formato)
        return
      }

      // Si nada funciona, intentar con ZXing como respaldo
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const { DecodeHintType, BarcodeFormat } = await import('@zxing/library')
        const hints = new Map()
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.CODE_128, BarcodeFormat.DATA_MATRIX,
        ])
        hints.set(DecodeHintType.TRY_HARDER, true)
        const lector = new BrowserMultiFormatReader(hints)
        const img2 = new Image()
        img2.src = canvas.toDataURL()
        await new Promise((res) => { img2.onload = res })
        const result = await lector.decodeFromImageElement(img2)
        const formato = result.getBarcodeFormat()
        const texto = result.getText()
        const formatoStr = formato === 5 ? 'DATA_MATRIX' : 'EAN_13'
        onCodigoLeido(texto, formatoStr)
        return
      } catch (zxingErr) {}

      setError('No se ha podido leer el código. Prueba acercándote más al DataMatrix.')
      setProcesando(false)
      setProgreso('')
    } catch (err) {
      setError('Error al procesar la imagen: ' + err.message)
      setProcesando(false)
      setProgreso('')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-3 text-center">
      <div className="text-4xl mb-3">📷</div>
      <div className="text-sm font-medium mb-2">Haz una foto del código de la caja</div>
      <div className="text-xs text-gray-500 mb-4">
        Se abrirá la cámara de tu móvil. Enfoca bien el código de barras o el DataMatrix y haz la foto.
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
          ⚠️ {error}
        </div>
      )}

      {procesando ? (
        <div className="text-sm text-gray-500 py-4">
          🔍 {progreso || 'Procesando imagen...'}
        </div>
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