export interface Pair {
  giver: string;
  receiver: string;
}

export interface SessionModel {
  name: string;
  createdAt: string; // ISO-8601
  pairs: string;     // JSON-encoded Pair[]
  participants: string[];
}
