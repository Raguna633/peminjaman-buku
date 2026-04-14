import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}`, override: true });
dotenv.config({ path: '.env' });
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import db from './models/index.js';
import { loadSettings } from './utils/settingsCache.js';
import { initSocket } from './socket/index.js';
import { startDailyCleanupJob } from './jobs/dailyCleanup.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

const REQUIRED_ENV = [
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET',
  'CLIENT_URL',
  'PORT',
  'JWT_EXPIRE',
];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

async function startServer() {
  validateEnv();

  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully');

    if (process.env.NODE_ENV === 'development' && process.env.SYNC_DB === 'true') {
      await db.sequelize.sync({ alter: true });
      console.log('✅ Database models synced');
    }
  } catch (err) {
    console.error(`❌ Database connection failed: ${err.message}`);
    process.exit(1);
  }

  await loadSettings();
  console.log('✅ Settings loaded');

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      credentials: true,
      origin: process.env.CLIENT_URL,
    })
  );

  app.get('/', (_req, res) => {
    res.send('OK');
  });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/public', express.static(path.join(__dirname, 'public')));
  app.use('/api', routes);

  const server = http.createServer(app);
  initSocket(server);
  startDailyCleanupJob();

  const port = Number(process.env.PORT);
  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🔌 Socket.IO ready for connections');
  });

  const shutdown = async (signal) => {
    console.log(`⚠️  ${signal} received, shutting down gracefully...`);
    server.close(() => {
      db.sequelize.close().finally(() => process.exit(0));
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
