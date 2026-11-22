'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldAlert, Users, Coins, Crown, CheckCircle, XCircle, Ban } from 'lucide-react';

export const FOUNDER_EMAIL = adelowokellyt@gmail.com';

export default function AdminHub({ currentUser, users, refreshUsers }) {
  const [allTxs, setAllTxs] = useState([]);
  const [subTab, setSubTab] = useState('payouts');

  useEffect(() => {
    if (currentUser?.email === FOUNDER_EMAIL) fetchAllTxs();
  }, [currentUser]);

  const fetchAllTxs = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40);
    if (data) setAllTxs(data);
  };

  if (currentUser?.email !== FOUNDER_EMAIL) {
    return <div className="text-center py-10 text-xs text-rose-400 font-bold">Restricted: Founder Access Only.</div>;
  }

  const updateTxStatus = async (txId, status) => {
    await supabase.from('transactions').update({ status }).eq('id', txId);
    await fetchAllTxs();
    alert(`Transaction marked as ${status.toUpperCase()}`);
  };

  const toggleUserField = async (userId, field, val) => {
    await supabase.from('profiles').update({ [field]: val }).eq('id', userId);
    await refreshUsers();
  };

  const vipCount = users.filter((u) => u.is_vip).length;
  const totalCoins = users.reduce((sum, u) => sum + (u.coins || 0), 0);

  return (
    <div className="space-y-4">
      <div className="zenith-card rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-sm text-amber-400 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-rose-500" /> ZENITH FOUNDER COMMAND</h2>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">LIVE</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#06060c] p-2.5 rounded-2xl border border-slate-800">
            <Users className="w-4 h-4 text-sky-400 mx-auto mb-1" />
            <p className="font-black text-sm">{users.length}</p>
            <p className="text-[9px] text-slate-400">Members</p>
          </div>
          <div className="bg-[#06060c] p-2.5 rounded-2xl border border-slate-800">
            <Crown className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="font-black text-sm">{vipCount}</p>
            <p className="text-[9px] text-slate-400">VIPs</p>
          </div>
          <div className="bg-[#06060c] p-2.5 rounded-2xl border border-slate-800">
            <Coins className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="font-black text-sm">{totalCoins}</p>
            <p className="text-[9px] text-slate-400">Total Coins</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 bg-[#10101e] p-1 rounded-2xl border border-amber-500/20">
        <button onClick={() => setSubTab('payouts')} className={`flex-1 py-2 rounded-xl text-xs font-extrabold ${subTab === 'payouts' ? 'zenith-gold' : 'text-slate-400'}`}>Cash-Outs & Crypto</button>
        <button onClick={() => setSubTab('users')} className={`flex-1 py-2 rounded-xl text-xs font-extrabold ${subTab === 'users' ? 'zenith-gold' : 'text-slate-400'}`}>Manage Users</button>
      </div>

      {subTab === 'payouts' && (
        <div className="space-y-2.5">
          {allTxs.map((t) => (
            <div key={t.id} className="zenith-card p-3 rounded-2xl space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-400">{t.type} • {t.status}</span>
                  <p className="text-xs font-bold text-white mt-0.5">{t.note}</p>
                  {t.payment_ref && <p className="text-[10px] text-slate-400 break-all">Ref: {t.payment_ref}</p>}
                </div>
                <span className="text-xs font-black text-emerald-400">{t.amount_fiat}</span>
              </div>
              {t.status !== 'completed' && t.status !== 'rejected' && (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => updateTxStatus(t.id, 'completed')} className="flex-1 bg-emerald-600 py-1.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => updateTxStatus(t.id, 'rejected')} className="flex-1 bg-rose-700 py-1.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {subTab === 'users' && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="zenith-card p-3 rounded-2xl flex items-center justify-between">
              <div>
                <p className="font-bold text-xs">{u.full_name} ({u.country})</p>
                <p className="text-[10px] text-slate-400">{u.coins}c • {u.is_vip ? 'VIP' : 'Free'} {u.is_banned ? '• BANNED' : ''}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => toggleUserField(u.id, 'is_vip', !u.is_vip)} className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  {u.is_vip ? 'Revoke VIP' : 'Make VIP'}
                </button>
                <button onClick={() => toggleUserField(u.id, 'is_banned', !u.is_banned)} className="p-1.5 rounded-lg bg-rose-900/50 text-rose-300">
                  <Ban className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
      }
    
