import { Request, Response } from 'express';
import { pdfProcessingService } from '../startup/container';

export const processPdf = async (req: Request, res: Response) => {
  const { fileId } = req.body;

  // Basic validation
  if (typeof fileId !== 'string' || fileId.trim().length === 0) {
    return res.status(400).json({
      error: 'fileId must be a non-empty string',
    });
  }

  await pdfProcessingService.processPdf(fileId);
  return res.status(204).send();
};
