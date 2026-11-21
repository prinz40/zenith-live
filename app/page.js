'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import SocialHub from '../components/SocialHub';
import InboxHub from '../components/InboxHub';
import WalletHub from '../components/WalletHub';
import LiveCallHub from '../components/LiveCallHub';
import PlayLounge from '../components/PlayLounge';
import {
  Flame, Globe, Compass, Gamepad2, Video, MessageCircle,
  Crown, Lock, Coins, Search, ShieldCheck, Sparkles, X, User, LogOut
} from 'lucide-react';

const COUNTRIES = ['All Countries', 'Nigeria', 'USA', 'UK', 'Brazil', 'Germany', 'Canada', 'South Africa', 'UAE'];

export default function ZenithLiveApp() {
  const [activeTab, setActiveTab] = useState('discover');
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [countryFilter, setCountryFilter] = useState('All Countries');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [activeCallUser, setActiveCallUser] = useState(null);

  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('22');
  const [country, setCountry] = useState('Nigeria');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        fetchProfile(session.user.id);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_ev, session) => {
      setCurrentUser(session?.user || null);
      if (session?.user) fetchProfile(session.user.id);
      else setMyProfile(null);
    });
    fetchUsers();
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setMyProfile(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(40);
    if (data) setUsers(data);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setLoading(false); return alert(error.message); }
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName || 'Zenith Member',
          age: parseInt(age) || 21,
          country,
          bio: bio || 'Ready to connect, play & go live on Zenith!',
          coins: 50
        });
        await fetchProfile(data.user.id);
        await fetchUsers();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setLoading(false); return alert(error.message); }
    }
    setLoading(false);
    setShowAuth(false);
  };

  const isVip = myProfile?.is_vip || false;

  const requireVip = (action) => {
    if (!currentUser) { setShowAuth(true); return; }
    if (!isVip) { setShowPaywall(true); return; }
    action();
  };

  const activateVip = async () => {
    if (!currentUser) { setShowPaywall(false); setShowAuth(true); return; }
    await supabase.from('profiles').update({ is_vip: true }).eq('id', currentUser.id);
    await fetchProfile(currentUser.id);
    await fetchUsers();
    setShowPaywall(false);
    alert('Royal VIP Activated! All global features unlocked.');
  };

  const verifyAge18 = async () => {
    if (!currentUser) return;
    await supabase.from('profiles').update({ is_verified: true }).eq('id', currentUser.id);
    await fetchProfile(currentUser.id);
    await fetchUsers();
    alert('18+ Verified Shield Activated!');
  };

  const filteredUsers = users.filter((u) => {
    const matchCountry = countryFilter === 'All Countries' || u.country === countryFilter;
    const matchText = (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.bio || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCountry && matchText;
  });

  return (
    <div className="min-h-screen bg-[#06060c] text-white pb-24 max-w-md mx-auto border-x border-amber-500/20">
      <header className="sticky top-0 z-30 bg-[#06060c]/95 backdrop-blur border-b border-amber-500/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl zenith-gold flex items-center justify-center font-black text-lg">Z</div>
          <div>
            <h1 className="font-black text-sm tracking-wide text-amber-400 leading-none">ZENITH LIVE</h1>
            <span className="text-[9px] text-slate-400 font-bold">GLOBAL CONNECT & PLAY</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('wallet')} className="flex items-center gap-1 bg-[#121224] border border-amber-500/40 px-2.5 py-1 rounded-full text-xs font-extrabold text-amber-400">
            <Coins className="w-3.5 h-3.5" /> {myProfile?.coins ?? 50}
          </button>
          <button onClick={() => setShowPaywall(true)} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${isVip ? 'zenith-gold' : 'zenith-royal'}`}>
            <Crown className="w-3.5 h-3.5" /> {isVip ? 'VIP' : 'Upgrade'}
          </button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {activeTab === 'discover' && (
          <>
            {!currentUser && (
              <div className="zenith-card rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-amber-400">Welcome to Zenith Live</p>
                  <p className="text-[11px] text-slate-300">Create your profile & claim 50 free coins</p>
                </div>
                <button onClick={() => setShowAuth(true)} className="zenith-gold px-3.5 py-2 rounded-xl text-xs font-extrabold">Sign Up / Login</button>
              </div>
            )}

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search partners, vibes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121224] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <select
                value={countryFilter}
                onChange={(e) => requireVip(() => setCountryFilter(e.target.value))}
                className="bg-[#121224] border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-amber-300"
              >
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredUsers.length === 0 && (
                <div className="col-span-2 text-center py-8 text-xs text-slate-400">No members found yet—sign up to appear first on Global Discover!</div>
              )}
              {filteredUsers.map((u) => (
                <div key={u.id} className="zenith-card rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400">● {u.country}</span>
                    {u.is_vip && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div>
                    <p className="font-extrabold text-sm flex items-center gap-1 truncate">
                      {u.full_name}, {u.age} {u.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                    </p>
                    <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">{u.bio}</p>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button onClick={() => requireVip(() => { setSelectedChatUser(u); setActiveTab('inbox'); })} className="flex-1 bg-slate-800 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                      {!isVip && <Lock className="w-3 h-3 text-amber-400" />} Chat
                    </button>
                    <button onClick={() => requireVip(() => { setActiveCallUser(u); setActiveTab('live'); })} className="flex-1 zenith-royal py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                      <Video className="w-3 h-3" /> Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'feed' && <SocialHub currentUser={currentUser} myProfile={myProfile} requireVip={requireVip} />}
        {activeTab === 'play' && <PlayLounge currentUser={currentUser} myProfile={myProfile} refreshProfile={() => currentUser && fetchProfile(currentUser.id)} requireVip={requireVip} />}
        {activeTab === 'live' && <LiveCallHub currentUser={currentUser} myProfile={myProfile} activeCallUser={activeCallUser} setActiveCallUser={setActiveCallUser} refreshProfile={() => currentUser && fetchProfile(currentUser.id)} requireVip={requireVip} />}
          {activeTab === 'inbox' && <InboxHub currentUser={currentUser} myProfile={myProfile} users={users} selectedChatUser={selectedChatUser} setSelectedChatUser={setSelectedChatUser} requireVip={requireVip} />}
        {activeTab === 'wallet' && <WalletHub currentUser={currentUser} myProfile={myProfile} users={users} refreshProfile={() => currentUser && fetchProfile(currentUser.id)} />}

        {activeTab === 'profile' && (
          <div className="zenith-card rounded-3xl p-5 space-y-4">
            {currentUser && myProfile ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-lg text-amber-400 flex items-center gap-1.5">
                      {myProfile.full_name}, {myProfile.age}
                      {myProfile.is_verified && <ShieldCheck className="w-4 h-4 text-sky-400" />}
                    </h2>
                    <p className="text-xs text-slate-400">{myProfile.country} • {myProfile.coins} Zenith Coins</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${isVip ? 'zenith-gold' : 'bg-slate-800 text-slate-300'}`}>
                    {isVip ? 'ROYAL VIP' : 'FREE TIER'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 bg-[#06060c] p-3 rounded-xl border border-amber-500/15">{myProfile.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {!isVip && <button onClick={() => setShowPaywall(true)} className="flex-1 zenith-gold py-2.5 rounded-xl text-xs font-extrabold">Upgrade VIP</button>}
                  {!myProfile.is_verified && <button onClick={verifyAge18} className="px-3.5 py-2.5 rounded-xl zenith-royal text-xs font-extrabold">Verify 18+</button>}
                  <button onClick={() => supabase.auth.signOut()} className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-xs font-bold flex items-center gap-1"><LogOut className="w-3.5 h-3.5" /> Logout</button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 space-y-3">
                <User className="w-10 h-10 text-amber-400 mx-auto" />
                <h3 className="font-bold">Create Your Zenith Profile</h3>
                <p className="text-xs text-slate-400">Sign up to claim 50 welcome coins and unlock global connections.</p>
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
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Global Country Filter, Inbox & HD Calls</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-fuchsia-400" /> Live Multiplayer Games & 18+ After-Dark Rooms</li>
            </ul>
            <button onClick={activateVip} className="w-full py-3 rounded-2xl zenith-gold font-extrabold text-sm">Activate Royal VIP Now</button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#06060c]/95 border-t border-amber-500/20 px-1 py-2 flex justify-around z-30">
        {[
          { id: 'discover', label: 'Discover', icon: Globe },
          { id: 'feed', label: 'Feed', icon: Compass },
          { id: 'play', label: 'Play', icon: Gamepad2 },
          { id: 'live', label: 'Live 18+', icon: Flame },
          { id: 'inbox', label: 'Inbox', icon: MessageCircle },
          { id: 'profile', label: 'Profile', icon: User },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl ${activeTab === t.id ? 'text-amber-400' : 'text-slate-400'}`}>
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-bold">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
                                                                                }
          
