import { updateSubscriptionItemQuantity } from '@documenso/ee/server-only/stripe/update-subscription-item-quantity';
import { IS_BILLING_ENABLED } from '@documenso/lib/constants/app';
import { TEAM_MEMBER_ROLE_PERMISSIONS_MAP } from '@documenso/lib/constants/teams';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { isTeamRoleWithinUserHierarchy } from '@documenso/lib/utils/teams';
import { prisma } from '@documenso/prisma';
import { triggerWebhook } from '../webhooks/trigger/trigger-webhook';
import { WebhookTriggerEvents } from '@documenso/prisma/client';
import { deleteUserFromKeycloakByEmail } from './delete-team-member-keycloack';

export type DeleteTeamMembersOptions = {
  /**
   * The ID of the user who is initiating this action.
   */
  userId: number;

  /**
   * The ID of the team to remove members from.
   */
  teamId: number;

  /**
   * The IDs of the team members to remove.
   */
  teamMemberIds: number[];
};

export const deleteTeamMembers = async ({
  userId,
  teamId,
  teamMemberIds,
}: DeleteTeamMembersOptions) => {
  console.log(`Deleting team members: ${teamMemberIds.join(', ')}`);
  await prisma.$transaction(
    async (tx) => {
      // Find the team and validate that the user is allowed to remove members.
      const team = await tx.team.findFirstOrThrow({
        where: {
          id: teamId,
          members: {
            some: {
              userId,
              role: {
                in: TEAM_MEMBER_ROLE_PERMISSIONS_MAP['MANAGE_TEAM'],
              },
            },
          },
        },
        include: {
          members: {
            select: {
              id: true,
              userId: true,
              role: true,
            },
          },
          subscription: true,
        },
      });

      const currentTeamMember = team.members.find((member) => member.userId === userId);
      const currentTeamMemberEmail = await tx.user.findFirst({
        where: {
          id: currentTeamMember?.userId,
        },
        select: {
          email: true,
        },
      });
      const teamMembersToRemove = team.members.filter((member) =>
        teamMemberIds.includes(member.id),
      );

      if (!currentTeamMember) {
        throw new AppError(AppErrorCode.NOT_FOUND, 'Team member record does not exist');
      }

      if (teamMembersToRemove.find((member) => member.userId === team.ownerUserId)) {
        throw new AppError(AppErrorCode.UNAUTHORIZED, 'Cannot remove the team owner');
      }

      const isMemberToRemoveHigherRole = teamMembersToRemove.some(
        (member) => !isTeamRoleWithinUserHierarchy(currentTeamMember.role, member.role),
      );

      if (isMemberToRemoveHigherRole) {
        throw new AppError(AppErrorCode.UNAUTHORIZED, 'Cannot remove a member with a higher role');
      }

      // Fetch emails of the members to be removed
      const userIdsToRemove = teamMembersToRemove.map(member => member.userId);
      const usersToRemove = await tx.user.findMany({
        where: {
          id: {
            in: userIdsToRemove,
          },
        },
        select: {
          id: true,
          email: true,
        },
      });

      
      // Remove the team members.
      await tx.teamMember.deleteMany({
        where: {
          id: {
            in: teamMemberIds,
          },
          teamId,
          userId: {
            not: team.ownerUserId,
          },
        },
      });

      //delete users from db
      await tx.user.deleteMany({
        where: {
          id: {
            in: userIdsToRemove,
          },
        },
      });
      
      console.log(`Deleted team members: ${teamMemberIds.join(', ')}`);

      // Trigger webhook for each removed team member
      for (const user of usersToRemove) {
       const res = await triggerWebhook({
          event: WebhookTriggerEvents.TEAM_MEMBER_DELETED,
          data: {
            email: user.email,
          },
          email: user.email,
          userId: user.id,
          teamId,
        });
        console.log(res);
        console.log(`Triggered webhook for deleted team member: ${user.email}`);

        // Delete user from Keycloak
        const keycloakResponse = await deleteUserFromKeycloakByEmail(user.email);
        console.log(keycloakResponse);
        console.log(`Deleted user from Keycloak: ${user.email}`);
      }

      if (IS_BILLING_ENABLED() && team.subscription) {
        const numberOfSeats = await tx.teamMember.count({
          where: {
            teamId,
          },
        });

        await updateSubscriptionItemQuantity({
          priceId: team.subscription.priceId,
          subscriptionId: team.subscription.planId,
          quantity: numberOfSeats,
        });
      }
    },
    { timeout: 30_000 },
  );
};
