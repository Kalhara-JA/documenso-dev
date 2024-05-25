"use server"

import { prisma } from '@documenso/prisma';
import type { Prisma } from '@documenso/prisma/client';

export type FindTemplatesOptions = {
  userId: number;
  teamId?: number;
  page: number;
  perPage: number;
};

export const findTemplates = async ({
  userId,
  teamId,
  page = 1,
  perPage = 10,
}: FindTemplatesOptions) => {
  let whereFilter: Prisma.TemplateWhereInput = {
    OR: [
      { userId },
      {
        teams: {
          some: {
            team: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        },
      },
    ],
  };

  if (teamId !== undefined) {
    whereFilter = {
      teams: {
        some: {
          teamId,
          team: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      },
    };
  }

  const [templates, count] = await Promise.all([
    prisma.template.findMany({
      where: whereFilter,
      include: {
        templateDocumentData: true,
        teams: {
          select: {
            team: {
              select: {
                id: true,
                url: true,
              },
            },
          },
        },
        Field: true,
        Recipient: true,
      },
      skip: Math.max(page - 1, 0) * perPage,
      take: perPage,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.template.count({
      where: whereFilter,
    }),
  ]);

  return {
    templates,
    totalPages: Math.ceil(count / perPage),
  };
};
