import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const obj = event.data.object as { metadata?: { user_id?: string } };
    const userId = obj.metadata?.user_id;
    if (userId) await supabase.from('profiles').update({ is_premium: true }).eq('id', userId);
  }
  if (event.type === 'customer.subscription.deleted') {
    const obj = event.data.object as { metadata?: { user_id?: string } };
    const userId = obj.metadata?.user_id;
    if (userId) await supabase.from('profiles').update({ is_premium: false }).eq('id', userId);
  }
  return NextResponse.json({ received: true });
}
