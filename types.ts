
export enum Role {
  USER = 'user',
  AI = 'ai'
}

export enum UserType {
  ADVOCATE = 'advocate',
  CITIZEN = 'citizen'
}

export interface UserProfile {
  id: string;
  identifier: string; // email
  token: string;
  name?: string;
  userType: UserType;
  barId?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  attachments?: string[];
  groundingLinks?: { title: string; uri: string }[];
}

export enum AppTab {
  CHAT = 'chat',
  DOCUMENT = 'document',
  MY_DOCUMENTS = 'my_documents',
  DRAFTS = 'drafts',
  RESOURCES = 'resources',
  ADVOCATE_TOOLS = 'advocate_tools'
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
