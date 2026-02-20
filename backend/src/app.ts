import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', /https:\/\/.*\.vercel\.app$/],
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

import apiRoutes from './routes';
app.use('/api', apiRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to ClearBill API', status: 'OK' });
});

export default app;
