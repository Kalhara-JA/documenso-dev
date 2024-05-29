'use client';

import { useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import type * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { WEBAPP_BASE_URL } from '@documenso/lib/constants/app';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { trpc } from '@documenso/trpc/react';
import { ZCreateTeamMutationSchema } from '@documenso/trpc/server/team-router/schema';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form/form';
import { Input } from '@documenso/ui/primitives/input';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { useToast } from '@documenso/ui/primitives/use-toast';
import { getRequiredServerComponentSession } from '@documenso/lib/next-auth/get-server-component-session';
import { findTemplates } from '@documenso/lib/server-only/template/find-templates';
import type { Template } from '@documenso/prisma/client';

export type CreateTeamDialogProps = {
  trigger?: React.ReactNode;
} & Omit<DialogPrimitive.DialogProps, 'children'>;

const ZCreateTeamFormSchema = ZCreateTeamMutationSchema.pick({
  teamName: true,
  teamUrl: true,
  templateIds: true,
});

type TCreateTeamFormSchema = z.infer<typeof ZCreateTeamFormSchema>;

export const CreateTeamDialog = ({ trigger, ...props }: CreateTeamDialogProps) => {
  const { toast } = useToast();

  const router = useRouter();
  const searchParams = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);

  const actionSearchParam = searchParams?.get('action');

  const form = useForm<TCreateTeamFormSchema>({
    resolver: zodResolver(ZCreateTeamFormSchema),
    defaultValues: {
      teamName: '',
      teamUrl: '',
      templateIds: [],
    },
  });

  const { mutateAsync: createTeam } = trpc.team.createTeam.useMutation();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const session = await getRequiredServerComponentSession();
        const { user } = session;

        const { templates } = await findTemplates({
          userId: user.id,
          teamId: undefined,
          page: 1,
          perPage: 100,
        });

        setTemplates(templates);
      } catch (error) {
        console.error('Failed to fetch templates', error);
      }
    };

    if (open) {
      void fetchTemplates();
    }
  }, [open]);

  const onFormSubmit = async ({ teamName, teamUrl, templateIds }: TCreateTeamFormSchema) => {
    try {
      console.log({ teamName, teamUrl, templateIds });
      const response = await createTeam({
        teamName,
        teamUrl,
        templateIds,
      });

      console.log(response);

      setOpen(false);

      if (response.paymentRequired) {
        router.push(`/settings/teams?tab=pending&checkout=${response.pendingTeamId}`);
        return;
      }

      toast({
        title: 'Success',
        description: 'Your team has been created.',
        duration: 5000,
      });
    } catch (err) {
      const error = AppError.parseError(err);

      if (error.code === AppErrorCode.ALREADY_EXISTS) {
        form.setError('teamUrl', {
          type: 'manual',
          message: 'This URL is already in use.',
        });

        return;
      }

      toast({
        title: 'An unknown error occurred',
        variant: 'destructive',
        description:
          'We encountered an unknown error while attempting to create a team. Please try again later.',
      });
    }
  };

  useEffect(() => {
    if (actionSearchParam === 'add-team') {
      setOpen(true);
      updateSearchParams({ action: null });
    }
  }, [actionSearchParam, open, setOpen, updateSearchParams]);

  useEffect(() => {
    form.reset();
    setStep(1);
  }, [open, form]);

  return (
    <Dialog
      {...props}
      open={open}
      onOpenChange={(value) => !form.formState.isSubmitting && setOpen(value)}
    >
      <DialogTrigger onClick={(e) => e.stopPropagation()} asChild={true}>
        {trigger ?? (
          <Button className="flex-shrink-0" variant="secondary">
            Create team
          </Button>
        )}
      </DialogTrigger>

      <DialogContent position="center">
        <DialogHeader>
          <DialogTitle>{step === 1 ? 'Create team' : 'Assign Templates'}</DialogTitle>

          <DialogDescription className="mt-4">
            {step === 1
              ? 'Create a team to collaborate with your team members.'
              : 'Select templates for your team.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)}>
            <fieldset
              className="flex h-full flex-col space-y-4"
              disabled={form.formState.isSubmitting}
            >
              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="teamName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Team Name</FormLabel>
                        <FormControl>
                          <Input className="bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="teamUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Team URL</FormLabel>
                        <FormControl>
                          <Input className="bg-background" {...field} />
                        </FormControl>
                        {!form.formState.errors.teamUrl && (
                          <span className="text-foreground/50 text-xs font-normal">
                            {field.value
                              ? `${WEBAPP_BASE_URL}/t/${field.value}`
                              : 'A unique URL to identify your team'}
                          </span>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {step === 2 && (
                <>
                  {/* <FormLabel required>Templates</FormLabel> */}
                  {templates.map((template) => (
                    <FormField
                      key={template.id}
                      control={form.control}
                      name="templateIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Checkbox
                              checked={field.value.includes(template.id)}
                              onCheckedChange={(checked) => {
                                const newValues = checked
                                  ? [...(field.value as number[]), template.id]
                                  : (field.value as number[]).filter((t) => t !== template.id);
                                form.setValue('templateIds', newValues);
                              }}
                              className="mr-2"
                            />
                          </FormControl>
                          <FormLabel>{template.title}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </>
              )}

              <DialogFooter>
                {step === 2 && (
                  <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                    Back
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => (step === 1 ? setStep(2) : setOpen(false))}
                >
                  {step === 1 ? 'Next' : 'Cancel'}
                </Button>
                {step === 2 && (
                  <Button
                    type="submit"
                    data-testid="dialog-create-team-button"
                    loading={form.formState.isSubmitting}
                  >
                    Create Team
                  </Button>
                )}
              </DialogFooter>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
