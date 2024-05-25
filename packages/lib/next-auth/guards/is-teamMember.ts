
"use server"

import { prisma } from '@documenso/prisma';
import type { TeamMember } from '@documenso/prisma/client';
import { TeamMemberRole } from '@documenso/prisma/client';

export const isTeamMember = async (userId: number, teamId: number) => {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId: teamId
      }
    });

    return teamMembers.some((member: TeamMember) => member.userId === userId && member.role === TeamMemberRole.MEMBER);
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error; // Re-throw the error after logging it
  }
};
