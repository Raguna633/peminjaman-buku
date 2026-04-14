'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
const envConfig = {
  username: process.env.DB_USER || config.username,
  password:
    process.env.DB_PASSWORD === undefined
      ? config.password
      : process.env.DB_PASSWORD === 'null'
        ? null
        : process.env.DB_PASSWORD,
  database: process.env.DB_NAME || config.database,
  host: process.env.DB_HOST || config.host,
  dialect: process.env.DB_DIALECT || config.dialect,
};
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    envConfig.database,
    envConfig.username,
    envConfig.password,
    { ...config, ...envConfig }
  );
}

async function loadModels() {
  const files = fs
    .readdirSync(__dirname)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1
      );
    });

  for (const file of files) {
    const modulePath = path.join(__dirname, file);
    const moduleUrl = `file://${modulePath.replace(/\\/g, '/')}`;
    const module = await import(moduleUrl);
    const model = module.default(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  }

  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;
  
  return db;
}

export default await loadModels();
