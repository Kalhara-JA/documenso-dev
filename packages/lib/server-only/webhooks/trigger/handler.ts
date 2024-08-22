import type { NextApiRequest, NextApiResponse } from 'next';

import { verify } from '../../crypto/verify';
import { getAllWebhooksByEventTrigger } from '../get-all-webhooks-by-event-trigger';
import { executeWebhook } from './execute-webhook';
import { ZTriggerWebhookBodySchema } from './schema';
import { $Enums } from '@documenso/prisma/client';

export type HandlerTriggerWebhooksResponse =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export const handlerTriggerWebhooks = async (
  req: NextApiRequest,
  res: NextApiResponse<HandlerTriggerWebhooksResponse>,
) => {
  const signature = req.headers['x-webhook-signature'];

  if (typeof signature !== 'string') {
    console.log('Missing signature');
    return res.status(400).json({ success: false, error: 'Missing signature' });
  }

  const valid = verify(req.body, signature);

  if (!valid) {
    console.log('Invalid signature');
    return res.status(400).json({ success: false, error: 'Invalid signature' });
  }

  const result = ZTriggerWebhookBodySchema.safeParse(req.body);

  if (!result.success) {
    console.log('Invalid request body');
    return res.status(400).json({ success: false, error: 'Invalid request body' });
  }

  const { event, data, userId, teamId } = result.data;
  console.log('data_webhook', data);

  if (event === 'USER_PROFILE_UPDATED') {
    const allWebhooks = [
      {
        id: "userupdatewebhookid",
        webhookUrl: 'http://162.55.161.102:3003/api/v1/users/update?apiKey=cal_a3a43e15827b938fe978cc79625b3a61',
        eventTriggers: [$Enums.WebhookTriggerEvents.USER_PROFILE_UPDATED],
        secret: null,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId,
        teamId: null,
      },
    ]
    console.log('allWebhooks', allWebhooks);

    await Promise.allSettled(
      allWebhooks.map(async (webhook) =>
        executeWebhook({
          event,
          webhook,
          data,
        }),
      ),
    );

    return res.status(200).json({ success: true, message: 'Webhooks executed successfully' });
  }

  const allWebhooks = await getAllWebhooksByEventTrigger({ event, userId, teamId });
  console.log('allWebhooks', allWebhooks);

  await Promise.allSettled(
    allWebhooks.map(async (webhook) =>
      executeWebhook({
        event,
        webhook,
        data,
      }),
    ),
  );

  return res.status(200).json({ success: true, message: 'Webhooks executed successfully' });
};
