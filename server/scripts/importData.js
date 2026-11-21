import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import SalonConfig from '../models/SalonConfig.js';
import Service from '../models/Service.js';
import Barber from '../models/Barber.js';
import QueueToken from '../models/QueueToken.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../mongodb-data');

// Convert MongoDB Extended JSON ($oid, $date) to native JavaScript/Mongoose objects
function parseExtendedJson(raw) {
  return JSON.parse(raw, (key, value) => {
    if (value && typeof value === 'object') {
      if ('$oid' in value) return new mongoose.Types.ObjectId(value.$oid);
      if ('$date' in value) return new Date(value.$date);
    }
    return value;
  });
}

const importCollections = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/salon-queue';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    // 1. Salon Config
    const configRaw = fs.readFileSync(path.join(dataDir, 'salonconfigs.json'), 'utf-8');
    const configs = parseExtendedJson(configRaw);
    await SalonConfig.deleteMany({});
    await SalonConfig.insertMany(configs);
    console.log(`[Imported] ${configs.length} SalonConfig record(s).`);

    // 2. Services
    const servicesRaw = fs.readFileSync(path.join(dataDir, 'services.json'), 'utf-8');
    const services = parseExtendedJson(servicesRaw);
    await Service.deleteMany({});
    await Service.insertMany(services);
    console.log(`[Imported] ${services.length} Service(s).`);

    // 3. Barbers
    const barbersRaw = fs.readFileSync(path.join(dataDir, 'barbers.json'), 'utf-8');
    const barbers = parseExtendedJson(barbersRaw);
    await Barber.deleteMany({});
    await Barber.insertMany(barbers);
    console.log(`[Imported] ${barbers.length} Barber(s).`);

    // 4. Queue Tokens
    const tokensRaw = fs.readFileSync(path.join(dataDir, 'queuetokens.json'), 'utf-8');
    const tokens = parseExtendedJson(tokensRaw);
    await QueueToken.deleteMany({});
    await QueueToken.insertMany(tokens);
    console.log(`[Imported] ${tokens.length} QueueToken(s).`);

    console.log('\nData import finished! Real-world MongoDB collections are loaded.');
    process.exit(0);
  } catch (error) {
    console.error('Data import failed:', error);
    process.exit(1);
  }
};

importCollections();
