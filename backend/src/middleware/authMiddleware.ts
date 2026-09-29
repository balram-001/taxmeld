import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    [key: string]: any;
  };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      
      // Har case ko handle karne ke liye (id, _id, ya userId)
      const userId = decoded.id || decoded._id || decoded.userId;

      if (!userId) {
        res.status(401).json({ message: 'Not authorized, invalid token payload' });
        return;
      }

      // Safely assign normalized user object
      req.user = {
        ...decoded,
        id: userId.toString(), // Standardized string ID
      };

      next();
      return;
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
    return;
  }
};

// Client portals use a separate, short-lived session created only after the
// client verifies the name, PAN and mobile number recorded by the CA.
export const protectClientPortal = (req: Request, res: Response, next: NextFunction): void => {
  // The CA/staff workspace already carries its normal authenticated session.
  // It may open a client's workflow without going through client verification.
  const bearer = req.headers.authorization;
  if (bearer?.startsWith('Bearer ')) {
    try {
      const decoded: any = jwt.verify(bearer.split(' ')[1], process.env.JWT_SECRET as string);
      if (decoded.id || decoded._id || decoded.userId) { next(); return; }
    } catch {
      // Fall through to the client-portal session check below.
    }
  }
  const accessToken = String(req.headers['x-client-portal-access'] || req.query.access || '');
  try {
    const decoded: any = jwt.verify(accessToken, process.env.JWT_SECRET as string);
    if (decoded.type !== 'client_portal' || decoded.trackingToken !== req.params.token) throw new Error('Invalid portal session');
    next();
  } catch {
    res.status(401).json({ message: 'Please verify your client details to open this secure portal.' });
  }
};
