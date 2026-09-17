import { Worker } from 'bullmq';
import { prisma, redis } from './lib.js';

const worker = new Worker('campaign-send', async job => {
  const campaign = await prisma.campaign.findUnique({ where: { id: job.data.campaignId }, include: { recipients: { include: { contact: true } } } });
  if (!campaign) throw new Error('Campaign not found');
  await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'SENDING' } });
  // إرسال Meta الفعلي سيُضاف بعد ربط بيانات حساب العميل وقوالبه المعتمدة.
  return { campaignId: campaign.id, eligibleRecipients: campaign.recipients.filter(item => item.contact.optedInAt).length };
}, { connection: redis, concurrency: 5 });

worker.on('completed', async job => {
  await prisma.campaign.update({ where: { id: job.data.campaignId }, data: { status: 'COMPLETED' } });
});
worker.on('failed', async (job, error) => {
  console.error('Campaign job failed', job?.id, error);
  if (job?.data?.campaignId) await prisma.campaign.update({ where: { id: job.data.campaignId }, data: { status: 'FAILED' } });
});
