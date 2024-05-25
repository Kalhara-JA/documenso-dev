'use client';

import Link from 'next/link';

import { useSession } from 'next-auth/react';

import { formatTemplatesPath } from '@documenso/lib/utils/teams';
import type { Template } from '@documenso/prisma/client';

import { useOptionalCurrentTeam } from '~/providers/team';

export type DataTableTitleProps = {
  row: Template & {
    teams: {
      team: { id: number; url: string } | null;
    }[];
  };
};

export const DataTableTitle = ({ row }: DataTableTitleProps) => {
  const { data: session } = useSession();
  const team = useOptionalCurrentTeam();

  if (!session) {
    return null;
  }

  const currentTeam = team?.url
    ? row.teams.find(({ team: teamInRow }) => teamInRow?.url === team.url)?.team
    : undefined;

  const templatesPath = formatTemplatesPath(currentTeam?.url);

  return (
    <Link
      href={`${templatesPath}/${row.id}`}
      className="block max-w-[10rem] cursor-pointer truncate font-medium hover:underline md:max-w-[20rem]"
    >
      {row.title}
    </Link>
  );
};
