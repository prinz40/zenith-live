'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Video, PhoneCall, Radio, Gift, X, Mic, MicOff, VideoOff, PhoneIncoming } from 'lucide-react';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:://google.com' }, { urls: 'stun:://google.com' }] };

export default function LiveCallHub({ currentUser, myProfile, activeCallUser, setActiveCallUser, refreshProfile, requireVip }) {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [roomTitle, setRoomTitle] = useState('');
  const [isNaughty, setIsNaughty] = useState(false);
  const [voiceOnly, setVoiceOnly] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [connStatus, setConnStatus] = useState('Connecting...');
  const [incomingCall, setIncomingCall] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);

  const activeRoomId = activeCallUser && currentUser
    ? [currentUser.id, activeCallUser.id].sort().join('_')
    : activeRoom?.id || null;

  useEffect(() => {
    fetchRooms();
    const roomCh = supabase
      .channel('zenith-live-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_rooms' }, () => fetchRooms())
      .subscribe();

    const ringCh = currentUser ? supabase
      .channel('zenith-incoming-rings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_signals' }, (payload) => {
        const sig = payload.new;
        if (sig.signal_type === 'ring' && sig.signal_data?.calleeId === currentUser.id) {
          setIncomingCall(sig.signal_data);
        }
      })
      .subscribe() : null;

    return () => {
      supabase.removeChannel(roomCh);
      if (ringCh) supabase.removeChannel(ringCh);
      cleanupCall();
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!activeRoomId || !currentUser) return;
    startWebRTC(activeRoomId);
    return () => cleanupCall();
  }, [activeRoomId]);

  const fetchRooms = async () => {
    const { data } = await supabase.from('live_rooms').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(20);
    if (data) setRooms(data);
  };

  const cleanupCall = () => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
  };

  const startWebRTC = async (roomId) => {
    setConnStatus('Requesting Camera/Mic...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: !voiceOnly, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        setConnStatus('Connected Live');
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await supabase.from('call_signals').insert({
            room_id: roomId,
            sender_id: currentUser.id,
            signal_type: 'ice',
            signal_data: event.candidate.toJSON()
          });
        }
      };

      const sigChannel = supabase
        .channel(`webrtc_${roomId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `room_id=eq.${roomId}` }, async (payload) => {
          const sig = payload.new;
          if (sig.sender_id === currentUser.id || !pcRef.current) return;
          if (sig.signal_type === 'offer') {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(sig.signal_data));
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            await supabase.from('call_signals').insert({ room_id: roomId, sender_id: currentUser.id, signal_type: 'answer', signal_data: answer });
            setConnStatus('Connected Live');
          } else if (sig.signal_type === 'answer') {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(sig.signal_data));
            setConnStatus('Connected Live');
          } else if (sig.signal_type === 'ice') {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(sig.signal_data)).catch(() => {});
          }
        })
        .subscribe();

      // Initiate call offer & ring partner if 1-on-1 caller
      if (activeCallUser && currentUser.id < activeCallUser.id) {
        await supabase.from('call_signals').insert({
          room_id: roomId,
          sender_id: currentUser.id,
          signal_type: 'ring',
          signal_data: { callerId: currentUser.id, callerName: myProfile?.full_name || 'Zenith VIP', calleeId: activeCallUser.id }
        });
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await supabase.from('call_signals').insert({ room_id: roomId, sender_id: currentUser.id, signal_type: 'offer', signal_data: offer });
        setConnStatus('Ringing Partner...');
      } else {
        setConnStatus('Live Room Ready');
      }
    } catch {
      setConnStatus('Camera/Mic Permission Needed');
    }
  };

  const handleGoLive = async (e) => {
    e.preventDefault();
    if (!currentUser || !myProfile || !roomTitle.trim()) return;
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
      p_gift_name: 'Live Rose 🌹',
      p_cost: 10
    });
    await refreshProfile();
    alert(ok ? `Sent Live Rose to ${hostName} (-10 Coins)!` : 'Not enough Zenith Coins!');
  };

  const endSession = async () => {
    if (activeRoom && activeRoom.host_id === currentUser?.id) {
      await supabase.from('live_rooms').update({ is_active: false }).eq('id', activeRoom.id);
    }
    cleanupCall();
    setActiveRoom(null);
    setActiveCallUser(null);
  };

  if (activeRoom || activeCallUser) {
    const title = activeCallUser ? `HD Call: ${activeCallUser.full_name}` : activeRoom.title;
    return (
      <div className="zenith-card rounded-3xl overflow-hidden border border-amber-500/40 relative">
        <div className="relative h-80 bg-black">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <video ref={localVideoRef} autoPlay muted playsInline className="w-24 h-32 object-cover rounded-2xl border-2 border-amber-400 absolute bottom-16 right-3 bg-slate-900" />
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
            <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">● {connStatus}</span>
            <button onClick={endSession} className="bg-black/70 p-2 rounded-full text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="absolute bottom-3 left-3 right-3 bg-black/75 p-2.5 rounded-2xl flex items-center justify-between">
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
        <div className="p-3 bg-[#06060c] flex justify-center gap-3">
          <button onClick={() => { setMicOn(!micOn); localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn)); }} className="p-3 rounded-full bg-slate-800">
            {micOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-rose-400" />}
          </button>
          <button onClick={() => { setCamOn(!camOn); localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !camOn)); }} className="p-3 rounded-full bg-slate-800">
            {camOn ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4 text-rose-400" />}
          </button>
          <button onClick={endSession} className="px-5 py-2.5 rounded-full bg-rose-600 text-xs font-extrabold">End Call</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incomingCall && (
        <div className="zenith-royal p-3.5 rounded-2xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <PhoneIncoming className="w-5 h-5 text-amber-300" />
            <div>
              <p className="font-extrabold text-xs">Incoming Call: {incomingCall.callerName}</p>
              <p className="text-[10px] text-purple-200">Tap Answer to connect live</p>
            </div>
          </div>
        
