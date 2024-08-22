import { prisma } from '@documenso/prisma';
import { UserSecurityAuditLogType, WebhookTriggerEvents } from '@documenso/prisma/client';

import type { RequestMetadata } from '../../universal/extract-request-metadata';
import { triggerWebhook } from '../webhooks/trigger/trigger-webhook';
import { executeWebhook } from '../webhooks/trigger/execute-webhook';
import { updateUserProfileInKeycloak } from './update_user_keycloak';

export type UpdateProfileOptions = {
  userId: number;
  name: string;
  email: string;
  signature: string;
  requestMetadata?: RequestMetadata;
};

export const updateProfile = async ({
  userId,
  name,
  email,
  signature,
  requestMetadata,
}: UpdateProfileOptions) => {
  console.log(`Starting profile update for userId: ${userId}`);

  // Check if the user exists
  const user = await prisma.user.findFirstOrThrow({
    where: { id: userId },
  });
  console.log(`User found: ${user.email}`);

  try {
    // Start a transaction
    return await prisma.$transaction(async (tx) => {
      console.log(`Transaction started for userId: ${userId}`);

      // Log the security event
      await tx.userSecurityAuditLog.create({
        data: {
          userId,
          type: UserSecurityAuditLogType.ACCOUNT_PROFILE_UPDATE,
          userAgent: requestMetadata?.userAgent,
          ipAddress: requestMetadata?.ipAddress,
        },
      });
      console.log(`Security audit log created for userId: ${userId}`);

      // Update the user's profile
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { name, email, signature },
      });
      console.log(`User profile updated in the database for userId: ${userId}`);

      // Update the profile in Keycloak
      await updateUserProfileInKeycloak(user.email, updatedUser.email, updatedUser.name);
      console.log(`User profile updated in Keycloak for userId: ${userId}`);

      // Trigger the webhook
      await triggerWebhook({
        userId,
        event: WebhookTriggerEvents.USER_PROFILE_UPDATED,
        data: {
          name: updatedUser.name,
          email: user.email, // previous email
          new_email: updatedUser.email, // new email
        },
      });
      console.log(`Webhook triggered for user profile update for userId: ${userId}`);

      // Update the recipient email in all relevant documents
      await tx.recipient.updateMany({
        where: { email: user.email }, // matching the previous email
        data: { email }, // updating to the new email
      });
      console.log(`Recipient emails updated in documents for userId: ${userId}`);

      // Return the updated user data
      console.log(`Profile update completed successfully for userId: ${userId}`);
      return updatedUser;
    });
  } catch (error: any) {
    console.error(`Failed to update profile for user ${userId}: ${error.message}`);
    throw new Error('Profile update failed, all changes have been rolled back.');
  }
};
