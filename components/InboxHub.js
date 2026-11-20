'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MessageCircle, Send, Mic, Square, ArrowLeft, Lock, Crown } from 'lucide-react';

export default function InboxHub({ currentUser, myProfile, users, selectedChatUser, setSelectedChatUser, requireVip }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (!currentUser || !selectedChatUser) return;
    fetchMessages();

    const channel = supabase
      .channel('zenith-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new;
        if (
          (m.sender_id === currentUser.id && m.receiver_id === selectedChatUser.id) ||
          (m.sender_id === selectedChatUser.id && m.receiver_id === currentUser.id)
        ) {
          setMessages((prev) => [...prev, m]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, selectedChatUser]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedChatUser.id}),and(sender_id.eq.${selectedChatUser.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendText = async (e) => {
    e.preventDefault();
    if (!text.trim() || !currentUser || !selectedChatUser) return;
    const msg = text.trim();
    setText('');
    await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: selectedChatUser.id,
      sender_name: myProfile?.full_name || 'Zenith User',
      content: msg
    });
  };
  const toggleRecordVoice = async () => {
    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const path = `voice/${currentUser.id}_${Date.now()}.webm`;
          const { error } = await supabase.storage.from('zenith-media').upload(path, blob);
          if (!error) {
            const { data } = supabase.storage.from('zenith-media').getPublicUrl(path);
            await supabase.from('messages').insert({
              sender_id: currentUser.id,
              receiver_id: selectedChatUser.id,
              sender_name: myProfile?.full_name || 'Zenith User',
              audio_url: data.publicUrl
            });
          }
          stream.getTracks().forEach((t) => t.stop());
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setRecording(true);
      } catch {
        alert('Microphone permission denied or unavailable.');
      }
    } else {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    }
  };

  if (!currentUser) {
    return <div className="text-center py-10 text-xs text-slate-400">Please sign in on the Profile tab to open your Inbox.</div>;
  }

  if (!selectedChatUser) {
    return (
      <div className="space-y-3">
        <h2 className="font-bold text-base flex items-center gap-2 text-amber-400"><MessageCircle className="w-5 h-5" /> Direct Messages & Voice Notes</h2>
        {users.filter((u) => u.id !== currentUser.id).map((u) => (
          <div key={u.id} onClick={() => requireVip(() => setSelectedChatUser(u))} className="zenith-card p-3.5 rounded-2xl flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-bold text-sm flex items-center gap-1">{u.full_name} {u.is_vip && <Crown className="w-3.5 h-3.5 text-amber-400" />}</p>
              <p className="text-xs text-slate-400">{u.country} • Tap to message</p>
            </div>
            {!myProfile?.is_vip ? <Lock className="w-4 h-4 text-amber-400" /> : <Send className="w-4 h-4 text-fuchsia-400" />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
        <button onClick={() => setSelectedChatUser(null)} className="p-1.5 rounded-xl bg-slate-900"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h3 className="font-bold text-sm">{selectedChatUser.full_name}</h3>
          <p className="text-[10px] text-emerald-400">● {selectedChatUser.country}</p>
        </div>
      </div>

      <div className="h-72 overflow-y-auto space-y-2 p-2 bg-[#0a0a14] rounded-2xl border border-slate-800">
        {messages.length === 0 && <p className="text-center text-xs text-slate-500 py-10">Say hello or send a voice note!</p>}
        {messages.map((m) => {
          const mine = m.sender_id === currentUser.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs ${mine ? 'zenith-gold font-semibold' : 'bg-slate-800 text-white'}`}>
                {m.content && <p>{m.content}</p>}
                {m.audio_url && <audio src={m.audio_url} controls className="h-8 w-44 mt-1" />}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={sendText} className="flex gap-2">
        <button type="button" onClick={toggleRecordVoice} className={`p-2.5 rounded-xl ${recording ? 'bg-rose-600 animate-pulse' : 'bg-slate-800 text-amber-400'}`}>
          {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1 bg-[#10101e] border border-slate-700 rounded-xl px-3 text-xs" />
        <button type="submit" className="zenith-gold px-4 rounded-xl text-xs font-extrabold"><Send className="w-4 h-4" /></button>
      </form>
    </div>
  );
}
