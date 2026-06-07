import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })

    const sig = request.headers.get('stripe-signature')
    const body = await request.text()

    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('Webhook signature failed:', err.message)
      return Response.json({ ok: false, error: 'Firma inválida' }, { status: 400 })
    }

    // Cliente Supabase con service role (acceso total)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Pago completado → activar Premium
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const usuarioId = session.metadata?.usuarioId

      if (usuarioId) {
        await supabase
          .from('usuarios')
          .update({
            plan: 'premium',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          })
          .eq('id', usuarioId)
      }
    }

    // Suscripción cancelada o impagada → desactivar Premium
    if (event.type === 'customer.subscription.deleted' ||
        event.type === 'customer.subscription.updated') {
      const subscription = event.data.object
      const usuarioId = subscription.metadata?.usuarioId

      if (usuarioId) {
        const activa = subscription.status === 'active' || subscription.status === 'trialing'
        await supabase
          .from('usuarios')
          .update({ plan: activa ? 'premium' : 'free' })
          .eq('id', usuarioId)
      }
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}