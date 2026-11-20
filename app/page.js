'use client';
import { useState, useEffect } from 'react';
import WalletHub from '../components/WalletHub';
import InboxHub from '../components/InboxHub';
import SocialHub from '../components/SocialHub';
import { supabase } from '../lib/supabase';
import {
  Flame, Globe, Compass, MessageCircle, Gamepad2, Video, MessageCircle, Crown, Lock,
  Coins, Gift, Search, ShieldCheck, Sparkles, X, User, LogOut, CheckCircle2
} from 'lucide-react';

const SEED_PROFILES = [
  { id: 's1', full_name: 'Amara', age: 24, country: 'Nigeria', bio: 'Dating, Ludo & Live Trivia', is_online: true, is_verified: true, avatar_url: 'https://unsplash.com' },
  { id: 's2', full_name: 'Sofia', age: 23, country: 'Brazil', bio: 'Truth or Dare • After-Dark VIP', is_online: true, is_verified: true, avatar_url: 'https://unsplash.com' },
  { id: 's3', full_name: 'Elena', age: 26, country: 'Germany', bio: 'Real Partner & Video Calls', is_online: false, is_verified: true, avatar_url: 'https://unsplash.com' },
  { id: 's4', full_name: 'Chloe', age: 22, country: 'UK', bio: 'Multiplayer Games & Global Chat', is_online: true, is_verified: true, avatar_url: 'https://unsplash.com' },
];

export default function ZenithLiveApp() {
  const [session, setSession] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [profiles, setProfiles] = useState(SEED_PROFILES);
  const [activeTab, setActiveTab] = useState('discover');
  const [countryFilter, setCountryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [authForm, setAuthForm] = useState({ email: '', password: '', full_name: '', age: 24, country: 'Nigeria' });
  const [authMsg, setAuthMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMyProfile(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) fetchMyProfile(session.user.id);
      else setMyProfile(null);
    });
    fetchAllProfiles();
    return () => subscription.unsubscribe();
  }, []);

  const fetchMyProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setMyProfile(data);
  };

  const fetchAllProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) setProfiles([...data, ...SEED_PROFILES]);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthMsg('');
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email: authForm.email, password: authForm.password });
      if (error) { setAuthMsg(error.message); setLoading(false); return; }
      if (data?.user) {
        await supabase.from('profiles').insert([{
          id: data.user.id,
          full_name: authForm.full_name || 'Zenith Member',
          age: Number(authForm.age) || 22,
          country: authForm.country || 'Nigeria',
          coins: 50,
          is_vip: false,
          is_verified: true,
        }]);
        await fetchMyProfile(data.user.id);
        await fetchAllProfiles();
        setShowAuth(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
      if (error) { setAuthMsg(error.message); setLoading(false); return; }
      setShowAuth(false);
    }
    setLoading(false);
  };

  const upgradeToVip = async () => {
    if (!session) { setShowPaywall(false); setShowAuth(true); return; }
    await supabase.from('profiles').update({ is_vip: true, coins: (myProfile?.coins || 50) + 200 }).eq('id', session.user.id);
    await fetchMyProfile(session.user.id);
    setShowPaywall(false);
  };

  const isVip = myProfile?.is_vip || false;
  const coins = myProfile?.coins ?? 50;

  const requireVip = (action) => {
    if (!session) { setShowAuth(true); return; }
    if (!isVip) { setShowPaywall(true); return; }
    action();
  };

  const filtered = profiles.filter((u) => {
    const cMatch = countryFilter === 'All' || u.country === countryFilter;
    const sMatch = u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || (u.bio || '').toLowerCase().includes(searchQuery.toLowerCase());
    return cMatch && sMatch;
  });
                      <p className="text-xs text-slate-300 bg-[#06060c] p-3 rounded-xl border border-amber-500/10">{myProfile.bio}</p>
                      <div className="flex gap-2">
                        {!isVip && <button onClick={() => setShowPaywall(true)} className="flex-1 zenith-gold py-2.5 rounded-xl text-xs font-extrabold">Upgrade to VIP</button>}
                        <button onClick={() => supabase.auth.signOut()} className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-bold flex items-center gap-1"><LogOut className="w-3.5 h-3.5" /> Logout</button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <User className="w-10 h-10 text-amber-400 mx-auto" />
                      <h3 className="font-bold">Create Your Zenith Profile</h3>
                      <p className="text-xs text-slate-400">Sign up to get 50 free welcome coins and connect worldwide.</p>
                      <button onClick={() => setShowAuth(true)} className="zenith-gold px-6 py-2.5 rounded-xl text-xs font-extrabold">Create Account / Login</button>
                    </div>
                  )}
                </div>
              )}
            </main>

            {showAuth && (
              <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
                <form onSubmit={handleAuth} className="zenith-card rounded-3xl p-5 w-full max-w-sm space-y-3 relative">
                  <button type="button" onClick={() => setShowAuth(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
                  <h2 className="font-black text-lg text-amber-400">{isSignUp ? 'Join Zenith Live' : 'Welcome Back'}</h2>
                  {isSignUp && (
                    <>
                      <input required placeholder="Full Name or Stage Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2.5 text-sm" />
                      <div className="flex gap-2">
                        <input required type="number" min="18" max="99" placeholder="Age (18+)" value={age} onChange={(e) => setAge(e.target.value)} className="w-24 bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2.5 text-sm" />
                        <select value={country} onChange={(e) => setCountry(e.target.value)} className="flex-1 bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2.5 text-sm">
                          {COUNTRIES.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <input placeholder="Short Bio (Dating, Games, Live...)" value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2.5 text-sm" />
                    </>
                  )}
                  <input required type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2.5 text-sm" />
                  <input required type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2.5 text-sm" />
                  <button disabled={loading} type="submit" className="w-full zenith-gold py-3 rounded-2xl font-extrabold text-sm">{loading ? 'Please wait...' : isSignUp ? 'Create Account & Get 50 Coins' : 'Sign In'}</button>
                  <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-xs text-amber-400 underline">{isSignUp ? 'Already have an account? Sign In' : 'New to Zenith Live? Create Account'}</button>
                </form>
              </div>
            )}

            {showPaywall && (
              <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
                <div className="zenith-card rounded-3xl p-5 w-full max-w-sm space-y-4 relative">
                  <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
                  <div className="flex items-center gap-2 text-amber-400 font-black text-lg"><Crown className="w-6 h-6" /> Zenith Royal VIP</div>
                  <ul className="text-xs space-y-2 text-slate-200">
                    <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Global Country Filter & Unlimited Calls</li>
                    <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-fuchsia-400" /> Multiplayer Live Games & 18+ After-Dark Rooms</li>
                  </ul>
                  <button onClick={activateVip} className="w-full py-3 rounded-2xl zenith-gold font-extrabold text-sm">Activate Royal VIP Now</button>
                </div>
              </div>
            )}

            <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#06060c]/95 border-t border-amber-500/20 px-2 py-2 flex justify-around z-30">
              {[{ id: 'discover', label: 'Discover', icon: Globe }, { id: 'feed', label: 'Feed', icon: Compass }, { id: 'play', label: 'Play', icon: Gamepad2 }, { id: 'live', label: 'Live 18+', icon: Flame }, { id: 'inbox', label: 'Inbox', icon: MessageCircle }, { id: 'profile', label: 'Profile', icon: User }].map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl ${activeTab === t.id ? 'text-amber-400' : 'text-slate-400'}`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold">{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        );
      }
