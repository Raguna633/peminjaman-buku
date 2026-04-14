import db from '../models/index.js';

async function sync() {
  try {
    console.log('🔄 Starting database synchronization...');
    await db.sequelize.authenticate();
    console.log('✅ Connection established.');
    
    await db.sequelize.sync({ alter: true });
    console.log('✅ Database models synced successfully with { alter: true }.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

sync();
