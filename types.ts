
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
  identifier: string; // email
  token: string;
  name?: string;
  userType: UserType;
  barId?: string;
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
  reasoning?: string; // For Explainable AI (XAI)
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

export interface LegalAnalysis {
  sections: string[];
  risks: string[];
  obligations: string[];
  summary: string;
}
