import "express";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
