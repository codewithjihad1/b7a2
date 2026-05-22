import CookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Application, type Request, type Response } from 'express';
import globalErrorHandler from './middleware/globalErrorHandler';
import logger from './middleware/logger';
import { authRoute } from './modules/auth';
const app: Application = express();

app.use(CookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use(
    cors({
        origin: 'http://localhost:3000',
    }),
);

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Express Server',
        author: 'Next Level',
    });
});

app.use('/api/auth', authRoute);

// Global Error Handling Middleware
app.use(globalErrorHandler);

export default app;
