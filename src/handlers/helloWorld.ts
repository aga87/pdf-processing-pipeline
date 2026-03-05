import { Request, Response } from 'express';

export const helloWorld = async (req: Request, res: Response) => {
  res.json({ message: 'Hello world' });
};
