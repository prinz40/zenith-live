import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = ['https://', 'aknvlgtwdweqeuzrcbaky', '.supabase.co'].join('');
const supabaseKey = 'sb_publishable_tPNk6pueT2uirRnxouZjfw_k_iXco2w';

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, email, password, fullName, age, country, bio } = body;

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email and password are required.' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      }

      if (data?.user) {
        const { error: profErr } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName?.trim() || 'Zenith Member',
          age: parseInt(age) || 21,
          country: country || 'Nigeria',
          bio: bio?.trim() || 'Ready to connect, play & go live on Zenith!',
          coins: 50,
          is_online: true,
        });

        if (profErr) {
          return NextResponse.json({ ok: false, error: profErr.message }, { status: 400 });
        }
      }

      return NextResponse.json({ ok: true, session: data.session, user: data.user });
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true, session: data.session, user: data.user });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
