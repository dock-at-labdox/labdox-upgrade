export type SessionResponse = {
  sessionId: string;
  expiresAt: string;
};

export type ApiErrorResponse = {
  error: string;
};

export type SessionState = {
  pill: string;
  audienceDerived: string | null;
  conversionState: string;
};

export type SessionStateResponse = SessionState & {
  sessionId: string;
  expiresAt: string;
};
