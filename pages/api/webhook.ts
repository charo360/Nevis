import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { buffer } from 'micro'
import { userService } from '@/lib/firebase/database'

export const config = {
  api: {
    bodyParser: false,
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
    return
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature'] as string | undefined

  let event: Stripe.Event

  try {
    if (!sig) throw new Error('Missing Stripe signature')
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message)
    res.status(400).send(`Webhook Error: ${err.message}`)
    return
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const userId = session.metadata?.userId as string | undefined

      // Try to get price id from metadata first
      const priceId = session.metadata?.priceId as string | undefined

      let creditsToAdd = 0
      switch (priceId) {
        case 'price_1RxYHyFptxIKIuiwekVOOCf3': creditsToAdd = 50; break;
        case 'price_1RxYIwFptxIKIuiwMVPibdo5': creditsToAdd = 150; break;
        case 'price_1RxYJzFptxIKIuiwqcRemLE8': creditsToAdd = 250; break;
        case 'price_1RxYKfFptxIKIuiwCql1Wj0u': creditsToAdd = 550; break;
        default: creditsToAdd = 0; break;
      }

      console.log(`Webhook: completed session for user=${userId} price=${priceId} credits=${creditsToAdd}`)

      if (userId && creditsToAdd > 0) {
        try {
          const userDoc = await userService.getById(userId)
          if (userDoc) {
            const userAny = userDoc as any
            const newCredits = (userAny.credits || 0) + creditsToAdd
            // Cast update payload to any to avoid strict type checks here
            await (userService as any).update(userId, { credits: newCredits } as any)
            console.log(`Added ${creditsToAdd} credits to user ${userId}`)
          }
        } catch (e) {
          console.error('Failed to update user credits', e)
        }
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error', err)
    res.status(500).end()
  }
}
