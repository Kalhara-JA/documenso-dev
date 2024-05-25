'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Loader } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { useLimits } from '@documenso/ee/server-only/limits/provider/client';
import { useAnalytics } from '@documenso/lib/client-only/hooks/use-analytics';
import { APP_DOCUMENT_UPLOAD_SIZE_LIMIT } from '@documenso/lib/constants/app';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { createDocumentData } from '@documenso/lib/server-only/document-data/create-document-data';
import { putPdfFile } from '@documenso/lib/universal/upload/put-file';
import { formatDocumentsPath } from '@documenso/lib/utils/teams';
import { TRPCClientError } from '@documenso/trpc/client';
import { trpc } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { DocumentDropzone } from '@documenso/ui/primitives/document-dropzone';
import { useToast } from '@documenso/ui/primitives/use-toast';
import { isAdmin } from '@documenso/lib/next-auth/guards/is-admin';
import { isTeamMember } from '@documenso/lib/next-auth/guards/is-teamMember';
import type { User } from '@documenso/prisma/client';

export type UploadDocumentProps = {
  className?: string;
  team?: {
    id: number;
    url: string;
  };
};

export const UploadDocument = ({ className, team }: UploadDocumentProps) => {
  const router = useRouter();
  const analytics = useAnalytics();

  const { data: session } = useSession();

  const [admin] = useState(session ? isAdmin(session.user as User) : false);

  const { toast } = useToast();

  const { quota, remaining } = useLimits();

  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync: createDocument } = trpc.document.createDocument.useMutation();

  const disabledMessage = useMemo(() => {
    if (remaining.documents === 0) {
      return team
        ? 'Document upload disabled due to unpaid invoices'
        : 'You have reached your document limit.';
    }

    if (!session?.user.emailVerified) {
      return 'Verify your email to upload documents.';
    }
  }, [remaining.documents, session?.user.emailVerified, team]);

  const onFileDrop = async (file: File) => {
    try {
      setIsLoading(true);

      const { type, data } = await putPdfFile(file);
      
      console.log('Document uploaded', type, data);
      const { id: documentDataId } = await createDocumentData({
        type,
        data,
      });

      console.log('Document uploaded', documentDataId);

      if (!team && !admin) {
        throw new AppError(
          AppErrorCode.INVALID_REQUEST,
          'You are not allowed to upload documents without a team.',
          'Please upload documents to a team.'
        );
      }

      console.log('Document uploaded', documentDataId);

      const { id } = await createDocument({
        title: file.name,
        documentDataId,
        teamId: team?.id,
      });

      console.log('Document uploaded', id);

      toast({
        title: 'Document uploaded',
        description: 'Your document has been uploaded successfully.',
        duration: 5000,
      });

      analytics.capture('App: Document Uploaded', {
        userId: session?.user.id,
        documentId: id,
        timestamp: new Date().toISOString(),
      });

      console.log('Document uploaded', id);

      let teamMember = true;

      try {
        if (session?.user && team?.id !== undefined) {
          teamMember = await isTeamMember(session.user.id, team.id);
        }
      } catch (err) {
        console.error('Error checking team membership:', err);
        toast({
          title: 'Error',
          description: 'An error occurred while checking your team membership.',
          variant: 'destructive',
        });
        // You can decide what to do in case of an error. For example, you can set teamMember to false.
        teamMember = false;
      }

      if (!teamMember) {
        router.push(`${formatDocumentsPath(team?.url)}/${id}/edit`);
      }



    } catch (err) {
      const error = AppError.parseError(err);

      console.error(err);

      if (error.code === 'INVALID_DOCUMENT_FILE') {
        toast({
          title: 'Invalid file',
          description: 'You cannot upload encrypted PDFs',
          variant: 'destructive',
        });
      } else if (err instanceof TRPCClientError) {
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'An error occurred while uploading your document.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onFileDropRejected = () => {
    toast({
      title: 'Your document failed to upload.',
      description: `File cannot be larger than ${APP_DOCUMENT_UPLOAD_SIZE_LIMIT}MB`,
      duration: 5000,
      variant: 'destructive',
    });
  };

  return (
    <div className={cn('relative', className)}>

      {(admin || team) && <DocumentDropzone
        className="h-[min(400px,50vh)]"
        disabled={remaining.documents === 0 || !session?.user.emailVerified}
        disabledMessage={disabledMessage}
        onDrop={onFileDrop}
        onDropRejected={onFileDropRejected}
      />}

      <div className="absolute -bottom-6 right-0">
        {team?.id === undefined &&
          remaining.documents > 0 &&
          Number.isFinite(remaining.documents) && (
            <p className="text-muted-foreground/60 text-xs">
              {remaining.documents} of {quota.documents} documents remaining this month.
            </p>
          )}
      </div>

      {isLoading && (
        <div className="bg-background/50 absolute inset-0 flex items-center justify-center rounded-lg">
          <Loader className="text-muted-foreground h-12 w-12 animate-spin" />
        </div>
      )}
    </div>
  );
};
