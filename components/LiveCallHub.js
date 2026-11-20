'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Video, PhoneCall, Radio, Flame, Gift, X, Mic, MicOff, VideoOff, Users } from 'lucide-react';

export default function LiveCallHub({ currentUser, myProfile, activeCallUser, setActiveCallUser, refreshProfile, requireVip }) {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [roomTitle, setRoomTitle] = useState('');
  const [isNaughty, setIsNaughty] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchRooms();
    const ch = supabase
      .channel('zenith-live-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_rooms' }, () => fetchRooms())
      .subscribe();
    return () => { supabase.removeChannel(ch); stopLocalMedia(); };
  }, []);

  useEffect(() => {
    if (activeRoom || activeCallUser) startLocalMedia();
    else stopLocalMedia();
  }, [activeRoom, activeCallUser]);

  const fetchRooms = async () => {
    const { data } = await supabase.from('live_rooms').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(20);
    if (data) setRooms(data);
  };

  const startLocalMedia = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      console.log('Camera/mic preview unavailable');
    }
  };

  const stopLocalMedia = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  const handleGoLive = async (e) => {
    e.preventDefault();
    if (!currentUser || !myProfile) return alert('Sign in first!');
    if (!roomTitle.trim()) return;
    const { data } = await supabase.from('live_rooms').insert({
      host_id: currentUser.id,
      host_name: myProfile.full_name,
      title: roomTitle,
      room_type: isNaughty ? 'naughty_18' : 'public_stream',
      is_naughty_18: isNaughty
    }).select().single();
    setRoomTitle('');
    if (data) setActiveRoom(data);
  };

  const sendLiveRose = async (hostId, hostName) => {
    if (!currentUser) return;
    const { data: ok } = await supabase.rpc('send_zenith_gift', {
      p_sender_id: currentUser.id,
      p_receiver_id: hostId,
      p_gift_name: 'Live Stream Rose 🌹',
      p_cost: 10
    });
    await refreshProfile();
    alert(ok ? `Sent Live Rose to ${hostName} (-10 Coins)!` : 'Not enough Zenith Coins!');
  };

  const endSession = async () => {
    if (activeRoom && activeRoom.host_id === currentUser?.id) {
      await supabase.from('live_rooms').update({ is_active: false }).eq('id', activeRoom.id);
    }
    setActiveRoom(null);
    setActiveCallUser(null);
  };

  if (activeRoom || activeCallUser) {
    const title = activeCallUser ? `Private HD Call with ${activeCallUser.full_name}` : activeRoom.title;
    return (
      <div className="zenith-card rounded-3xl overflow-hidden border border-amber-500/40 relative">
        <div className="relative h-80 bg-black flex items-center justify-center">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
            <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">● LIVE HD</span>
            <button onClick={endSession} className="bg-black/70 p-2 rounded-full text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="font-bold text-xs text-amber-400">{title}</p>
              <p className="text-[10px] text-slate-300">{activeCallUser ? activeCallUser.country : `Host: ${activeRoom.host_name}`}</p>
            </div>
            {activeRoom && (
              <button onClick={() => sendLiveRose(activeRoom.host_id, activeRoom.host_name)} className="zenith-gold px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" /> 10c
              </button>
            )}
          </div>
        </div>
        <div className="p-3 bg-[#06060c] flex justify-center gap-4">
          <button onClick={() => { setMicOn(!micOn); streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn)); }} className="p-3 rounded-full bg-slate-800">
            {micOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-rose-400" />}
          </button>
          <button onClick={() => { setCamOn(!camOn); streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !camOn)); }} className="p-3 rounded-full bg-slate-800">
            {camOn ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4 text-rose-400" />}
          </button>
          <button onClick={endSession} className="px-5 py-2.5 rounded-full bg-rose-600 text-xs font-extrabold">End Call / Stream</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleGoLive} className="zenith-card rounded-2xl p-3.5 space-y-2.5">
        <h3 className="text-xs font-extrabold text-amber-400 flex items-center gap-1"><Radio className="w-4 h-4 text-rose-500" /> Start a Live Stream</h3>
        <input required placeholder="Stream Title (e.g., Late Night Vibe & Truth/Dare)" value={roomTitle} onChange={(e) => setRoomTitle(e.target.value)} className="w-full bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2 text-xs" />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs text-rose-400 font-bold">
            <input type="checkbox" checked={isNaughty} onChange={(e) => setIsNaughty(e.target.checked)} /> 18+ After-Dark Naughty Room
          </label>
          <button type="button" onClick={() => requireVip(() => handleGoLive({ preventDefault: () => {} }))} className="zenith-gold px-4 py-2 rounded-xl text-xs font-extrabold">Go Live Now</button>
        </div>
      </form>

      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-400">Active Global Live Streams</h3>
        {rooms.length === 0 && <p className="text-center text-xs text-slate-500 py-6">No live streams right now—tap Go Live Now above!</p>}
        {rooms.map((r) => (
          <div key={r.id} className="zenith-card p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${r.is_naughty_18 ? 'bg-rose-600/30 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {r.is_naughty_18 ? '🔥 18+ NAUGHTY' : '● LIVE STREAM'}
              </span>
              <h4 className="font-bold text-sm mt-1">{r.title}</h4>
              <p className="text-[11px] text-slate-400">Host: {r.host_name}</p>
            </div>
            <button onClick={() => requireVip(() => setActiveRoom(r))} className="zenith-royal px-3.5 py-2 rounded-xl text-xs font-extrabold">Watch</button>
          </div>
        ))}
      </div>
    </div>
  );
}
