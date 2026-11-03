import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    // The household whose budget data this session reads and writes.
    householdId?: number;
  }
}
