import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { vehicleRoutes } from './routes/vehicles';
import { serviceRoutes } from './routes/services';
import { inventoryRoutes } from './routes/inventory';
import { receiptRoutes } from './routes/receipts';
import { reminderRoutes } from './routes/reminders';
import { settingsRoutes } from './routes/settings';
import { backupRoutes } from './routes/backups';
import { exportRoutes } from './routes/exports';
import { initDirectories } from './utils/storage';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(config.uploadDir));

// API routes
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/exports', exportRoutes);

// Serve client build in production
if (config.nodeEnv === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

async function start() {
  await initDirectories();
  
  app.listen(config.port, () => {
    console.log(`Dipstick server running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
