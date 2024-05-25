'use server';

import { prisma } from '@documenso/prisma';

export type DeleteTemplateOptions = {
  id: number;
  userId: number;
};

export const deleteTemplate = async ({ id, userId }: DeleteTemplateOptions) => {
  // Ensure the user is either the owner of the template or a member of a team that has the template
  const template = await prisma.template.findFirstOrThrow({
    where: {
      id,
      OR: [
        {
          userId,
        },
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
    },
  });

  // Delete the template
  return await prisma.template.delete({
    where: {
      id: template.id,
    },
  });
};
