import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { config } from './config.js';
import { campaignQueue, prisma, redis } from './lib.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.APP_ORIGIN }));
app.use('/webhooks/meta', express.raw({ type: 'application/json', limit: '2mb' }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (_req, res) => {
  const checks = await Promise.allSettled([prisma.$queryRaw`SELECT 1`, redis.ping()]);
  const ready = checks.every(item => item.status === 'fulfilled');
  res.status(ready ? 200 : 503).json({ service: 'tugx-api', status: ready ? 'ok' : 'degraded' });
});

app.get('/webhooks/meta', (req, res) => {
  if (!config.META_VERIFY_TOKEN) return res.status(503).json({ error: 'META_NOT_CONFIGURED' });
  const valid = req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === config.META_VERIFY_TOKEN;
  if (!valid) return res.sendStatus(403);
  res.status(200).send(req.query['hub.challenge']);
});

app.post('/webhooks/meta', async (req, res) => {
  if (!config.META_APP_SECRET) return res.status(503).json({ error: 'META_NOT_CONFIGURED' });
  const signature = req.get('x-hub-signature-256') || '';
  const expected = 'sha256=' + crypto.createHmac('sha256', config.META_APP_SECRET).update(req.body).digest('hex');
  const valid = signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return res.sendStatus(401);
  const payload = JSON.parse(req.body.toString('utf8'));
  const eventId = crypto.createHash('sha256').update(req.body).digest('hex');
  await prisma.webhookEvent.upsert({ where: { id: eventId }, update: {}, create: { id: eventId, payload } });
  res.sendStatus(200);
});

const contactInput = z.object({
  workspaceId: z.string().min(1), name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/), tags: z.array(z.string()).default([]),
  optedInAt: z.coerce.date().nullable().optional(), optInSource: z.string().max(100).nullable().optional()
});

const leadInput = z.object({
  name: z.string().min(2).max(80), business: z.string().min(2).max(120),
  phone: z.string().regex(/^[+0-9 ]{8,18}$/), plan: z.enum(['start', 'growth', 'business']),
  need: z.string().max(500).optional().default('')
});

app.get('/api/plans', async (_req, res) => {
  const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { monthlyPrice: 'asc' } });
  res.json({ data: plans });
});

app.post('/api/leads', async (req, res) => {
  const parsed = leadInput.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  const lead = await prisma.lead.create({ data: { name: parsed.data.name, businessName: parsed.data.business, phone: parsed.data.phone, planKey: parsed.data.plan, need: parsed.data.need } });
  res.status(201).json({ data: { id: lead.id, status: lead.status } });
});

function requireAdmin(req, res, next) {
  const supplied = req.get('x-admin-key') || '';
  const expected = config.ADMIN_API_KEY;
  const valid = supplied.length === expected.length && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  if (!valid) return res.status(401).json({ error: 'UNAUTHORIZED' });
  next();
}

app.get('/api/admin/leads', requireAdmin, async (_req, res) => {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  res.json({ data: leads });
});

app.patch('/api/admin/leads/:leadId', requireAdmin, async (req, res) => {
  const status = z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST']).safeParse(req.body.status);
  if (!status.success) return res.status(422).json({ error: 'INVALID_STATUS' });
  const lead = await prisma.lead.update({ where: { id: req.params.leadId }, data: { status: status.data } });
  res.json({ data: lead });
});

app.get('/api/workspaces/:workspaceId/contacts', async (req, res) => {
  const contacts = await prisma.contact.findMany({ where: { workspaceId: req.params.workspaceId }, orderBy: { updatedAt: 'desc' } });
  res.json({ data: contacts });
});

app.post('/api/contacts', async (req, res) => {
  const parsed = contactInput.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  const contact = await prisma.contact.create({ data: parsed.data });
  res.status(201).json({ data: contact });
});

app.post('/api/campaigns/:campaignId/queue', async (req, res) => {
  const campaign = await prisma.campaign.findUnique({ where: { id: req.params.campaignId }, include: { recipients: true } });
  if (!campaign) return res.status(404).json({ error: 'CAMPAIGN_NOT_FOUND' });
  await campaignQueue.add('send-campaign', { campaignId: campaign.id }, { jobId: campaign.id, attempts: 5, backoff: { type: 'exponential', delay: 5000 } });
  await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'SCHEDULED' } });
  res.status(202).json({ data: { campaignId: campaign.id, queued: true } });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'INTERNAL_ERROR' });
});

app.listen(config.PORT, () => console.log(`Tugx API listening on :${config.PORT}`));
