# Tugx Backend — المرحلة B

أساس API حقيقي وقابل للنشر، وليس بديلًا وهميًا عن ربط Meta.

## التشغيل المحلي

1. انسخ `.env.example` إلى `.env` وأضف بيانات PostgreSQL وRedis وMeta.
2. شغّل `npm install`.
3. شغّل `npm run prisma:generate` ثم `npx prisma migrate dev --name init`.
4. شغّل `npm run dev`، وفي نافذة أخرى `npm run worker`.

## نقاط الربط الحالية

- `GET /health` لفحص PostgreSQL وRedis.
- `GET /webhooks/meta` لتأكيد Webhook.
- `POST /webhooks/meta` يستقبل فقط الطلبات ذات توقيع Meta الصحيح ويحفظ الحدث دون تكرار.
- `GET /api/plans` يعرض الباقات الفعالة و`POST /api/leads` يحفظ طلبات التجربة.
- مسارات `/api/admin/*` محمية بمفتاح الإدارة في الترويسة `x-admin-key` مؤقتًا حتى إضافة تسجيل الدخول الكامل.
- `GET /api/workspaces/:workspaceId/contacts` و`POST /api/contacts` لبداية إدارة العملاء.
- `POST /api/campaigns/:campaignId/queue` يضيف الحملة إلى BullMQ مع إعادة المحاولة.

## قبل النشر

نحتاج قاعدة PostgreSQL، Redis، وحساب Meta Developer مع WhatsApp Business. لا تضع الأسرار في GitHub؛ تُضاف في متغيرات بيئة Render فقط.
