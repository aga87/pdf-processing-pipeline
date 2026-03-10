import { Request, Response } from 'express';
import { pdfProcessingTaskEnqueuer } from '../startup/container';

export const enqueuePdfsToProcess = async (req: Request, res: Response) => {
  await pdfProcessingTaskEnqueuer.enqueuePdfs();
  return res.status(204).send();
};
