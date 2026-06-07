import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { usuarioId } = await request.json()

    if (!usuarioId) {
      return Response.json({ ok: false, error: 'Falta usuarioId' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('stripe_customer_id')
      .eq('id', usuarioId)
      .single()

    if (error || !usuario?.stripe_customer_id) {
      return Response.json({ ok: false, error: 'No hay suscripción activa' }, { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })

    const origen = request.headers.get('origin') || 'https://medicaduca.vercel.app'

    const session = await stripe.billingPortal.sessions.create({
      customer: usuario.stripe_customer_id,
      return_url: origen,
    })

    return Response.json({ ok: true, url: session.url })
  } catch (err) {
    console.error('Error portal Stripe:', err)
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}