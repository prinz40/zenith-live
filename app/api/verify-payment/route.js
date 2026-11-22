import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_tPNk6pueT2uirRnxouZjfw_k_iXco2w'
);

export async function POST(req) {
  try {
    const { reference, userId, gateway, coinsToAdd, activateVip, amountFiat, txHash } = await req.json();

    if (!userId || (!reference && !txHash)) {
      return NextResponse.json({ ok: false, error: 'Missing payment details' }, { status: 400 });
    }

    const finalRef = reference || `CRYPTO_${txHash}`;

    // Verify Paystack transaction if Paystack Secret Key is configured
    if (gateway === 'paystack' && process.env.PAYSTACK_SECRET_KEY) {
      const verifyRes = await fetch(`https://paystack.co{reference}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.status || verifyData.data?.status !== 'success') {
        return NextResponse.json({ ok: false, error: 'Paystack payment not verified' }, { status: 400 });
      }
    }

    // Fetch current profile
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
    if (!profile) {
      return NextResponse.json({ ok: false, error: 'User profile not found' }, { status: 404 });
    }

    // Prevent duplicate reference reuse
    const { data: existing } = await supabaseAdmin.from('transactions').select('id').eq('payment_ref', finalRef).maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: false, error: 'Payment reference already credited' }, { status: 409 });
    }

    const updates = {};
    if (coinsToAdd > 0) updates.coins = (profile.coins || 0) + coinsToAdd;
    if (activateVip) updates.is_vip = true;

    await supabaseAdmin.from('profiles').update(updates).eq('id', userId);
    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      type: activateVip ? 'vip_upgrade' : 'coin_topup',
      amount_coins: coinsToAdd || 0,
      amount_fiat: amountFiat || 'Paid',
      payment_ref: finalRef,
      status: gateway === 'crypto' ? 'pending_review' : 'completed',
      note: activateVip ? `Royal VIP (${gateway.toUpperCase()})` : `+${coinsToAdd} Coins (${gateway.toUpperCase()})`
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
  
