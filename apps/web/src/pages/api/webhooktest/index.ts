import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {

  const data = await req.body;
  // const signature = req.headers['x-webhook-signature'];

  // if (typeof signature !== 'string') {
  //   console.log('Missing signature');
  //   return res.status(400).json({ success: false, error: 'Missing signature' });
  // }

  // const valid = verify(req.body, signature);

  // if (!valid) {
  //   console.log('Invalid signature');
  //   return res.status(400).json({ success: false, error: 'Invalid signature' });
  // }

  // const result = ZTriggerWebhookBodySchema.safeParse(req.body);

  // if (!result.success) {
  //   console.log('Invalid request body');
  //   return res.status(400).json({ success: false, error: 'Invalid request body' });
  // }

  // const { event, data, userId, teamId } = result.data;

  // const allWebhooks = await getAllWebhooksByEventTrigger({ event, userId, teamId });
 
  // await Promise.allSettled(
  //   allWebhooks.map(async (webhook) =>
  //     executeWebhook({
  //       event,
  //       webhook,
  //       data,
  //     }),
  //   ),
  // );
  console.log('data_webhook', data);
  console.log('Webhooks executed successfully');

  return res.status(200).json({ success: true, message: 'Webhooks executed successfully' });
}

export default handler;
