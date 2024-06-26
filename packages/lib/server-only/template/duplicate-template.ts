import { nanoid } from '@documenso/lib/universal/id';
import { prisma } from '@documenso/prisma';
import type { Prisma } from '@documenso/prisma/client';
import type { TDuplicateTemplateMutationSchema } from '@documenso/trpc/server/template-router/schema';

export type DuplicateTemplateOptions = TDuplicateTemplateMutationSchema & {
  userId: number;
};

export const duplicateTemplate = async ({
  templateId,
  userId,
  teamId,
}: DuplicateTemplateOptions) => {
  const template = await prisma.template.findFirst({
    where: {
      id: templateId,
      OR: [
        {
          userId,
        },
        {
          teams: {
            some: {
              team: {
                id: teamId,
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
    include: {
      Recipient: true,
      Field: true,
      templateDocumentData: true,
    },
  });

  if (!template) {
    throw new Error('Template not found.');
  }

  const documentData = await prisma.documentData.create({
    data: {
      type: template.templateDocumentData.type,
      data: template.templateDocumentData.data,
      initialData: template.templateDocumentData.initialData,
    },
  });

  const duplicatedTemplate = await prisma.template.create({
    data: {
      userId,
      title: template.title + ' (copy)',
      templateDocumentDataId: documentData.id,
      teams: teamId
        ? {
            create: {
              team: { connect: { id: teamId } },
            },
          }
        : undefined,
      Recipient: {
        create: template.Recipient.map((recipient) => ({
          email: recipient.email,
          name: recipient.name,
          token: nanoid(),
        })),
      },
    },
    include: {
      Recipient: true,
    },
  });

  await prisma.field.createMany({
    data: template.Field.map((field) => {
      const recipient = template.Recipient.find((recipient) => recipient.id === field.recipientId);
      const duplicatedTemplateRecipient = duplicatedTemplate.Recipient.find(
        (doc) => doc.email === recipient?.email,
      );

      if (!duplicatedTemplateRecipient) {
        throw new Error('Recipient not found.');
      }

      return {
        type: field.type,
        page: field.page,
        positionX: field.positionX,
        positionY: field.positionY,
        width: field.width,
        height: field.height,
        customText: field.customText,
        inserted: field.inserted,
        templateId: duplicatedTemplate.id,
        recipientId: duplicatedTemplateRecipient.id,
      };
    }),
  });

  return duplicatedTemplate;
};
