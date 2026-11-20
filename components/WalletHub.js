'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Coins, Crown, Gift, ArrowUpRight, Wallet, CheckCircle2, Sparkles } from 'lucide-react';

const COIN_PACKS = [
  { coins: 100, price: '$1.99 / ₦2,500', tag: 'Starter' },
  { coins: 550, price: '$8.99 / ₦11,000', tag: 'Popular' },
  { coins: 1500, price: '$19.99 / ₦25,000', tag: 'Royal Chest' },
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
  const [busy, setBusy] = useState(false);

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

  const handleBuyCoins = async (pack) => {
    if (!currentUser || !myProfile) return alert('Sign in first!');
    setBusy(true);
    await supabase.from('profiles').update({ coins: (myProfile.coins || 0) + pack.coins }).eq('id', currentUser.id);
    await supabase.from('transactions').insert({
      user_id: currentUser.id,
      type: 'coin_topup',
      amount_coins: pack.coins,
      amount_fiat: pack.price,
      note: `Purchased ${pack.coins} Zenith Coins (${pack.tag})`
    });
    await refreshProfile();
    await fetchTxs();
    setBusy(false);
    alert(`+${pack.coins} Zenith Coins added to your wallet!`);
  };
  const handleSendGift = async (gift) => {
    if (!currentUser || !myProfile) return alert('Sign in first!');
    if ((myProfile.coins || 0) < gift.cost) return alert('Insufficient Zenith Coins! Top up above.');
    setBusy(true);
    const { data: ok } = await supabase.rpc('send_zenith_gift', {
      p_sender_id: currentUser.id,
      p_receiver_id: recipientId || currentUser.id,
      p_gift_name: gift.name,
      p_cost: gift.cost
    });
    await refreshProfile();
    await fetchTxs();
    setBusy(false);
    alert(ok ? `Sent ${gift.name} (-${gift.cost} Coins)!` : 'Gift transfer failed.');
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!currentUser || !myProfile) return;
    if ((myProfile.coins || 0) < 500) return alert('Minimum cash-out is 500 Zenith Coins.');
    setBusy(true);
    await supabase.from('profiles').update({ coins: myProfile.coins - 500 }).eq('id', currentUser.id);
    await supabase.from('transactions').insert({
      user_id: currentUser.id,
      type: 'cashout_request',
      amount_coins: -500,
      amount_fiat: '$5.00 / ₦7,000',
      status: 'pending',
      note: `Payout to: ${payoutAccount}`
    });
    setPayoutAccount('');
    await refreshProfile();
    await fetchTxs();
    setBusy(false);
    alert('Cash-out request submitted for admin approval!');
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
        <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${myProfile?.is_vip ? 'zenith-gold' : 'bg-slate-800 text-slate-300'}`}>
          {myProfile?.is_vip ? '👑 ROYAL VIP' : 'STANDARD'}
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">Top Up Zenith Coins</h3>
        <div className="grid grid-cols-3 gap-2">
          {COIN_PACKS.map((p) => (
            <button disabled={busy} key={p.coins} onClick={() => handleBuyCoins(p)} className="zenith-card p-3 rounded-2xl text-center space-y-1">
              <span className="text-[9px] text-fuchsia-400 font-bold block">{p.tag}</span>
              <p className="font-black text-sm text-amber-400">+{p.coins}</p>
              <p className="text-[10px] text-slate-300">{p.price}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="zenith-card rounded-2xl p-3.5 space-y-2.5">
        <h3 className="text-xs font-extrabold text-fuchsia-400 flex items-center gap-1"><Gift className="w-4 h-4" /> Send Live Virtual Gift</h3>
        <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className="w-full bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2 text-xs">
          <option value="">Select Member / Host to Gift...</option>
          {users.filter((u) => u.id !== currentUser.id).map((u) => (
            <option key={u.id} value={u.id}>{u.full_name} ({u.country})</option>
          ))}
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

      <div className="space-y-1.5">
        <h3 className="text-xs font-bold text-slate-400">Recent Ledger</h3>
        {txs.map((t) => (
          <div key={t.id} className="bg-[#10101e] px-3 py-2 rounded-xl flex justify-between text-xs border border-slate-800/80">
            <span className="text-slate-300 truncate max-w-[70%]">{t.note}</span>
            <span className={t.amount_coins >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{t.amount_coins >= 0 ? `+${t.amount_coins}` : t.amount_coins}c</span>
          </div>
        ))}
      </div>
    </div>
  );
}
