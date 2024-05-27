import type { NextApiRequest, NextApiResponse } from 'next';

import NextAuth from 'next-auth';

import { getStripeCustomerByUser } from '@documenso/ee/server-only/stripe/get-customer';
import { IS_BILLING_ENABLED } from '@documenso/lib/constants/app';
import { NEXT_AUTH_OPTIONS } from '@documenso/lib/next-auth/auth-options';
import { extractNextApiRequestMetadata } from '@documenso/lib/universal/extract-request-metadata';
import { prisma } from '@documenso/prisma';
import { Account, UserSecurityAuditLogType } from '@documenso/prisma/client';

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  const { ipAddress, userAgent } = extractNextApiRequestMetadata(req);

  return await NextAuth(req, res, {
    ...NEXT_AUTH_OPTIONS,
    pages: {
      signIn: '/signin',
      signOut: '/signout',
      error: '/signin',
    },
    events: {
      signIn: async ({ user: { id: userId } }) => {
        const [user] = await Promise.all([
          await prisma.user.findFirstOrThrow({
            where: {
              id: userId,
            },
          }),
          await prisma.userSecurityAuditLog.create({
            data: {
              userId,
              ipAddress,
              userAgent,
              type: UserSecurityAuditLogType.SIGN_IN,
            },
          }),
        ]);

        // Create the Stripe customer and attach it to the user if it doesn't exist.
        if (user.customerId === null && IS_BILLING_ENABLED()) {
          await getStripeCustomerByUser(user).catch((err) => {
            console.error(err);
          });
        }
      },
      signOut: async ({ token }) => {
        const userId = typeof token.id === 'string' ? parseInt(token.id) : token.id;

        if (isNaN(userId)) {
          return;
        }

        await prisma.userSecurityAuditLog.create({
          data: {
            userId,
            ipAddress,
            userAgent,
            type: UserSecurityAuditLogType.SIGN_OUT,
          },
        });
      },
      linkAccount: async ({ user }) => {


        const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;

        if (isNaN(userId)) {
          return;
        }

        await prisma.userSecurityAuditLog.create({
          data: {
            userId,
            ipAddress,
            userAgent,
            type: UserSecurityAuditLogType.ACCOUNT_SSO_LINK,
          },
        });
      },
    },
    adapter: {
      ...NEXT_AUTH_OPTIONS.adapter,
      linkAccount: async (account) => {
        const existingAccount = await prisma.account.findFirst({
          where: {
            providerAccountId: account.providerAccountId,
          },
        });

        if (existingAccount) {
          return
        }

        const newAccount= {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          providerId: account.providerId,
          userId: Number(account.userId),
          type: account.type,
          refreshToken: account.refreshToken,
          accessToken: account.accessToken,
          accessTokenExpires: account.accessTokenExpires,
          idToken: account.idToken,
          idTokenExpires: account.idTokenExpires,
          scope: account.scope,
          tokenType: account.tokenType,
          sessionState: account.sessionState,
          oauthToken: account.oauthToken,
          oauthTokenSecret: account.oauthTokenSecret,
          oauthTokenExpires: account.oauthTokenExpires,
        };

        await prisma.account.create({
          data: newAccount,
        });
        
        }
      }
  });
}
