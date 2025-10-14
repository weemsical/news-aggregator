import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { newsRouter } from './routes/news';
import { startNewsScheduler } from './services/scheduler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/news', newsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`News Aggregator Backend running on port ${PORT}`);
  
  // Start the news scraping scheduler
  startNewsScheduler();
});

export default app;