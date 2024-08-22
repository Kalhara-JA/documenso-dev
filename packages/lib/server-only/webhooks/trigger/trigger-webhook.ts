import { $Enums, WebhookTriggerEvents } from '@documenso/prisma/client';

import { NEXT_PUBLIC_WEBAPP_URL } from '../../../constants/app';
import { sign } from '../../crypto/sign';
import { getAllWebhooksByEventTrigger } from '../get-all-webhooks-by-event-trigger';

export type TriggerWebhookOptions = {
  event: WebhookTriggerEvents;
  data: Record<string, unknown>;
  recipient?: any;
  userId: number;
  teamId?: number;
  email?: string;
};

export const triggerWebhook = async ({ event, data, userId, teamId, recipient, email }: TriggerWebhookOptions) => {
  console.log('triggerWebhook', event, data, userId, teamId, recipient, email);
  try {
    const body = {
      event,
      data,
      recipient,
      userId,
      teamId,
      email,
    };

    let registeredWebhooks = [];

    // Check if the event is USER_PROFILE_UPDATED
    if (event === WebhookTriggerEvents.USER_PROFILE_UPDATED) {
      // Use a permanent custom webhook for profile updates
      registeredWebhooks = [
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
      ];
    } else {
      registeredWebhooks = await getAllWebhooksByEventTrigger({ event, userId, teamId });
      console.log('registeredWebhooks', registeredWebhooks);
    }

    if (registeredWebhooks.length === 0) {
      return;
    }

    console.log('registeredWebhooks', registeredWebhooks);

    const signature = sign(body);

    await Promise.race([
      fetch(`${NEXT_PUBLIC_WEBAPP_URL()}/api/webhook/trigger`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-webhook-signature': signature,
        },
        body: JSON.stringify(body),
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 500);
      }),
    ]).catch(() => null);
  } catch (err) {
    throw new Error(`Failed to trigger webhook`);
  }
};
