"use server"

import { prisma } from '@documenso/prisma';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { isAdmin } from '../../next-auth/guards/is-admin';

export type EditTeamTemplatesOptions = {
  teamId: number;
  templateIds: number[];
  userId: number;
};

export const editTeamTemplates = async ({ teamId, templateIds, userId }: EditTeamTemplatesOptions) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  // Check if the user is an admin of the team
  const isTeamAdmin = await prisma.team.findFirst({
    where: {
      id: teamId,
      ownerUserId: userId,
    },
  });

  if (!isAdmin(user) && !isTeamAdmin) {
    
    throw new AppError(AppErrorCode.UNAUTHORIZED, 'User is not an admin of the team.');
  }

  // Start a transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Delete existing template associations
    await tx.teamTemplate.deleteMany({
      where: {
        teamId,
      },
    });

    // Create new template associations
    if (templateIds.length > 0) {
      await tx.teamTemplate.createMany({
        data: templateIds.map((templateId) => ({
          teamId,
          templateId,
        })),
      });
    }
  });

  return {
    success: true,
    message: 'Team templates updated successfully.',
  };
};
