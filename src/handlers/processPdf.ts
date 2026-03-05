import { Request, Response } from 'express';
import { pdfProcessingService } from '../startup/container';

export const processPdf = async (req: Request, res: Response) => {
  const { fileName } = req.body;

  // Basic validation
  if (typeof fileName !== 'string' || fileName.trim().length === 0) {
    return res.status(400).json({
      error: 'fileName must be a non-empty string',
    });
  }

  if (!fileName.toLowerCase().endsWith('.pdf')) {
    return res.status(400).json({
      error: 'fileName must be a .pdf file',
    });
  }

  await pdfProcessingService.processPdf('sample_document.pdf');
  return res.status(204).send();
};
