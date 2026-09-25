import type { Request, Response } from 'express';
import { mcpHandler } from './index.ts';

export default async function handler(req: Request, res: Response) {
  return mcpHandler(req, res);
}
