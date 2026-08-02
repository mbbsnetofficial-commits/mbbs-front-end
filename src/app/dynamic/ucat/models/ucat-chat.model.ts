export type UcatChatSender = 'USER' | 'AI';

export interface UcatChatMessage {
  _id?: string;
  messageId: string;
  chatSessionId: string;
  sender: UcatChatSender;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UcatChatSession {
  _id?: string;
  chatSessionId: string;
  userId?: number | string;
  testSessionId: string;
  title: string;
  status: 'ACTIVE' | 'ARCHIVED' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UcatChatSessionsResponse {
  success?: boolean;
  message?: string;
  data: UcatChatSession[];
}

export interface UcatChatSessionSingleResponse {
  success?: boolean;
  message?: string;
  data: UcatChatSession;
}

export interface UcatChatMessagesResponse {
  success?: boolean;
  message?: string;
  data: UcatChatMessage[];
}

export interface UcatCreateChatSessionRequest {
  testSessionId: string;
  title: string;
}

export interface UcatSendMessageRequest {
  content: string;
}

export interface UcatSendMessageData {
  userMessage: UcatChatMessage;
  aiMessage: UcatChatMessage;
}

export interface UcatSendMessageResponse {
  success?: boolean;
  message?: string;
  data: UcatSendMessageData;
}
