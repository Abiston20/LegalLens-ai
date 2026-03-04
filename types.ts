
export enum Role {
  USER = 'user',
  AI = 'ai'
}

export enum UserType {
  ADVOCATE = 'advocate',
  CITIZEN = 'citizen'
}

export enum Language {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  KANNADA = 'Kannada',
  MALAYALAM = 'Malayalam',
  TAMIL = 'Tamil',
  BENGALI = 'Bengali',
  MARATHI = 'Marathi'
}

export enum Jurisdiction {
  UNION = 'Union of India',
  MAHARASHTRA = 'Maharashtra',
  DELHI = 'Delhi',
  TAMIL_NADU = 'Tamil Nadu',
  KARNATAKA = 'Karnataka'
}

export interface UserProfile {
  id: string;
  user_id?: string;
  identifier: string; // email
  token: string;
  name?: string;
  userType: UserType;
  barId?: string;
  photoUrl?: string; // Added for profile photo support
  preferences?: {
    language: Language;
    jurisdiction: Jurisdiction;
  };
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  attachments?: string[];
  groundingLinks?: { title: string; uri: string }[];
  youtubeLinks?: { title: string; url: string }[];
  reasoning?: string;
}

export enum AppTab {
  CHAT = 'chat',
  DOCUMENT = 'document',
  MY_DOCUMENTS = 'my_documents',
  DRAFTS = 'drafts',
  RESOURCES = 'resources',
  ADVOCATE_TOOLS = 'advocate_tools',
  PROFILE = 'profile'
}

export interface UserDocument {
  id: string;
  name: string;
  uploadDate: string;
  analysis: string;
}

export interface LegalDraft {
  id: string;
  type: string;
  content: string;
  timestamp: string;
}

export interface LegalAnalysis {
  sections: string[];
  risks: string[];
  obligations: string[];
  summary: string;
}
