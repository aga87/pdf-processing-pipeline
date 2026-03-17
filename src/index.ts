import 'dotenv/config';
import * as express from 'express';
import { errorMiddleware } from './middleware';
import { enqueuePdfsToProcess, helloWorld, processPdf } from './handlers';
import { logger } from './logging';

const app = express();

app.use(express.json());

app.get('/hello', helloWorld);

app.post('/process-pdf', processPdf);

app.post('/pdf-processing-tasks', enqueuePdfsToProcess);

app.post('/cron/pdf-processing-tasks', async (req, res) => {
  logger.info('Cron trigger received: enqueue PDF processing tasks');
  await enqueuePdfsToProcess(req, res);
});

app.use(errorMiddleware);

const PORT = parseInt(process.env.PORT || '8080', 10);

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on http://0.0.0.0:${PORT}`);
});
