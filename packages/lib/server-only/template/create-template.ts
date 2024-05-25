import { prisma } from '@documenso/prisma';
import type { TCreateTemplateMutationSchema } from '@documenso/trpc/server/template-router/schema';

export type CreateTemplateOptions = TCreateTemplateMutationSchema & {
  userId: number;
  teamIds?: number[];
};

export const createTemplate = async ({
  title,
  userId,
  teamIds,
  templateDocumentDataId,
}: CreateTemplateOptions) => {
  // Verify that the user is a member of the provided teams
  if (teamIds && teamIds.length > 0) {
    await prisma.team.findMany({
      where: {
        id: {
          in: teamIds,
        },
        members: {
          some: {
            userId,
          },
        },
      },
    }).then((teams) => {
      if (teams.length !== teamIds.length) {
        throw new Error('User is not a member of one or more teams');
      }
    });
  }

  const template = await prisma.template.create({
    data: {
      title,
      userId,
      templateDocumentDataId,
      teams: {
        create: teamIds ? teamIds.map((teamId) => ({ team: { connect: { id: teamId } } })) : [],
      },
    },
  });

  return template;
};
