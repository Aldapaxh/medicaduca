// Conector con la API de CIMA (AEMPS)
// Documentación: https://cima.aemps.es/cima/dochtml/api/index.html

const CIMA_URL = 'https://cima.aemps.es/cima/rest'

// Categorías por palabras clave en el nombre o tipo del medicamento
function detectarCategoria(nombre) {
  const n = nombre.toLowerCase()
  if (n.includes('ibuprofeno') || n.includes('paracetamol') || n.includes('aspirin') || n.includes('nolotil') || n.includes('metamizol') || n.includes('dolor')) return 'analgésico'
  if (n.includes('amoxicilin') || n.includes('augmentine') || n.includes('azitromicin') || n.includes('ciprofloxacin')) return 'antibiótico'
  if (n.includes('loratadin') || n.includes('cetirizin') || n.includes('ebastina') || n.includes('antihist')) return 'antihistamínico'
  if (n.includes('omeprazol') || n.includes('pantoprazol') || n.includes('almax') || n.includes('digest')) return 'digestivo'
  if (n.includes('vitamin') || n.includes('calcio') || n.includes('hierro') || n.includes('magnesio')) return 'vitamina'
  return 'otro'
}

// Extrae el código nacional de un código de barras EAN-13
// En España el código nacional son los 6 o 7 dígitos antes del último (dígito de control)
function extraerCN(codigoBarras) {
  // Los EAN-13 españoles de medicamentos suelen empezar por 84700 (genéricos) o similares
  // El código nacional son los últimos 6-7 dígitos antes del de control
  const limpio = codigoBarras.replace(/\D/g, '')
  if (limpio.length === 13) {
    // EAN-13: extraer del dígito 7 al 12 (6 dígitos del CN)
    return limpio.substring(6, 12)
  }
  if (limpio.length === 6 || limpio.length === 7) {
    return limpio
  }
  return limpio
}

export async function buscarMedicamentoPorCodigo(codigoBarras) {
  const cn = extraerCN(codigoBarras)

  try {
    const respuesta = await fetch(`${CIMA_URL}/medicamento?cn=${cn}`)

    if (!respuesta.ok) {
      return { ok: false, error: 'No se pudo conectar con CIMA' }
    }

    const data = await respuesta.json()

    if (!data || !data.nombre) {
      return { ok: false, error: 'Medicamento no encontrado en CIMA' }
    }

    return {
      ok: true,
      medicamento: {
        nombre: data.nombre,
        categoria: detectarCategoria(data.nombre),
        codigoNacional: cn,
        laboratorio: data.labtitular || '',
      }
    }
  } catch (err) {
    return { ok: false, error: 'Error al consultar CIMA: ' + err.message }
  }
}