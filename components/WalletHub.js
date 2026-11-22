'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Coins, Crown, Gift, ArrowUpRight, CreditCard, ShieldCheck, Copy } from 'lucide-react';

const COIN_PACKS = [
  { coins: 100, ngn: 2500, usd: 2, priceLabel: '₦2,500 / $2', tag: 'Starter' },
  { coins: 550, ngn: 11000, usd: 9, priceLabel: '₦11,000 / $9', tag: 'Popular' },
  { coins: 1500, ngn: 25000, usd: 20, priceLabel: '₦25,000 / $20', tag: 'Royal Chest' },
];

const GIFTS = [
  { name: 'Golden Rose 🌹', cost: 10 },
  { name: 'Royal Crown 👑', cost: 50 },
  { name: 'Sports Car 🏎️', cost: 200 },
  { name: 'Zenith Yacht 🛥️', cost: 500 },
];

export default function WalletHub({ currentUser, myProfile, users, refreshProfile }) {
  const [txs, setTxs] = useState([]);
  const [recipientId, setRecipientId] = useState('');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [cryptoTxHash, setCryptoTxHash] = useState('');
  const [selectedCryptoPack, setSelectedCryptoPack] = useState(COIN_PACKS);
  const [busy, setBusy] = useState(false);

  const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_replace_in_vercel';
  const USDT_WALLET = process.env.NEXT_PUBLIC_USDT_WALLET || 'TYourTronUSDTWalletAddressHere';

  useEffect(() => {
    if (currentUser) fetchTxs();
  }, [currentUser]);

  const fetchTxs = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(15);
    if (data) setTxs(data);
  };

  const creditAfterVerify = async (payload) => {
    const res = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, ...payload }),
    });
    const out = await res.json();
    if (!out.ok) return alert(out.error || 'Verification error');
    await refreshProfile();
    await fetchTxs();
    alert('Payment confirmed & credited to your Zenith account!');
  };

  const handlePaystackCheckout = (pack, isVipUpgrade = false) => {
    if (!currentUser) return alert('Sign in first!');
    const amountKobo = isVipUpgrade ? 7500 * 100 : pack.ngn * 100;
    const ref = `ZEN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    if (typeof window !== 'undefined' && window.PaystackPop && !PAYSTACK_KEY.includes('replace')) {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_KEY,
        email: currentUser.email,
        amount: amountKobo,
        currency: 'NGN',
        ref,
        callback: () => {
          creditAfterVerify({
            reference: ref,
            gateway: 'paystack',
            coinsToAdd: isVipUpgrade ? 0 : pack.coins,
            activateVip: isVipUpgrade,
            amountFiat: isVipUpgrade ? '₦7,500' : `₦${pack.ngn}`,
          });
        },
      });
      handler.openIframe();
    } else {
      creditAfterVerify({
        reference: ref,
        gateway: 'demo_paystack',
        coinsToAdd: isVipUpgrade ? 0 : pack.coins,
        activateVip: isVipUpgrade,
        amountFiat: isVipUpgrade ? '₦7,500' : pack.priceLabel,
      });
    }
  };

  const handleCryptoSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !cryptoTxHash.trim()) return;
    setBusy(true);
    await creditAfterVerify({
      txHash: cryptoTxHash.trim(),
      gateway: 'crypto',
      coinsToAdd: selectedCryptoPack.coins,
      activateVip: true,
      amountFiat: `$${selectedCryptoPack.usd} USDT`,
    });
    setCryptoTxHash('');
    setBusy(false);
  };

  const handleSendGift = async (gift) => {
    if (!currentUser || !myProfile) return alert('Sign in first!');
    if ((myProfile.coins || 0) < gift.cost) return alert('Insufficient Zenith Coins!');
    setBusy(true);
    const { data: ok } = await supabase.rpc('send_zenith_gift', {
      p_sender_id: currentUser.id,
      p_receiver_id: recipientId || currentUser.id,
      p_gift_name: gift.name,
      p_cost: gift.cost,
    });
    await refreshProfile();
    await fetchTxs();
    setBusy(false);
    alert(ok ? `Sent ${gift.name} (-${gift.cost} Coins)!` : 'Gift failed.');
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!currentUser || !myProfile || (myProfile.coins || 0) < 500) {
      return alert('Minimum cash-out is 500 Zenith Coins.');
    }
    setBusy(true);
    await supabase.from('profiles').update({ coins: myProfile.coins - 500 }).eq('id', currentUser.id);
    await supabase.from('transactions').insert({
      user_id: currentUser.id,
      type: 'cashout_request',
      amount_coins: -500,
      amount_fiat: '$5.00 / ₦7,500',
      status: 'pending',
      note: `Payout to: ${payoutAccount}`,
    });
    setPayoutAccount('');
    await refreshProfile();
    await fetchTxs();
    setBusy(false);
    alert('Cash-out submitted for admin approval!');
  };

  if (!currentUser) {
    return <div className="text-center py-10 text-xs text-slate-400">Sign in on the Profile tab to open your Zenith Wallet.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="zenith-card rounded-3xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-amber-400 font-bold">ZENITH COIN BALANCE</p>
          <h2 className="text-2xl font-black flex items-center gap-1.5 mt-0.5"><Coins className="w-6 h-6 text-amber-400" /> {myProfile?.coins ?? 0}</h2>
        </div>
        {!myProfile?.is_vip ? (
          <button onClick={() => handlePaystackCheckout(null, true)} className="zenith-gold px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" /> Buy VIP (₦7,500)
          </button>
        ) : (
          <span className="zenith-gold px-3 py-1.5 rounded-xl text-xs font-extrabold">👑 ROYAL VIP</span>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-amber-400 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Instant Top-Up (Card / Bank / USSD)</h3>
        <div className="grid grid-cols-3 gap-2">
          {COIN_PACKS.map((p) => (
            <button disabled={busy} key={p.coins} onClick={() => handlePaystackCheckout(p, false)} className="zenith-card p-3 rounded-2xl text-center space-y-1">
              <span className="text-[9px] text-fuchsia-400 font-bold block">{p.tag}</span>
              <p className="font-black text-sm text-amber-400">+{p.coins}</p>
              <p className="text-[10px] text-slate-300">{p.priceLabel}</p>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleCryptoSubmit} className="zenith-card rounded-2xl p-3.5 space-y-2">
        <h3 className="text-xs font-extrabold text-sky-400 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Global & 18+ VIP Crypto Checkout (USDT TRC20)</h3>
        <div className="flex items-center justify-between bg-[#06060c] px-2.5 py-2 rounded-xl border border-slate-800 text-[10px]">
          <span className="text-slate-300 truncate max-w-[78%]">{USDT_WALLET}</span>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(USDT_WALLET); alert('USDT Address Copied!'); }} className="text-amber-400 font-bold flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
        </div>
        <div className="flex gap-2">
          <select value={selectedCryptoPack.coins} onChange={(e) => setSelectedCryptoPack(COIN_PACKS.find((x) => x.coins === Number(e.target.value)))} className="bg-[#06060c] border border-slate-700 rounded-xl px-2 py-2 text-xs">
            {COIN_PACKS.map((p) => <option key={p.coins} value={p.coins}>${p.usd} USDT ({p.coins}c + VIP)</option>)}
          </select>
          <input required placeholder="Paste USDT TXID / Hash" value={cryptoTxHash} onChange={(e) => setCryptoTxHash(e.target.value)} className="flex-1 bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2 text-xs" />
        </div>
        <button disabled={busy} type="submit" className="w-full zenith-royal py-2 rounded-xl text-xs font-extrabold">Confirm USDT Payment</button>
      </form>

      <div className="zenith-card rounded-2xl p-3.5 space-y-2.5">
        <h3 className="text-xs font-extrabold text-fuchsia-400 flex items-center gap-1"><Gift className="w-4 h-4" /> Send Live Virtual Gift</h3>
        <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className="w-full bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2 text-xs">
          <option value="">Select Member / Host to Gift...</option>
          {users.filter((u) => u.id !== currentUser.id).map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.country})</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          {GIFTS.map((g) => (
            <button disabled={busy} key={g.name} onClick={() => handleSendGift(g)} className="bg-[#06060c] border border-amber-500/30 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-between">
              <span>{g.name}</span>
              <span className="text-amber-400">{g.cost}c</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleRequestPayout} className="zenith-card rounded-2xl p-3.5 space-y-2">
        <h3 className="text-xs font-extrabold text-emerald-400 flex items-center gap-1"><ArrowUpRight className="w-4 h-4" /> Creator Cash-Out (Min 500 Coins)</h3>
        <div className="flex gap-2">
          <input required placeholder="Bank Account or USDT TRC20 Wallet" value={payoutAccount} onChange={(e) => setPayoutAccount(e.target.value)} className="flex-1 bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2 text-xs" />
          <button disabled={busy} type="submit" className="zenith-gold px-3.5 rounded-xl text-xs font-extrabold">Withdraw</button>
        </div>
      </form>
