import { PrismaClient } from '@prisma/client';
import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { config } from './config.js';

export const prisma = new PrismaClient();
export const redis = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });
export const campaignQueue = new Queue('campaign-send', { connection: redis });
