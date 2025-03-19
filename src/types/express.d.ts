import * as express from 'express';

declare module 'express' {
  interface RequestHandler {
    (req: Request, res: Response, next: NextFunction): any;
  }
}
