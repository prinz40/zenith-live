'use client';
import { useState } from 'react';
import {
  Flame, Globe, Heart, Gamepad2, Video, MessageCircle,
  Crown, Lock, Coins, Gift, Search, ShieldCheck, Sparkles, X
} from 'lucide-react';

const DEMO_USERS = [
  { id: 1, name: 'Amara, 24', country: 'Nigeria', tag: 'Dating & Live Games', online: true, verified: true, img: 'https://unsplash.com' },
  { id: 2, name: 'Sofia, 23', country: 'Brazil', tag: 'Truth or Dare • After-Dark', online: true, verified: true, img: 'https://unsplash.com' },
  { id: 3, name: 'Elena, 26', country: 'Germany', tag: 'Real Partner & Video Calls', online: false, verified: true, img: 'https://unsplash.com' },
  { id: 4, name: 'Chloe, 22', country: 'UK', tag: 'Multiplayer Ludo & Trivia', online: true, verified: true, img: 'https://unsplash.com' },
];

export default function ZenithLiveHome() {
  const [activeTab, setActiveTab] = useState('discover');
  const [isVip, setIsVip] = useState(false);
  const [coins, setCoins] = useState(50);
  const [countryFilter, setCountryFilter] = useState('All Countries');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

  const requireVip = (action) => {
    if (!isVip) {
      setShowPaywall(true);
      return;
    }
    action();
  };

  const filteredUsers = DEMO_USERS.filter((u) => {
    const matchesCountry = countryFilter === 'All Countries' || u.country === countryFilter;
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCountry && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 max-w-md mx-auto border-x border-slate-800 relative">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-amber-500 flex items-center justify-center font-black text-lg">Z</div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight leading-none">ZENITH LIVE</h1>
            <span className="text-[10px] text-amber-400 font-semibold">GLOBAL CONNECT & PLAY</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCoins(coins + 100)} className="flex items-center gap-1 bg-slate-900 border border-amber-500/40 px-2.5 py-1 rounded-full text-xs font-bold text-amber-400">
            <Coins className="w-3.5 h-3.5" /> {coins}
          </button>
          <button onClick={() => setShowPaywall(true)} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isVip ? 'bg-amber-500 text-black' : 'bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white'}`}>
            <Crown className="w-3.5 h-3.5" /> {isVip ? 'VIP' : 'Upgrade'}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-4 space-y-4">
        {activeTab === 'discover' && (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search partners, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-fuchsia-500"
                />
              </div>
              <select
                value={countryFilter}
                onChange={(e) => requireVip(() => setCountryFilter(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-200"
              >
                <option value="All Countries">🌍 Global</option>
                <option value="Nigeria">🇳🇬 Nigeria (VIP)</option>
                <option value="Brazil">🇧🇷 Brazil (VIP)</option>
                <option value="Germany">🇩🇪 Germany (VIP)</option>
                <option value="UK">🇬🇧 UK (VIP)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 relative group">
                  <div className="h-44 relative">
                    <img src={user.img} alt={user.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${user.online ? 'bg-emerald-500/90 text-black' : 'bg-slate-800/90 text-slate-300'}`}>
                      {user.online ? '● LIVE' : 'Offline'}
                    </span>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="font-bold text-sm flex items-center gap-1">
                        {user.name} {user.verified && <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />}
                      </p>
                      <p className="text-[11px] text-slate-300">{user.country}</p>
                    </div>
                  </div>
                  <div className="p-2.5 space-y-2">
                    <p className="text-[11px] text-fuchsia-300 truncate">{user.tag}</p>
                    <div className="flex gap-1.5">
                      <button onClick={() => requireVip(() => alert(`Opening chat with ${user.name}`))} className="flex-1 bg-slate-800 hover:bg-slate-700 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1">
                        {!isVip && <Lock className="w-3 h-3 text-amber-400" />} Chat
                      </button>
                      <button onClick={() => requireVip(() => alert(`Starting Video Call with ${user.name}`))} className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1">
                        <Video className="w-3 h-3" /> Call
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'play' && (
          <div className="space-y-3">
            <h2 className="font-bold text-lg flex items-center gap-2"><Gamepad2 className="text-fuchsia-400" /> Live Play Lounge</h2>
            {[
              { title: 'Truth or Dare (Live Cam)', mode: '2 Players • Voice/Video', reward: '+50 Coins' },
              { title: 'Zenith Global Trivia', mode: 'Group Multiplayer', reward: '+120 Coins' },
              { title: 'Royal Ludo Match', mode: '2-4 Players Live', reward: '+200 Coins' },
              { title: 'Solo Speed Puzzle', mode: 'Single Player', reward: '+20 Coins' },
            ].map((game, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{game.title}</h3>
                  <p className="text-xs text-slate-400">{game.mode} • <span className="text-amber-400">{game.reward}</span></p>
                </div>
                <button onClick={() => requireVip(() => alert(`Launching ${game.title}...`))} className="bg-fuchsia-600 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                  {!isVip && <Lock className="w-3 h-3" />} Play
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 to-fuchsia-950/80 border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1"><Flame className="w-4 h-4" /> AFTER-DARK 18+ LOUNGE</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">VIP ONLY</span>
              </div>
              <p className="text-xs text-slate-300">Private naughty live streams, 1-on-1 adult video invites, and interactive couples dares.</p>
              <button onClick={() => requireVip(() => alert('Entering 18+ Verified Lounge...'))} className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold mt-1">
                Enter Private Naughty Stream
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">● PUBLIC LIVE ROOM: Sofia & Guests</span>
                <span className="text-xs text-slate-400">1.4k watching</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { if (coins >= 10) { setCoins(coins - 10); alert('Sent Rose Gift!'); } else alert('Not enough coins!'); }} className="flex-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                  <Gift className="w-4 h-4" /> Send Rose (10 Coins)
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="text-center py-12 space-y-3">
            <MessageCircle className="w-10 h-10 text-fuchsia-500 mx-auto" />
            <h3 className="font-bold">Messages, Voice Notes & Calls</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">Upgrade to Zenith VIP to unlock unlimited global text, voice notes, and HD video calls.</p>
            <button onClick={() => setShowPaywall(true)} className="bg-fuchsia-600 px-5 py-2.5 rounded-xl text-xs font-bold">Unlock Inbox</button>
          </div>
        )}
      </main>

      {/* VIP PAYWALL MODAL */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 w-full max-w-sm space-y-4 relative">
            <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-lg"><Crown className="w-6 h-6" /> Zenith VIP Access</div>
            <p className="text-xs text-slate-300">Unlock every feature across the globe:</p>
            <ul className="text-xs space-y-2 text-slate-200">
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-fuchsia-400" /> Unlimited Voice, Video Calls & Global Country Search</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-fuchsia-400" /> 2-Player & Group Live Interactive Games</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-rose-400" /> Full Access to 18+ After-Dark Naughty Streams</li>
            </ul>
            <button onClick={() => { setIsVip(true); setShowPaywall(false); }} className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-fuchsia-600 font-extrabold text-sm text-white shadow-lg">
              Activate VIP Now (Demo Unlock)
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950/95 border-t border-slate-800 px-2 py-2 flex justify-around z-30">
        {[
          { id: 'discover', label: 'Discover', icon: Globe },
          { id: 'play', label: 'Play', icon: Gamepad2 },
          { id: 'live', label: 'Live 18+', icon: Flame },
          { id: 'inbox', label: 'Inbox', icon: MessageCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl ${active ? 'text-fuchsia-400' : 'text-slate-400'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
