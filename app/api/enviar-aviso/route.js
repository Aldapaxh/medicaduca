export async function POST(request) {
  try {
    const { email, nombre, medicamentos } = await request.json()

    if (!email || !medicamentos || medicamentos.length === 0) {
      return Response.json({ ok: false, error: 'Faltan datos' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.log('Aviso (sin Resend configurado):', email, medicamentos)
      return Response.json({ ok: true, modo: 'log' })
    }

    const filas = medicamentos.map(m => {
      const color = m.estado === 'caducado' || m.estado === 'urgente' ? '#D85A30' : '#BA7517'
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${m.nombre}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:${color};">${m.dias}</td>
      </tr>`
    }).join('')

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#1D9E75;">MediCaduca</h2>
        <p>Hola ${nombre || ''},</p>
        <p>Estos medicamentos de tu botiquín necesitan atención:</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:8px;text-align:left;">Medicamento</th>
              <th style="padding:8px;text-align:left;">Estado</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <p style="font-size:12px;color:#999;">Para dejar de recibir estos avisos, entra en tu perfil de MediCaduca y desactiva las notificaciones.</p>
      </div>
    `

    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MediCaduca <onboarding@resend.dev>',
        to: email,
        subject: '⚠️ Medicamentos pendientes de revisar',
        html,
      }),
    })

    if (!respuesta.ok) {
      const errorText = await respuesta.text()
      console.error('Error Resend:', errorText)
      return Response.json({ ok: false, error: 'Error al enviar email' }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}