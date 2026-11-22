'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Gamepad2, Flame, Trophy, RefreshCw, Music, Volume2, VolumeX, Upload } from 'lucide-react';

const CLEAN_DARES = [
  "Truth: What is the boldest thing you've ever done on a first date?",
  "Dare: Turn on your camera and give your best runway walk for 10 seconds!",
  "Truth: Which country on Zenith Live do you want to visit most and why?",
  "Dare: Sing the chorus of your favorite love song in a voice note right now!",
  "Truth: What is your #1 dealbreaker in a real-life partner?",
  "Dare: Compliment the other player in the most romantic way you can!",
  "Truth: Have you ever fallen in love at first sight?",
  "Dare: Show the last photo in your camera roll or tell the story behind it!"
];

const NAUGHTY_DARES_18 = [
  "18+ Truth: What is your ultimate late-night fantasy with a partner?",
  "18+ Dare: Whisper your wildest secret into the mic for 5 seconds!",
  "18+ Truth: Lights on or lights off—and what sets your mood instantly?",
  "18+ Dare: Blow a slow kiss to the camera and tell the room who you'd pick tonight!",
  "18+ Couples Challenge: Both players rate each other's charm from 1 to 10 live!",
  "18+ Truth: What is the most adventurous place you've ever kissed someone?",
  "18+ Dare: Do your most seductive slow-motion wink on camera right now!"
];

const SOLO_TRIVIA = [
  { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter"], ans: "Mars" },
  { q: "How many continents are there on Earth?", options: ["5", "6", "7"], ans: "7" },
  { q: "What is the currency of Japan?", options: ["Yuan", "Won", "Yen"], ans: "Yen" },
  { q: "Which ocean is the largest on Earth?", options: ["Atlantic", "Indian", "Pacific"], ans: "Pacific" },
  { q: "What is the chemical symbol for Gold?", options: ["Go", "Au", "Ag"], ans: "Au" },
  { q: "Which country won the 2022 FIFA World Cup?", options: ["France", "Brazil", "Argentina"], ans: "Argentina" },
  { q: "What is the fastest land animal?", options: ["Lion", "Cheetah", "Horse"], ans: "Cheetah" },
  { q: "Which city is known as the City of Love?", options: ["Rome", "Paris", "Venice"], ans: "Paris" },
  { q: "How many players are on a standard football (soccer) team on the pitch?", options: ["9", "11", "12"], ans: "11" },
  { q: "Which gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide"], ans: "Carbon Dioxide" },
  { q: "What is the capital city of Nigeria?", options: ["Lagos", "Abuja", "Port Harcourt"], ans: "Abuja" },
  { q: "Which metal is liquid at room temperature?", options: ["Mercury", "Copper", "Silver"], ans: "Mercury" }
];

const VIBE_TRACKS = [
  { name: "Zenith Afrobeats Lounge", url: "https://soundhelix.com" },
  { name: "Midnight R&B Chill", url: "https://soundhelix.com" },
  { name: "Royal VIP Club Beat", url: "https://soundhelix.com" }
];

export default function PlayLounge({ currentUser, myProfile, refreshProfile, requireVip }) {
  const [sessions, setSessions] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [soloScore, setSoloScore] = useState(0);
  const [askedIndices, setAskedIndices] = useState([0]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [musicUrl, setMusicUrl] = useState('');
  const [musicName, setMusicName] = useState('No Music Playing');
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchSessions();
    const ch = supabase
      .channel('zenith-games')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions' }, (payload) => {
        fetchSessions();
        if (activeGame && payload.new?.id === activeGame.id) {
          setActiveGame(payload.new);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeGame?.id]);

  const fetchSessions = async () => {
    const { data } = await supabase.from('game_sessions').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(20);
    if (data) setSessions(data);
  };

  const selectTrack = (url, name) => {
    setMusicUrl(url);
    setMusicName(name);
    setIsPlayingMusic(true);
    setTimeout(() => audioRef.current?.play().catch(() => {}), 100);
  };

  const handleCustomSongUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    selectTrack(localUrl, file.name.slice(0, 24));
  };

  const toggleMusic = () => {
    if (!audioRef.current || !musicUrl) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingMusic(true);
    }
  };

  const createMultiplayerGame = async (gameType, isNaughty) => {
    if (!currentUser || !myProfile) return alert('Sign in first!');
    const deck = isNaughty ? NAUGHTY_DARES_18 : CLEAN_DARES;
    const firstCard = deck[Math.floor(Math.random() * deck.length)];
    const { data } = await supabase.from('game_sessions').insert({
      host_id: currentUser.id,
      host_name: myProfile.full_name,
      game_type: gameType,
      is_naughty_18: isNaughty,
      current_prompt: firstCard
    }).select().single();
    if (data) setActiveGame(data);
  };

  const drawNextCard = async () => {
    if (!activeGame) return;
    const deck = activeGame.is_naughty_18 ? NAUGHTY_DARES_18 : CLEAN_DARES;
    const otherCards = deck.filter((c) => c !== activeGame.current_prompt);
    const nextCard = otherCards[Math.floor(Math.random() * otherCards.length)];
    await supabase.from('game_sessions').update({ current_prompt: nextCard }).eq('id', activeGame.id);
  };

  const handleSoloAnswer = async (opt) => {
    const cur = SOLO_TRIVIA[currentIdx];
    if (opt === cur.ans) {
      setSoloScore(soloScore + 1);
      if (currentUser && myProfile) {
        await supabase.from('profiles').update({ coins: (myProfile.coins || 0) + 10 }).eq('id', currentUser.id);
        refreshProfile();
      }
      alert('Correct! +10 Zenith Coins earned!');
    } else {
      alert(`Wrong! Correct answer was ${cur.ans}.`);
    }

    let remaining = SOLO_TRIVIA.map((_, i) => i).filter((i) => !askedIndices.includes(i));
    if (remaining.length === 0) {
      remaining = SOLO_TRIVIA.map((_, i) => i).filter((i) => i !== currentIdx);
      setAskedIndices([]);
    }
    const nextIdx = remaining[Math.floor(Math.random() * remaining.length)];
    setAskedIndices((prev) => [...prev, nextIdx]);
    setCurrentIdx(nextIdx);
  };

  const currentQ = SOLO_TRIVIA[currentIdx];

  return (
    <div className="space-y-4">
      <audio ref={audioRef} src={musicUrl} loop />

      {/* BACKGROUND GAME MUSIC JUKEBOX */}
      <div className="zenith-card rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-amber-400 font-extrabold uppercase">Game Background Jukebox</p>
              <p className="text-xs font-bold text-white truncate max-w-[180px]">{musicName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="bg-[#06060c] border border-amber-500/40 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-amber-300 cursor-pointer flex items-center gap-1">
              <Upload className="w-3 h-3" /> My Song
              <input type="file" accept="audio/*" onChange={handleCustomSongUpload} className="hidden" />
            </label>
            {musicUrl && (
              <button onClick={toggleMusic} className="zenith-gold p-2 rounded-xl">
                {isPlayingMusic ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {VIBE_TRACKS.map((t) => (
            <button key={t.name} onClick={() => selectTrack(t.url, t.name)} className="shrink-0 bg-[#06060c] border border-slate-800 hover:border-amber-500 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-300">
              ▶ {t.name}
            </button>
          ))}
        </div>
      </div>

      {activeGame ? (
        <div className="zenith-card rounded-3xl p-5 space-y-4 text-center">
          <div className="flex justify-between items-center">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${activeGame.is_naughty_18 ? 'bg-rose-600/30 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
              {activeGame.is_naughty_18 ? '🔥 18+ NAUGHTY LIVE GAME' : '🎮 LIVE MULTIPLAYER ROOM'}
            </span>
            <button onClick={() => setActiveGame(null)} className="text-xs text-slate-400 underline">Exit Room</button>
          </div>
          <h3 className="font-black text-base text-amber-400">{activeGame.game_type}</h3>
          <div className="bg-[#06060c] border border-amber-500/30 rounded-2xl p-5 min-h-[120px] flex items-center justify-center">
            <p className="text-sm font-bold text-white leading-relaxed">{activeGame.current_prompt}</p>
          </div>
          <button onClick={drawNextCard} className="w-full zenith-gold py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Draw Next Live Card (Syncs All Players)
          </button>
        </div>
      ) : (
        <>
          <div className="zenith-card rounded-2xl p-4 space-y-2.5">
            <div className="flex justify-between items-center">
                      <h3 className="text-xs font-extrabold text-amber-400 flex items-center gap-1"><Trophy className="w-4 h-4" /> Solo Quick Trivia (+10 Coins/Win)</h3>
              <span className="text-[11px] text-emerald-400 font-bold">Wins: {soloScore}</span>
            </div>
            <p className="text-xs font-bold text-white">{currentQ.q}</p>
            <div className="grid grid-cols-3 gap-2">
              {currentQ.options.map((opt) => (
                <button key={opt} onClick={() => handleSoloAnswer(opt)} className="bg-[#06060c] border border-slate-700 hover:border-amber-500 py-2 rounded-xl text-xs font-bold">
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => requireVip(() => createMultiplayerGame('Global Truth or Dare', false))} className="zenith-royal p-3.5 rounded-2xl text-left space-y-1">
              <Gamepad2 className="w-5 h-5 text-amber-300" />
              <p className="font-extrabold text-xs">2+ Player Truth/Dare</p>
              <p className="text-[10px] text-purple-200">Host live multiplayer</p>
            </button>
            <button onClick={() => requireVip(() => createMultiplayerGame('After-Dark Naughty Dares 18+', true))} className="bg-gradient-to-br from-rose-700 to-fuchsia-900 p-3.5 rounded-2xl text-left space-y-1 border border-rose-500/40">
              <Flame className="w-5 h-5 text-amber-300" />
              <p className="font-extrabold text-xs">18+ Naughty Live Game</p>
              <p className="text-[10px] text-rose-200">VIP Adult Party Deck</p>
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400">Live Open Game Lobbies</h3>
            {sessions.length === 0 && <p className="text-center text-xs text-slate-500 py-4">No open multiplayer rooms yet—start one above!</p>}
            {sessions.map((s) => (
              <div key={s.id} className="zenith-card p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs">{s.game_type}</p>
                  <p className="text-[10px] text-slate-400">Host: {s.host_name}</p>
                </div>
                <button onClick={() => requireVip(() => setActiveGame(s))} className="zenith-gold px-3 py-1.5 rounded-xl text-xs font-extrabold">Join Game</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
              }
        
