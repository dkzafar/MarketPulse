import express from 'express';
import analysisRouter from './api/analysis';
import demoEnhancedRouter from './api/demo-enhanced';

const app = express();

// JSON middleware
app.use(express.json());

// Mount routers on /api
app.use('/api', analysisRouter);
app.use('/api', demoEnhancedRouter);

// Port configuration
const port = process.env.PORT || 3000;

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});