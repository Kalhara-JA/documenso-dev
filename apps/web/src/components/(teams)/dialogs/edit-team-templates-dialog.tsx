'use client';

import { useEffect, useState } from 'react';
import type * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useToast } from '@documenso/ui/primitives/use-toast';
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
} from '@documenso/ui/primitives/form/form';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { getRequiredServerComponentSession } from '@documenso/lib/next-auth/get-server-component-session';
import { findTemplates } from '@documenso/lib/server-only/template/find-templates';
import { editTeamTemplates } from '@documenso/lib/server-only/team/edit-team-templates';
import type { Template } from '@documenso/prisma/client';

export type TeamTemplateEditDialogProps = {
  teamId: number;
  trigger?: React.ReactNode;
} & Omit<DialogPrimitive.DialogProps, 'children'>;

type TEditTeamTemplatesFormSchema = {
  templateIds: number[];
};

export const TeamTemplateEditDialog = ({ teamId, trigger, ...props }: TeamTemplateEditDialogProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const form = useForm<TEditTeamTemplatesFormSchema>({
    defaultValues: {
      templateIds: [],
    },
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const session = await getRequiredServerComponentSession();
        const { user } = session;

        const { templates } = await findTemplates({
          userId: user.id,
          teamId: undefined,
          page: 1,
          perPage: 100,
        });

        const assignedTemplates = await findTemplates({
          userId: user.id,
          teamId: teamId,
          page: 1,
          perPage: 100,
        });

        const assignedTemplateIds = assignedTemplates.templates.map((template) => template.id);

        setTemplates(templates);
        form.setValue('templateIds', assignedTemplateIds);
      } catch (error) {
        console.error('Failed to fetch templates', error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    if (open) {
      void fetchTemplates();
    }
  }, [open, form, teamId]);

  const onFormSubmit = async ({ templateIds }: TEditTeamTemplatesFormSchema) => {
    try {
      const session = await getRequiredServerComponentSession();
      const { user } = session;

      await editTeamTemplates({
        teamId,
        templateIds,
        userId: user.id,
      });

      setOpen(false);

      toast({
        title: 'Success',
        description: 'Team templates have been updated.',
        duration: 5000,
      });

      router.refresh();
    } catch (err) {
      console.error(err);
      toast({
        title: 'An unknown error occurred',
        variant: 'destructive',
        description: 'We encountered an unknown error while attempting to update the team templates. Please try again later.',
      });
    }
  };

  return (
    <Dialog
      {...props}
      open={open}
      onOpenChange={(value) => !form.formState.isSubmitting && setOpen(value)}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="flex-shrink-0" variant="secondary">
            Edit Templates
          </Button>
        )}
      </DialogTrigger>

      <DialogContent position="center">
        <DialogHeader>
          <DialogTitle>Edit Team Templates</DialogTitle>
          <DialogDescription className="mt-4">
            Select templates to assign to your team.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)}>
            <fieldset className="flex h-full flex-col space-y-4" disabled={form.formState.isSubmitting}>
              {/* <FormLabel required>Templates</FormLabel> */}
              {loadingTemplates ? (
                <p>Loading templates...</p>
              ) : (
                templates.map((template) => (
                  <FormField
                    key={template.id}
                    control={form.control}
                    name="templateIds"
                    render={({ field }) => (
                      <FormItem className="flex items-center">
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
                ))
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-testid="dialog-edit-team-templates-button"
                  loading={form.formState.isSubmitting}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
