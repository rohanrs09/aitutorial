import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/auth';
import Stripe from 'stripe';

// Use service role client to bypass RLS for webhook operations
const supabase = getAdminClient();

// Initialize Stripe with error handling
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log('[Stripe Webhook] Event type:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId || session.client_reference_id;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
          console.error('[Stripe Webhook] Missing userId or planId in session metadata');
          break;
        }

        console.log('[Stripe Webhook] Checkout completed for user:', userId, 'plan:', planId);

        // Update subscription
        const tier = planId as 'pro' | 'unlimited';
        const credits = tier === 'pro' ? 500 : -1;

        await supabase
          .from('user_subscriptions')
          .update({
            tier,
            status: 'active',
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        // Reset credits
        await supabase
          .from('user_credits')
          .update({
            total_credits: credits === -1 ? 999999 : credits,
            used_credits: 0,
            last_reset_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        // Log transaction
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: credits === -1 ? 999999 : credits,
            type: 'subscription_reset',
            description: `Upgraded to ${tier} plan`
          });

        console.log('[Stripe Webhook] Subscription updated successfully');
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error('[Stripe Webhook] Missing userId in subscription metadata');
          break;
        }

        await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            cancel_at_period_end: (subscription as any).cancel_at_period_end,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log('[Stripe Webhook] Subscription updated');
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        await supabase
          .from('user_subscriptions')
          .update({
            tier: 'starter',
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        // Reset to starter credits
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (subData) {
          await supabase
            .from('user_credits')
            .update({
              total_credits: 50,
              used_credits: 0,
              last_reset_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', subData.id);
        }

        console.log('[Stripe Webhook] Subscription canceled');
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const userId = invoice.metadata?.userId;

        if (userId) {
          await supabase
            .from('stripe_invoices')
            .insert({
              user_id: userId,
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: (invoice as any).subscription as string,
              amount_due: invoice.amount_due,
              amount_paid: invoice.amount_paid,
              currency: invoice.currency,
              status: invoice.status,
              invoice_pdf: (invoice as any).invoice_pdf,
              hosted_invoice_url: (invoice as any).hosted_invoice_url,
              period_start: new Date((invoice as any).period_start * 1000).toISOString(),
              period_end: new Date((invoice as any).period_end * 1000).toISOString()
            });

          console.log('[Stripe Webhook] Invoice recorded');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;

        await supabase
          .from('user_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', (invoice as any).subscription as string);

        console.log('[Stripe Webhook] Payment failed, subscription marked past_due');
        break;
      }

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error processing event:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}
