'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Image as ImageIcon, Heart, Users, Plus, Send, Crown } from 'lucide-react';

export default function SocialHub({ currentUser, myProfile, requireVip }) {
  const [subTab, setSubTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [posting, setPosting] = useState(false);

  const [groupName, setGroupName] = useState('');
  const [groupCat, setGroupCat] = useState('Global Dating');
  const [groupDesc, setGroupDesc] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);

  useEffect(() => {
    fetchSocialData();
  }, []);

  const fetchSocialData = async () => {
    const { data: postData } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(30);
    if (postData) setPosts(postData);
    const { data: groupData } = await supabase.from('groups').select('*').order('created_at', { ascending: false }).limit(30);
    if (groupData) setGroups(groupData);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!currentUser || !myProfile) return alert('Please create/login to your profile first!');
    if (!caption.trim() && !file) return;
    setPosting(true);

    let mediaUrl = null;
    let mediaType = 'text';

    if (file) {
      const ext = file.name.split('.').pop();
      const filePath = `${currentUser.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('zenith-media').upload(filePath, file);
      if (upErr) { setPosting(false); return alert(upErr.message); }
      const { data: urlData } = supabase.storage.from('zenith-media').getPublicUrl(filePath);
      mediaUrl = urlData.publicUrl;
      mediaType = file.type.startsWith('video') ? 'video' : 'image';
    }

    await supabase.from('posts').insert({
      user_id: currentUser.id,
      author_name: myProfile.full_name,
      author_country: myProfile.country,
      is_vip: myProfile.is_vip,
      caption,
      media_url: mediaUrl,
      media_type: mediaType
    });

    setCaption('');
    setFile(null);
    setPosting(false);
    fetchSocialData();
  };
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert('Please login first!');
    await supabase.from('groups').insert({
      creator_id: currentUser.id,
      name: groupName,
      category: groupCat,
      description: groupDesc
    });
    setGroupName('');
    setGroupDesc('');
    setShowGroupForm(false);
    fetchSocialData();
  };

  const handleLike = async (post) => {
    await supabase.from('posts').update({ likes_count: (post.likes_count || 0) + 1 }).eq('id', post.id);
    fetchSocialData();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-[#10101e] p-1 rounded-2xl border border-amber-500/20">
        <button onClick={() => setSubTab('feed')} className={`flex-1 py-2 rounded-xl text-xs font-extrabold ${subTab === 'feed' ? 'zenith-gold' : 'text-slate-400'}`}>Global Feed</button>
        <button onClick={() => setSubTab('groups')} className={`flex-1 py-2 rounded-xl text-xs font-extrabold ${subTab === 'groups' ? 'zenith-gold' : 'text-slate-400'}`}>Groups & Pages</button>
      </div>

      {subTab === 'feed' && (
        <>
          <form onSubmit={handleCreatePost} className="zenith-card rounded-2xl p-3.5 space-y-2.5">
            <textarea rows="2" placeholder="Share a status, dating vibe, or upload photo/video..." value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full bg-[#06060c] border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-500" />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-amber-400 font-bold cursor-pointer bg-[#06060c] px-3 py-1.5 rounded-xl border border-amber-500/30">
                <ImageIcon className="w-3.5 h-3.5" /> {file ? file.name.slice(0, 14) : 'Photo / Video'}
                <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
              </label>
              <button disabled={posting} type="submit" className="zenith-gold px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1">
                <Send className="w-3.5 h-3.5" /> {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {posts.length === 0 && <p className="text-center text-xs text-slate-400 py-6">No posts yet—be the first to post on Zenith Live!</p>}
            {posts.map((p) => (
              <div key={p.id} className="zenith-card rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs flex items-center gap-1">{p.author_name} {p.is_vip && <Crown className="w-3.5 h-3.5 text-amber-400" />}</p>
                    <p className="text-[10px] text-slate-400">{p.author_country}</p>
                  </div>
                </div>
                {p.caption && <p className="text-xs text-slate-200">{p.caption}</p>}
                {p.media_url && p.media_type === 'image' && <img src={p.media_url} alt="Post" className="w-full max-h-64 object-cover rounded-xl" />}
                {p.media_url && p.media_type === 'video' && <video src={p.media_url} controls className="w-full max-h-64 rounded-xl" />}
                <button onClick={() => handleLike(p)} className="flex items-center gap-1 text-xs text-rose-400 font-bold pt-1">
                  <Heart className="w-4 h-4" /> {p.likes_count || 0} Likes
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {subTab === 'groups' && (
        <div className="space-y-3">
          <button onClick={() => requireVip(() => setShowGroupForm(!showGroupForm))} className="w-full zenith-royal py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1">
            <Plus className="w-4 h-4" /> Create New Group or Page (VIP)
          </button>

          {showGroupForm && (
            <form onSubmit={handleCreateGroup} className="zenith-card rounded-2xl p-3.5 space-y-2.5">
              <input required placeholder="Group / Page Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2 text-xs" />
              <select value={groupCat} onChange={(e) => setGroupCat(e.target.value)} className="w-full bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2 text-xs">
                <option>Global Dating</option>
                <option>Live Party & Games</option>
                <option>VIP Creators Page</option>
                <option>After-Dark 18+ Club</option>
              </select>
              <input required placeholder="Short Description" value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} className="w-full bg-[#06060c] border border-slate-700 rounded-xl px-3 py-2 text-xs" />
              <button type="submit" className="w-full zenith-gold py-2 rounded-xl text-xs font-extrabold">Launch Group / Page</button>
            </form>
          )}

          {groups.map((g) => (
            <div key={g.id} className="zenith-card rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-bold">{g.category}</span>
                <h4 className="font-bold text-sm">{g.name}</h4>
                <p className="text-xs text-slate-400">{g.description}</p>
              </div>
              <button onClick={() => requireVip(() => alert(`Joined ${g.name}!`))} className="zenith-gold px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Join
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
