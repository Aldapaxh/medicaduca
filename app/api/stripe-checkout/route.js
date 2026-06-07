import Stripe from 'stripe'

export async function POST(request) {
  try {
    const { usuarioId, email } = await request.json()

    if (!usuarioId || !email) {
      return Response.json({ ok: false, error: 'Faltan datos' }, { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })

    const origen = request.headers.get('origin') || 'https://medicaduca.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        quantity: 1,
      }],
      success_url: `${origen}/?pago=ok`,
      cancel_url: `${origen}/?pago=cancelado`,
      metadata: {
        usuarioId,
      },
      subscription_data: {
        metadata: {
          usuarioId,
        },
      },
    })

    return Response.json({ ok: true, url: session.url })
  } catch (err) {
    console.error('Error Stripe Checkout:', err)
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}