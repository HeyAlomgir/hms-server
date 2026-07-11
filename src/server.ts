import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// env configaration
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// midleware
app.use(cors());
app.use(express.json());

// basic root
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'CarePulse Backend Setup is Ready! 🚀',
  });
});

// server listen
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});