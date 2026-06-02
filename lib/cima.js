const CIMA_URL = 'https://cima.aemps.es/cima/rest'

function detectarCategoria(nombre) {
  const n = nombre.toLowerCase()
  if (n.includes('ibuprofeno') || n.includes('paracetamol') || n.includes('aspirin') || n.includes('nolotil') || n.includes('metamizol') || n.includes('dolor')) return 'analgésico'
  if (n.includes('amoxicilin') || n.includes('augmentine') || n.includes('azitromicin') || n.includes('ciprofloxacin')) return 'antibiótico'
  if (n.includes('loratadin') || n.includes('cetirizin') || n.includes('ebastina') || n.includes('antihist')) return 'antihistamínico'
  if (n.includes('omeprazol') || n.includes('pantoprazol') || n.includes('almax') || n.includes('digest')) return 'digestivo'
  if (n.includes('vitamin') || n.includes('calcio') || n.includes('hierro') || n.includes('magnesio')) return 'vitamina'
  return 'otro'
}

function parseDataMatrix(codigo) {
  const limpio = codigo.replace(/\u001d/g, '|')

  let gtin = null, lote = null, caducidad = null, serie = null

  // GTIN: 01 + 14 dígitos
  const matchGtin = limpio.match(/01(\d{14})/)
  if (matchGtin) gtin = matchGtin[1]

  // Caducidad: 17 + 6 dígitos (YYMMDD)
  const matchCad = limpio.match(/17(\d{6})/)
  if (matchCad) caducidad = matchCad[1]

  // Lote: 10 seguido de caracteres alfanuméricos
  const matchLote = limpio.match(/10([A-Z0-9]+?)(?=\||17|21|$)/)
  if (matchLote) lote = matchLote[1]

  // Serie: 21
  const matchSerie = limpio.match(/21([A-Z0-9]+?)(?=\||17|10|$)/)
  if (matchSerie) serie = matchSerie[1]

  return { gtin, lote, caducidad, serie, raw: codigo }
}

function gtinACodigoNacional(gtin) {
  if (!gtin || gtin.length < 14) return null
  // GTIN español de medicamentos: 0 + 847 + 0 + CN (6 dígitos) + dígito control
  // Ejemplo: 08470007492672 -> CN = 749267
  return gtin.substring(7, 13)
}

function fechaDataMatrixAMes(yymmdd) {
  if (!yymmdd || yymmdd.length !== 6) return null
  const yy = yymmdd.substring(0, 2)
  const mm = yymmdd.substring(2, 4)
  const yyyy = '20' + yy
  return `${yyyy}-${mm}`
}

function extraerCN(codigoBarras) {
  const limpio = codigoBarras.replace(/\D/g, '')
  // EAN-13 español de medicamentos: 847 + CN (6 dígitos con 0 inicial) + dígito de control
  // Ejemplo: 8470007492672 -> CN = 749267
  if (limpio.length === 13) {
    return limpio.substring(6, 12)
  }
  if (limpio.length === 6 || limpio.length === 7) return limpio
  return limpio
}

export async function buscarMedicamentoPorCodigo(codigoBarras, formato) {
  let cn = null
  let caducidadDetectada = null
  let lote = null

  if (formato && formato.toLowerCase().includes('data_matrix')) {
    const datos = parseDataMatrix(codigoBarras)
    if (datos.gtin) cn = gtinACodigoNacional(datos.gtin)
    if (datos.caducidad) caducidadDetectada = fechaDataMatrixAMes(datos.caducidad)
    lote = datos.lote
  } else {
    cn = extraerCN(codigoBarras)
  }

  if (!cn) {
    return { ok: false, error: 'No se pudo identificar el código nacional. Crudo: ' + codigoBarras }
  }

  try {
    const respuesta = await fetch(`${CIMA_URL}/medicamento?cn=${cn}`, {
      headers: { 'Accept': 'application/json' }
    })

    const texto = await respuesta.text()

    if (!respuesta.ok) {
      return { ok: false, error: `CIMA respondió ${respuesta.status}. CN: ${cn}. Crudo: ${codigoBarras}` }
    }

    if (!texto || texto.trim() === '') {
      return { ok: false, error: `Medicamento no encontrado para CN: ${cn}. Crudo: ${codigoBarras}` }
    }

    let data
    try {
      data = JSON.parse(texto)
    } catch {
      return { ok: false, error: `Respuesta no válida de CIMA. CN: ${cn}. Crudo: ${codigoBarras}` }
    }

    if (!data || !data.nombre) {
      return { ok: false, error: `Medicamento no encontrado para CN: ${cn}. Crudo: ${codigoBarras}` }
    }

    return {
      ok: true,
      medicamento: {
        nombre: data.nombre,
        categoria: detectarCategoria(data.nombre),
        codigoNacional: cn,
        laboratorio: data.labtitular || '',
        caducidad: caducidadDetectada,
        lote: lote,
      }
    }
  } catch (err) {
    return { ok: false, error: 'Error de conexión con CIMA: ' + err.message }
  }
}