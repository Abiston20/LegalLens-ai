
import { UserType, Role, Language } from '../types';

/**
 * LEGALLENS CLIENT-SIDE BACKEND EMULATOR
 * This service replaces the need for a local Python server.
 * It uses localStorage to simulate persistence and handle all "backend" logic.
 */

const STORAGE_KEYS = {
  USERS: 'legallens_users',
  CHATS: 'legallens_chats',
  DOCS: 'legallens_docs',
  REGISTRATIONS: 'legallens_temp_regs',
  SESSIONS: 'legallens_temp_sessions'
};

// Helper to get/set from localStorage
const db = {
  get: (key: string) => JSON.parse(localStorage.getItem(key) || '[]'),
  save: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
  find: (key: string, predicate: (item: any) => boolean) => db.get(key).find(predicate),
  update: (key: string, item: any, idKey: string = 'id') => {
    const items = db.get(key);
    const index = items.findIndex((i: any) => i[idKey] === item[idKey]);
    if (index > -1) items[index] = item;
    else items.push(item);
    db.save(key, items);
  }
};

/**
 * Mock Mail Transport Service
 * Simulates sending an encrypted email with localized content
 */
const sendMockEmail = async (email: string, subject: string, otp: string, language: Language = Language.ENGLISH) => {
  console.log(`%c[MAIL TRANSPORT] Sending to ${email}...`, 'color: #6366f1; font-weight: bold;');
  console.log(`%c[SUBJECT] ${subject}`, 'color: #6366f1;');
  console.log(`%c[BODY] Your OTP is: ${otp}`, 'color: #f59e0b; font-size: 1.2em; font-weight: bold;');
  
  // Simulate network delay for mail server handshake
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, otp };
};

export async function apiRequest(endpoint: string, options: any = {}) {
  // Base network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  const body = options.body ? JSON.parse(options.body) : {};
  const sessionStr = localStorage.getItem('legallens_session');
  const currentUser = sessionStr ? JSON.parse(sessionStr) : null;
  const preferredLang = currentUser?.preferences?.language || Language.ENGLISH;

  switch (endpoint) {
    case '/ping':
      return { status: 'ok', timestamp: new Date().toISOString() };

    case '/auth/register':
      const regs = db.get(STORAGE_KEYS.REGISTRATIONS);
      const regOtp = Math.floor(100000 + Math.random() * 900000).toString();
      db.update(STORAGE_KEYS.REGISTRATIONS, { 
        email: body.email, 
        name: body.name, 
        user_type: body.user_type, 
        bar_id: body.bar_id, 
        otp: regOtp 
      }, 'email');
      
      await sendMockEmail(body.email, "Welcome to LegalLens - Verify your account", regOtp, preferredLang);
      return { status: 'success', demo_otp: regOtp };

    case '/auth/send-otp':
      const userExists = db.find(STORAGE_KEYS.USERS, u => u.email === body.identifier);
      if (!userExists) throw new Error("Account not found. Please register first.");
      
      const loginOtp = Math.floor(100000 + Math.random() * 900000).toString();
      db.update(STORAGE_KEYS.SESSIONS, { email: body.identifier, otp: loginOtp }, 'email');
      
      await sendMockEmail(body.identifier, "Security Code for LegalLens Access", loginOtp, preferredLang);
      return { status: 'success', demo_otp: loginOtp };

    case '/auth/change-password-init':
      if (!currentUser) throw new Error("Unauthorized");
      const changeOtp = Math.floor(100000 + Math.random() * 900000).toString();
      db.update(STORAGE_KEYS.SESSIONS, { email: currentUser.identifier, otp: changeOtp }, 'email');
      
      await sendMockEmail(currentUser.identifier, "Action Required: Password Change Request", changeOtp, preferredLang);
      return { status: 'success', demo_otp: changeOtp };

    case '/auth/verify-otp':
      const regMatch = db.find(STORAGE_KEYS.REGISTRATIONS, r => r.email === body.identifier && r.otp === body.otp);
      const sesMatch = db.find(STORAGE_KEYS.SESSIONS, s => s.email === body.identifier && s.otp === body.otp);

      if (!regMatch && !sesMatch) throw new Error("Invalid or expired OTP. Please check your mail again.");

      let targetUser;
      if (regMatch) {
        targetUser = {
          user_id: 'user_' + Math.random().toString(36).substr(2, 9),
          email: regMatch.email,
          name: regMatch.name,
          role: regMatch.user_type === 'advocate' ? 'lawyer' : 'user',
          bar_id: regMatch.bar_id
        };
        db.update(STORAGE_KEYS.USERS, targetUser, 'user_id');
        const allRegs = db.get(STORAGE_KEYS.REGISTRATIONS).filter((r: any) => r.email !== body.identifier);
        db.save(STORAGE_KEYS.REGISTRATIONS, allRegs);
      } else {
        targetUser = db.find(STORAGE_KEYS.USERS, u => u.email === body.identifier);
      }

      return {
        access_token: 'mock_jwt_' + Date.now(),
        user_id: targetUser.user_id,
        name: targetUser.name,
        user_type: targetUser.role === 'lawyer' ? UserType.ADVOCATE : UserType.CITIZEN,
        bar_id: targetUser.bar_id
      };

    case '/legal/chat':
      if (options.method === 'POST') {
        const chats = db.get(STORAGE_KEYS.CHATS);
        const newQuery = {
          id: 'q_' + Date.now(),
          user_id: currentUser?.id,
          role: Role.USER,
          content: body.query_text,
          timestamp: new Date().toISOString()
        };
        const newResponse = {
          id: 'r_' + (Date.now() + 1),
          user_id: currentUser?.id,
          role: Role.AI,
          content: body.response_text,
          timestamp: new Date().toISOString()
        };
        db.save(STORAGE_KEYS.CHATS, [...chats, newQuery, newResponse]);
        return { status: 'success' };
      } else {
        return db.get(STORAGE_KEYS.CHATS).filter((c: any) => c.user_id === currentUser?.id);
      }

    case '/legal/log-document':
      const docs = db.get(STORAGE_KEYS.DOCS);
      db.save(STORAGE_KEYS.DOCS, [...docs, {
        id: 'doc_' + Date.now(),
        user_id: currentUser?.id,
        name: body.name,
        analysis: body.analysis,
        uploadDate: new Date().toISOString()
      }]);
      return { status: 'success' };

    case '/legal/my-documents':
      return db.get(STORAGE_KEYS.DOCS).filter((d: any) => d.user_id === currentUser?.id);

    default:
      if (endpoint.includes('/legal/advocate/')) {
         return [];
      }
      throw new Error(`Endpoint ${endpoint} not implemented in Mock Backend`);
  }
}
