import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export interface AuthenticatedRequest extends Express.Request {
  session: Express.Session & {
    userId?: number;
  };
  body: any;
}