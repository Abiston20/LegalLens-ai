
import { UserType, Role, Language } from '../types';

/**
 * LEGALLENS PERMANENT DATABASE INTEGRATION (SUPABASE)
 * Endpoint: https://jtdpfphlseitoinlovoo.supabase.co
 * Key: sb_publishable_SrWLN-xXmmBUrgarL3fBKg_TA3ynFDO
 */

const SUPABASE_URL = 'https://jtdpfphlseitoinlovoo.supabase.co';
const SUPABASE_ANON_KEY = 'aseyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0ZHBmcGhsc2VpdG9pbmxvdm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDczMjMsImV4cCI6MjA4NTQyMzMyM30.8D-hgQBt9SlvxLhhLLWkTn52XPPOLFxJ07iyh7A8ImY';

const getHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
  'Prefer': 'return=representation'
});

const logEvent = (msg: string) => {
  console.log(`%c[LegalLens Cloud] ${msg}`, 'color: #6366f1; font-weight: bold;');
};

export async function apiRequest(endpoint: string, options: any = {}) {
  const sessionStr = localStorage.getItem('legallens_session');
  const currentUser = sessionStr ? JSON.parse(sessionStr) : null;
  const token = currentUser?.token;

  /**
   * PERMANENT AUTHENTICATION LOGIC
   */
  if (endpoint === '/auth/register') {
    const body = JSON.parse(options.body);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create the permanent user record immediately (verified=false)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        email: body.email,
        name: body.name,
        role: body.user_type === 'advocate' ? 'lawyer' : 'user',
        bar_id: body.bar_id,
        otp_secret: otp,
        is_verified: false 
      })
    });

    if (!res.ok) {
      const err = await res.json();
      if (err.code === '23505') throw new Error("This email is already registered.");
      throw new Error("Failed to create permanent registration record.");
    }
    
    logEvent(`Access code ${otp} generated for new user ${body.email}`);
    return { status: 'success', demo_otp: otp };
  }

  if (endpoint === '/auth/send-otp') {
    const body = JSON.parse(options.body);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update the existing user's OTP secret
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(body.identifier)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ otp_secret: otp })
    });

    if (!res.ok) throw new Error("Identity server unreachable.");
    
    // Check if user actually exists
    const check = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(body.identifier)}`, {
      headers: getHeaders()
    });
    const users = await check.json();
    if (!users.length) throw new Error("No permanent record found for this identifier.");

    logEvent(`Access code ${otp} generated for ${body.identifier}`);
    return { status: 'success', demo_otp: otp };
  }

  if (endpoint === '/auth/verify-otp') {
    const body = JSON.parse(options.body);
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(body.identifier)}&otp_secret=eq.${body.otp}`, {
      headers: getHeaders()
    });
    const users = await res.json();

    if (!users.length) throw new Error("Authorization credentials invalid.");

    const user = users[0];
    
    // Finalize verification status
    if (!user.is_verified) {
      await fetch(`${SUPABASE_URL}/rest/v1/users?user_id=eq.${user.user_id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ is_verified: true, otp_secret: null })
      });
    }

    return {
      access_token: SUPABASE_ANON_KEY,
      user_id: user.user_id,
      name: user.name,
      user_type: user.role === 'lawyer' ? UserType.ADVOCATE : UserType.CITIZEN,
      bar_id: user.bar_id
    };
  }

  /**
   * DATA PERSISTENCE LOGIC
   */
  if (endpoint === '/legal/chat') {
    const uid = currentUser?.id || currentUser?.user_id;
    if (options.method === 'POST') {
      const body = JSON.parse(options.body);
      
      // Save Query permanently
      const qRes = await fetch(`${SUPABASE_URL}/rest/v1/legal_queries`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ user_id: uid, query_text: body.query_text })
      });
      const queries = await qRes.json();
      
      // Save AI Response linked to query
      if (queries && queries.length) {
        await fetch(`${SUPABASE_URL}/rest/v1/ai_responses`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ 
            query_id: queries[0].query_id, 
            response_text: body.response_text 
          })
        });
      }
      return { status: 'success' };
    }
    
    // Fetch from cloud
    const historyRes = await fetch(`${SUPABASE_URL}/rest/v1/legal_queries?user_id=eq.${uid}&select=*,ai_responses(*)&order=created_at.asc`, {
      headers: getHeaders()
    });
    const rawHistory = await historyRes.json();
    const flattened = [];
    for (const q of rawHistory) {
      flattened.push({ id: q.query_id, role: Role.USER, content: q.query_text, timestamp: q.created_at });
      if (q.ai_responses && q.ai_responses.length) {
        flattened.push({ id: q.ai_responses[0].response_id, role: Role.AI, content: q.ai_responses[0].response_text, timestamp: q.ai_responses[0].created_at });
      }
    }
    return flattened;
  }

  if (endpoint === '/legal/log-document') {
    const uid = currentUser?.id || currentUser?.user_id;
    const body = JSON.parse(options.body);
    await fetch(`${SUPABASE_URL}/rest/v1/user_documents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        user_id: uid,
        name: body.name,
        analysis: body.analysis
      })
    });
    return { status: 'success' };
  }

  if (endpoint === '/legal/my-documents') {
    const uid = currentUser?.id || currentUser?.user_id;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_documents?user_id=eq.${uid}&order=upload_date.desc`, {
      headers: getHeaders()
    });
    const data = await res.json();
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      uploadDate: d.upload_date,
      analysis: d.analysis
    }));
  }

  if (endpoint.includes('/legal/advocate/client-documents')) {
    const params = new URLSearchParams(endpoint.split('?')[1]);
    const clientName = params.get('client_name');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/client_documents?client_name=eq.${encodeURIComponent(clientName || '')}&order=upload_date.desc`, {
      headers: getHeaders()
    });
    return await res.json();
  }

  if (endpoint === '/legal/advocate/client-document' && options.method === 'POST') {
    const body = JSON.parse(options.body);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/client_documents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        client_name: body.client_name,
        matter: body.matter,
        file_name: body.file_name,
        content_base64: body.content_base64
      })
    });
    return await res.json();
  }

  return [];
}
