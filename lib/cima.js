// Conector con la API de CIMA (AEMPS)
// Documentación: https://cima.aemps.es/cima/dochtml/api/index.html

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

// Parsea un DataMatrix GS1 de medicamento europeo
// Formato: GTIN (01) + Lote (10) + Caducidad (17) + Serie (21)
// Ejemplo: (01)08470001234567(10)ABC123(17)260531(21)12345678
function parseDataMatrix(codigo) {
  // Limpiar caracteres de control GS1
  const limpio = codigo.replace(/\u001d/g, '|').replace(/\(/g, '|(').split('|').filter(Boolean)

  let gtin = null, lote = null, caducidad = null, serie = null

  for (const parte of limpio) {
    // Identificadores de aplicación GS1
    if (parte.startsWith('(01)') || parte.match(/^01\d{14}/)) {
      gtin = parte.replace(/[^\d]/g, '').substring(parte.startsWith('(') ? 0 : 2, parte.startsWith('(') ? 14 : 16)
      if (parte.startsWith('(01)')) gtin = parte.substring(4, 18)
    }
    if (parte.startsWith('(17)')) {
      caducidad = parte.substring(4, 10) // YYMMDD
    } else if (parte.match(/^17\d{6}/) && !gtin?.includes(parte.substring(2,8))) {
      caducidad = parte.substring(2, 8)
    }
    if (parte.startsWith('(10)')) {
      lote = parte.substring(4)
    }
    if (parte.startsWith('(21)')) {
      serie = parte.substring(4)
    }
  }

  // Si no hay separadores, parsear secuencialmente
  if (!gtin && codigo.length > 16) {
    const sinControl = codigo.replace(/\u001d/g, '')
    if (sinControl.startsWith('01')) {
      gtin = sinControl.substring(2, 16)
      let resto = sinControl.substring(16)
      // Buscar 17 (caducidad)
      const idxCad = resto.indexOf('17')
      if (idxCad !== -1 && resto.length >= idxCad + 8) {
        caducidad = resto.substring(idxCad + 2, idxCad + 8)
      }
    }
  }

  return { gtin, lote, caducidad, serie }
}

// Extrae código nacional desde GTIN
// Los GTIN españoles de medicamentos contienen el código nacional
function gtinACodigoNacional(gtin) {
  if (!gtin || gtin.length < 14) return null
  // El código nacional son los dígitos 7-13 del GTIN (saltando el prefijo 847)
  return gtin.substring(7, 13)
}

// Convierte fecha YYMMDD a YYYY-MM
function fechaDataMatrixAMes(yymmdd) {
  if (!yymmdd || yymmdd.length !== 6) return null
  const yy = yymmdd.substring(0, 2)
  const mm = yymmdd.substring(2, 4)
  const yyyy = '20' + yy
  return `${yyyy}-${mm}`
}

function extraerCN(codigoBarras) {
  const limpio = codigoBarras.replace(/\D/g, '')
  if (limpio.length === 13) {
    return limpio.substring(6, 12)
  }
  if (limpio.length === 6 || limpio.length === 7) {
    return limpio
  }
  return limpio
}

export async function buscarMedicamentoPorCodigo(codigoBarras, formato) {
  let cn = null
  let caducidadDetectada = null
  let lote = null

  // Si es DataMatrix, parsear según GS1
  if (formato && formato.toLowerCase().includes('data_matrix')) {
    const datos = parseDataMatrix(codigoBarras)
    if (datos.gtin) {
      cn = gtinACodigoNacional(datos.gtin)
    }
    if (datos.caducidad) {
      caducidadDetectada = fechaDataMatrixAMes(datos.caducidad)
    }
    lote = datos.lote
  } else {
    cn = extraerCN(codigoBarras)
  }

  if (!cn) {
    return { ok: false, error: 'No se pudo identificar el código' }
  }

  try {
    const respuesta = await fetch(`${CIMA_URL}/medicamento?cn=${cn}`)

    if (!respuesta.ok) {
      return { ok: false, error: 'No se pudo conectar con CIMA' }
    }

    const data = await respuesta.json()

    if (!data || !data.nombre) {
      return { ok: false, error: 'Medicamento no encontrado en CIMA (código: ' + cn + ')' }
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
    return { ok: false, error: 'Error al consultar CIMA: ' + err.message }
  }
}