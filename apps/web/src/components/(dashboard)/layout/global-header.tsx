'use client';

import { useEffect, useState } from 'react';
import React from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CheckCircle2, ChevronsUpDown, Plus, Settings2 } from 'lucide-react';
import { signOut } from 'next-auth/react';

import { TEAM_MEMBER_ROLE_MAP, TEAM_URL_REGEX } from '@documenso/lib/constants/teams';
import { isAdmin } from '@documenso/lib/next-auth/guards/is-admin';
import { extractInitials } from '@documenso/lib/utils/recipient-formatter';
import { canExecuteTeamAction } from '@documenso/lib/utils/teams';
import { $Enums, Team, TeamMemberRole, User } from '@documenso/prisma/client';
import { trpc } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { AvatarWithText } from '@documenso/ui/primitives/avatar';
import { Button } from '@documenso/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@documenso/ui/primitives/dropdown-menu';

type InitialTeamsData = {
  currentTeamMember: {
    role: $Enums.TeamMemberRole;
  };
  id: number;
  name: string;
  url: string;
  createdAt: Date;
  customerId: string | null;
  ownerUserId: number;
}[];

interface GlobalHeaderProps {
  user: User;
  teams: InitialTeamsData;
}

export const GlobalHeader = ({ user, teams: initialTeamsData }: GlobalHeaderProps) => {
  const pathname = usePathname();
  const isUserAdmin = isAdmin(user);

  // const { data: teamsQueryResult } = trpc.team.getTeams.useQuery(undefined, {
  //   initialData: initialTeamsData,
  // });

  const { data: teamsQueryResult } = trpc.team.getTeams.useQuery(undefined, {
    initialData: initialTeamsData,
  });

  const teams = teamsQueryResult && teamsQueryResult.length > 0 ? teamsQueryResult : null;

  const isPathTeamUrl = (teamUrl?: string) => {
    if (!pathname || !pathname.startsWith(`/t/`)) {
      return false;
    }
    return pathname.split('/')[2] === teamUrl;
  };

  const selectedTeam = teams?.find((team) => isPathTeamUrl(team.url));

  const formatAvatarFallback = (teamName?: string) => {
    if (teamName !== undefined) {
      return teamName.slice(0, 1).toUpperCase();
    }

    return user.name ? extractInitials(user.name) : user.email.slice(0, 1).toUpperCase();
  };

  const formatSecondaryAvatarText = (team?: typeof selectedTeam) => {
    if (!team) {
      return 'Personal Account';
    }

    if (team.ownerUserId === user.id) {
      return 'Owner';
    }

    return TEAM_MEMBER_ROLE_MAP[team.currentTeamMember.role];
  };

  const formatRedirectUrlOnSwitch = (teamUrl?: string) => {
    const baseUrl = teamUrl ? `/t/${teamUrl}/` : '/';

    const currentPathname = (pathname ?? '/').replace(TEAM_URL_REGEX, '');

    if (currentPathname === '/templates') {
      return `${baseUrl}templates`;
    }

    return baseUrl;
  };

  const menuNavigationLinks = [
    { href: `/documents`, text: 'Home' },
    { href: `/templates`, text: 'About' },
    { href: '/settings/teams', text: 'Service' },
    { href: '/settings/profile', text: 'Contact Us' },
  ];

  return (
    <header className="mx-auto  hidden w-full max-w-screen-xl items-center justify-between gap-x-4 border-b border-gray-200 px-4 py-3 md:flex md:justify-normal md:px-8">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center">
          <Image
            width={168}
            height={50}
            className="h-10 w-full object-contain"
            src="https://res.cloudinary.com/dizm8txou/image/upload/landing-page/assets/day/logo.webp"
            alt="Logo"
          />
        </div>
        <nav>
          <ul className="flex space-x-6">
            {menuNavigationLinks.map(({ href, text }) => (
              <li key={href}>
                <Link href={href} className="text-sm text-gray-600 hover:text-gray-900">
                  {text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="menu-switcher"
                variant="none"
                className="relative flex h-12 flex-row items-center px-0 py-2 ring-0 focus:outline-none focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-transparent md:px-2"
              >
                <AvatarWithText
                  avatarFallback={formatAvatarFallback(selectedTeam?.name)}
                  primaryText={selectedTeam ? selectedTeam.name : user.name}
                  secondaryText={formatSecondaryAvatarText(selectedTeam)}
                  rightSideComponent={
                    <ChevronsUpDown className="text-muted-foreground ml-auto h-4 w-4" />
                  }
                  textSectionClassName="hidden lg:flex"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={cn(
                'z-[60] ml-6 w-full md:ml-0',
                teams ? 'min-w-[20rem]' : 'min-w-[12rem]',
              )}
              align="end"
              forceMount
            >
              {teams ? (
                <>
                  <DropdownMenuLabel>Personal</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={formatRedirectUrlOnSwitch()}>
                      <AvatarWithText
                        avatarFallback={formatAvatarFallback()}
                        primaryText={user.name}
                        secondaryText={formatSecondaryAvatarText()}
                        rightSideComponent={
                          !pathname?.startsWith(`/t/`) && (
                            <CheckCircle2 className="ml-auto fill-black text-white dark:fill-white dark:text-black" />
                          )
                        }
                      />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="mt-2" />
                  <DropdownMenuLabel>
                    <div className="flex flex-row items-center justify-between">
                      <p>Teams</p>
                      <div className="flex flex-row space-x-2">
                        <DropdownMenuItem asChild>
                          <Button
                            title="Manage teams"
                            variant="ghost"
                            className="text-muted-foreground flex h-5 w-5 items-center justify-center p-0"
                            asChild
                          >
                            <Link href="/settings/teams">
                              <Settings2 className="h-4 w-4" />
                            </Link>
                          </Button>
                        </DropdownMenuItem>
                        {isUserAdmin && (
                          <DropdownMenuItem asChild>
                            <Button
                              title="Create team"
                              variant="ghost"
                              className="text-muted-foreground flex h-5 w-5 items-center justify-center p-0"
                              asChild
                            >
                              <Link href="/settings/teams?action=add-team">
                                <Plus className="h-4 w-4" />
                              </Link>
                            </Button>
                          </DropdownMenuItem>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <div className="custom-scrollbar max-h-[40vh] overflow-auto">
                    {teams.map((team) => (
                      <DropdownMenuItem asChild key={team.id}>
                        <Link href={formatRedirectUrlOnSwitch(team.url)}>
                          <AvatarWithText
                            avatarFallback={formatAvatarFallback(team.name)}
                            primaryText={team.name}
                            secondaryText={formatSecondaryAvatarText(team)}
                            rightSideComponent={
                              isPathTeamUrl(team.url) && (
                                <CheckCircle2 className="ml-auto fill-black text-white dark:fill-white dark:text-black" />
                              )
                            }
                          />
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {isUserAdmin && (
                    <DropdownMenuItem className="text-muted-foreground px-4 py-2" asChild>
                      <Link
                        href="/settings/teams?action=add-team"
                        className="flex items-center justify-between"
                      >
                        Create team
                        <Plus className="ml-2 h-4 w-4" />
                      </Link>
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuSeparator />
              <div className="md:none block">
                {menuNavigationLinks.map(({ href, text }) => (
                  <DropdownMenuItem className="text-muted-foreground px-4 py-2" asChild key={href}>
                    <Link href={href}>{text}</Link>
                  </DropdownMenuItem>
                ))}
              </div>
              <div className="hidden md:block">
                {isUserAdmin && (
                  <DropdownMenuItem className="text-muted-foreground px-4 py-2" asChild>
                    <Link href="/admin">Admin panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-muted-foreground px-4 py-2" asChild>
                  <Link href="/settings/profile">User settings</Link>
                </DropdownMenuItem>
                {selectedTeam &&
                  canExecuteTeamAction('MANAGE_TEAM', selectedTeam.currentTeamMember.role) && (
                    <DropdownMenuItem className="text-muted-foreground px-4 py-2" asChild>
                      <Link href={`/t/${selectedTeam.url}/settings/`}>Team settings</Link>
                    </DropdownMenuItem>
                  )}
              </div>
              <DropdownMenuItem
                className="text-destructive/90 hover:!text-destructive px-4 py-2"
                onSelect={async () =>
                  signOut({
                    callbackUrl: '/',
                  })
                }
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
