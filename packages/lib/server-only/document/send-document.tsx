import { createElement } from 'react';

import { mailer } from '@documenso/email/mailer';
import { render } from '@documenso/email/render';
import { DocumentInviteEmailTemplate } from '@documenso/email/templates/document-invite';
import { FROM_ADDRESS, FROM_NAME } from '@documenso/lib/constants/email';
import { sealDocument } from '@documenso/lib/server-only/document/seal-document';
import { updateDocument } from '@documenso/lib/server-only/document/update-document';
import { DOCUMENT_AUDIT_LOG_TYPE } from '@documenso/lib/types/document-audit-logs';
import type { RequestMetadata } from '@documenso/lib/universal/extract-request-metadata';
import { putPdfFile } from '@documenso/lib/universal/upload/put-file';
import { createDocumentAuditLogData } from '@documenso/lib/utils/document-audit-logs';
import { renderCustomEmailTemplate } from '@documenso/lib/utils/render-custom-email-template';
import { prisma } from '@documenso/prisma';
import { DocumentStatus, RecipientRole, SendStatus } from '@documenso/prisma/client';
import { WebhookTriggerEvents } from '@documenso/prisma/client';

import { NEXT_PUBLIC_WEBAPP_URL } from '../../constants/app';
import {
  RECIPIENT_ROLES_DESCRIPTION,
  RECIPIENT_ROLE_TO_EMAIL_TYPE,
} from '../../constants/recipient-roles';
import { getFile } from '../../universal/upload/get-file';
import { insertFormValuesInPdf } from '../pdf/insert-form-values-in-pdf';
import { triggerWebhook } from '../webhooks/trigger/trigger-webhook';

export type SendDocumentOptions = {
  documentId: number;
  userId: number;
  teamId?: number;
  requestMetadata?: RequestMetadata;
};

export const sendDocument = async ({
  documentId,
  userId,
  teamId,
  requestMetadata,
}: SendDocumentOptions) => {
  console.log('Starting sendDocument process', { documentId, userId, teamId });

  const user = await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  console.log('User fetched:', user);

  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
      ...(teamId
        ? {
            team: {
              id: teamId,
              members: {
                some: {
                  userId,
                },
              },
            },
          }
        : {
            userId,
            teamId: null,
          }),
    },
    include: {
      Recipient: true,
      documentMeta: true,
      documentData: true,
    },
  });
  console.log('Document fetched:', document);

  const customEmail = document?.documentMeta;

  if (!document) {
    throw new Error('Document not found');
  }

  if (document.Recipient.length === 0) {
    throw new Error('Document has no recipients');
  }

  if (document.status === DocumentStatus.COMPLETED) {
    throw new Error('Can not send completed document');
  }

  const { documentData } = document;

  if (!documentData.data) {
    throw new Error('Document data not found');
  }

  if (document.formValues) {
    const file = await getFile(documentData);
    console.log('File fetched for form values insertion:', file);

    const prefilled = await insertFormValuesInPdf({
      pdf: Buffer.from(file),
      formValues: document.formValues as Record<string, string | number | boolean>,
    });
    console.log('Form values inserted into PDF:', prefilled);

    const newDocumentData = await putPdfFile({
      name: document.title,
      type: 'application/pdf',
      arrayBuffer: async () => Promise.resolve(prefilled),
    });
    console.log('New document data after PDF upload:', newDocumentData);

    const result = await prisma.document.update({
      where: {
        id: document.id,
      },
      data: {
        documentDataId: newDocumentData.id,
      },
    });
    console.log('Document updated with new data:', result);

    Object.assign(document, result);
  }

  await Promise.all(
    document.Recipient.map(async (recipient) => {
      console.log('Processing recipient:', recipient);

      if (recipient.sendStatus === SendStatus.SENT || recipient.role === RecipientRole.CC) {
        console.log('Skipping recipient, already sent or CC:', recipient);
        return;
      }

      const recipientEmailType = RECIPIENT_ROLE_TO_EMAIL_TYPE[recipient.role];

      const { email, name } = recipient;
      const selfSigner = email === user.email;

      const selfSignerCustomEmail = `You have initiated the document ${`"${document.title}"`} that requires you to ${RECIPIENT_ROLES_DESCRIPTION[
        recipient.role
      ].actionVerb.toLowerCase()} it.`;

      const customEmailTemplate = {
        'signer.name': name,
        'signer.email': email,
        'document.name': document.title,
      };

      const assetBaseUrl = NEXT_PUBLIC_WEBAPP_URL() || 'http://localhost:3000';
      const signDocumentLink = `${NEXT_PUBLIC_WEBAPP_URL()}/sign/${recipient.token}`;

      const template = createElement(DocumentInviteEmailTemplate, {
        documentName: document.title,
        inviterName: user.name || undefined,
        inviterEmail: user.email,
        assetBaseUrl,
        signDocumentLink,
        customBody: renderCustomEmailTemplate(
          selfSigner && !customEmail?.message ? selfSignerCustomEmail : customEmail?.message || '',
          customEmailTemplate,
        ),
        role: recipient.role,
        selfSigner,
      });
      console.log('Email template created:', template);

      const { actionVerb } = RECIPIENT_ROLES_DESCRIPTION[recipient.role];

      const emailSubject = selfSigner
        ? `Please ${actionVerb.toLowerCase()} your document`
        : `Please ${actionVerb.toLowerCase()} this document`;

      console.log('Sending email to recipient:', {
        email,
        name,
        emailSubject,
        template,
      });

      await prisma.$transaction(
        async (tx) => {
          await mailer.sendMail({
            to: {
              address: email,
              name,
            },
            from: {
              name: FROM_NAME,
              address: FROM_ADDRESS,
            },
            subject: customEmail?.subject
              ? renderCustomEmailTemplate(customEmail.subject, customEmailTemplate)
              : emailSubject,
            html: render(template),
            text: render(template, { plainText: true }),
          });
          console.log('Email sent to:', email);

          await tx.recipient.update({
            where: {
              id: recipient.id,
            },
            data: {
              sendStatus: SendStatus.SENT,
            },
          });
          console.log('Recipient status updated:', recipient.id);

          await tx.documentAuditLog.create({
            data: createDocumentAuditLogData({
              type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT,
              documentId: document.id,
              user,
              requestMetadata,
              data: {
                emailType: recipientEmailType,
                recipientEmail: recipient.email,
                recipientName: recipient.name,
                recipientRole: recipient.role,
                recipientId: recipient.id,
                isResending: false,
              },
            }),
          });
          console.log('Document audit log created for recipient:', recipient.id);
        },
        { timeout: 30_000 },
      );
    }),
  );

  const allRecipientsHaveNoActionToTake = document.Recipient.every(
    (recipient) => recipient.role === RecipientRole.CC,
  );
  console.log('All recipients have no action to take:', allRecipientsHaveNoActionToTake);

  if (allRecipientsHaveNoActionToTake) {
    const updatedDocument = await updateDocument({
      documentId,
      userId,
      teamId,
      data: { status: DocumentStatus.COMPLETED },
    });
    console.log('Document marked as completed:', updatedDocument);

    await sealDocument({ documentId: updatedDocument.id, requestMetadata });
    console.log('Document sealed:', updatedDocument.id);

    // Keep the return type the same for the `sendDocument` method
    return await prisma.document.findFirstOrThrow({
      where: {
        id: documentId,
      },
      include: {
        Recipient: true,
      },
    });
  }

  const updatedDocument = await prisma.$transaction(async (tx) => {
    if (document.status === DocumentStatus.DRAFT) {
      await tx.documentAuditLog.create({
        data: createDocumentAuditLogData({
          type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_SENT,
          documentId: document.id,
          requestMetadata,
          user,
          data: {},
        }),
      });
      console.log('Document audit log created for document sent:', document.id);
    }

    return await tx.document.update({
      where: {
        id: documentId,
      },
      data: {
        status: DocumentStatus.PENDING,
      },
      include: {
        Recipient: true,
      },
    });
  });
  console.log('Document updated to pending status:', updatedDocument);

  await triggerWebhook({
    event: WebhookTriggerEvents.DOCUMENT_SENT,
    data: updatedDocument,
    userId,
    teamId,
  });
  console.log('Webhook triggered for document sent:', updatedDocument.id);

  return updatedDocument;
};
