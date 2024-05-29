import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { DateTime } from 'luxon';
import type { AuthOptions, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { env } from 'next-runtime-env';

import { prisma } from '@documenso/prisma';
import { IdentityProvider, Role, UserSecurityAuditLogType } from '@documenso/prisma/client';
import { extractNextAuthRequestMetadata } from '../universal/extract-request-metadata';
import { AppError, AppErrorCode } from '../errors/app-error';
import { getUserByEmail } from '../server-only/user/get-user-by-email';
import { uuidToNumber } from '../universal/crypto';
import { ErrorCode } from './error-codes';
import axios from 'axios';
import qs from 'qs';

export const NEXT_AUTH_OPTIONS: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET ?? 'secret',
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        firstName: { label: 'First Name', type: 'text', optional: true },
        lastName: { label: 'Last Name', type: 'text', optional: true },
        confirmPassword: { label: 'Confirm Password', type: 'password', optional: true },
      },
      authorize: async (credentials, req) => {
        if (!credentials) {
          throw new Error(ErrorCode.CREDENTIALS_NOT_FOUND);
        }

        const { email, password, firstName,lastName, confirmPassword } = credentials;
        const requestMetadata = extractNextAuthRequestMetadata(req);

        if (firstName && confirmPassword) {

          try {
            const adminToken = await axios.post(`${process.env.NEXT_PRIVATE_APISIX_URL}/realms/master/protocol/openid-connect/token`,
              qs.stringify({
                grant_type: 'client_credentials',
                client_id: process.env.NEXT_PRIVATE_KEYCLOAK_CLIENT_ID,
                client_secret: process.env.NEXT_PRIVATE_KEYCLOAK_CLIENT_SECRET,
                username: process.env.NEXT_PRIVATE_KEYCLOAK_ADMIN_USERNAME,
                password: process.env.NEXT_PRIVATE_KEYCLOAK_ADMIN_PASSWORD,
                scope: 'openid',
              }), {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            });

            const adminTokenData = adminToken.data;

            const newUser = {
              username: email,
              email: email,
              enabled: true,
              emailVerified: true,
              firstName: firstName,
              lastName: lastName,
              credentials: [
                {
                  type: 'password',
                  value: password,
                  temporary: false,
                },
              ],
            }

            const response = await axios.post(`${process.env.NEXT_PRIVATE_APISIX_URL}/admin/realms/master/users`, newUser, {
              headers: {
                Authorization: `Bearer ${adminTokenData.access_token}`,
                'Content-Type': 'application/json',
              },
            });


            if (response.status === 201) {
              const user = await prisma.user.create({
                data: {
                  email,
                  name: firstName + ' ' + lastName,
                  emailVerified: new Date().toISOString(),
                },
              });

              await prisma.userSecurityAuditLog.create({
                data: {
                  userId: user.id,
                  ipAddress: requestMetadata.ipAddress,
                  userAgent: requestMetadata.userAgent,
                  type: UserSecurityAuditLogType.SIGN_IN,
                },
              });

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                roles: [Role.USER],
              };
            } else {
              throw new Error(ErrorCode.INTERNAL_SEVER_ERROR);
            }


          } catch (error: any) {
            console.error('Error creating user:', error);
            throw new Error(ErrorCode.INTERNAL_SEVER_ERROR);
          }
        } else {
          
          try {
            const response = await axios.post(`${process.env.NEXT_PRIVATE_APISIX_URL}/realms/master/protocol/openid-connect/token`,
              qs.stringify({
                grant_type: 'password',
                client_id: process.env.NEXT_PRIVATE_KEYCLOAK_CLIENT_ID,
                client_secret: process.env.NEXT_PRIVATE_KEYCLOAK_CLIENT_SECRET,
                username: email,
                password: password,
                scope: 'openid',
              }), {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            });

            const data = response.data;

            if (data.access_token) {
              const userInfoResponse = await axios.get(`${process.env.NEXT_PRIVATE_APISIX_URL}/realms/master/protocol/openid-connect/userinfo`, {
                headers: {
                  Authorization: `Bearer ${data.access_token}`,
                },
              });

              const userInfo = userInfoResponse.data;

              let user = await prisma.user.findUnique({
                where: { email: userInfo.email },
              });

              if (!user) {
                user = await prisma.user.create({
                  data: {
                    email: userInfo.email,
                    name: userInfo.name,
                    emailVerified: new Date().toISOString(),
                  },
                });
              }

              await prisma.userSecurityAuditLog.create({
                data: {
                  userId: user.id,
                  ipAddress: requestMetadata.ipAddress,
                  userAgent: requestMetadata.userAgent,
                  type: UserSecurityAuditLogType.SIGN_IN,
                },
              });

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                roles: [Role.USER],
              };
            } else {
              throw new Error(ErrorCode.INCORRECT_EMAIL_PASSWORD);
            }
          } catch (error: any) {
            console.error('Error fetching user info:', error);
            throw new Error(ErrorCode.INCORRECT_EMAIL_PASSWORD);
          }
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, account }) {
      const merged = {
        ...token,
        ...user,
        emailVerified: user?.emailVerified ? new Date(user.emailVerified).toISOString() : null,
      } satisfies JWT;

      if (!merged.email || typeof merged.emailVerified !== 'string') {
        const userId = Number(merged.id ?? token.sub);

        const retrieved = await prisma.user.findFirst({
          where: {
            id: userId,
          },
        });

        if (!retrieved) {
          return token;
        }

        merged.id = retrieved.id;
        merged.name = retrieved.name;
        merged.email = retrieved.email;
        merged.emailVerified = retrieved.emailVerified?.toISOString() ?? null;
      }

      if (merged.id && (!merged.lastSignedIn || DateTime.fromISO(merged.lastSignedIn).plus({ hours: 1 }) <= DateTime.now())) {
        merged.lastSignedIn = new Date().toISOString();

        const user = await prisma.user.update({
          where: {
            id: Number(merged.id),
          },
          data: {
            lastSignedIn: merged.lastSignedIn,
          },
        });

        merged.emailVerified = user.emailVerified?.toISOString() ?? null;
      }

      if ((trigger === 'signIn' || trigger === 'signUp') && account?.provider === 'google') {
        merged.emailVerified = user?.emailVerified ? new Date(user.emailVerified).toISOString() : new Date().toISOString();

        await prisma.user.update({
          where: {
            id: Number(merged.id),
          },
          data: {
            emailVerified: merged.emailVerified,
            identityProvider: IdentityProvider.GOOGLE,
            roles: merged.roles,
          },
        });
      }

      if ((trigger === 'signIn' || trigger === 'signUp') && account?.provider === 'keycloak') {
        merged.emailVerified = user?.emailVerified ? new Date(user.emailVerified).toISOString() : new Date().toISOString();

        await prisma.user.update({
          where: {
            id: Number(merged.id),
          },
          data: {
            emailVerified: merged.emailVerified,
            identityProvider: IdentityProvider.KEYCLOAK,
            roles: merged.roles,
          },
        });
      }

      return {
        id: merged.id,
        name: merged.name,
        email: merged.email,
        lastSignedIn: merged.lastSignedIn,
        emailVerified: merged.emailVerified,
        roles: merged.roles,
      } satisfies JWT;
    },

    session({ token, session }) {
      if (token && token.email) {
        return {
          ...session,
          user: {
            id: Number(token.id),
            name: token.name,
            email: token.email,
            emailVerified: token.emailVerified ?? null,
            roles: token.roles,
          },
        } satisfies Session;
      }

      return session;
    },

    async signIn({ user }) {
      if (env('NEXT_PUBLIC_DISABLE_SIGNUP') === 'true') {
        const userData = await getUserByEmail({ email: user.email! });
        return !!userData;
      }
      return true;
    },
  },
};
