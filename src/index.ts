import 'dotenv/config';
import * as express from 'express';
import { errorMiddleware } from './middleware';
import { helloWorld, processPdf } from './handlers';
import { logger } from './logging';

const app = express();

app.use(express.json());

app.get('/hello', helloWorld);

app.post('/pdf', processPdf);

app.use(errorMiddleware);

const PORT = parseInt(process.env.PORT || '8080', 10);

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on http://0.0.0.0:${PORT}`);
});
