"use client";

import { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@documenso/ui/primitives/use-toast'; // Assuming you're using this for notifications
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const LOGIN_REDIRECT_PATH = '/documents';
const ERROR_MESSAGES: Partial<Record<string, string>> = {
  CREDENTIALS_NOT_FOUND: 'The email or password provided is incorrect',
  INCORRECT_EMAIL_PASSWORD: 'The email or password provided is incorrect',
  USER_MISSING_PASSWORD: 'This account appears to be using a social login method, please sign in using that method',
  INCORRECT_TWO_FACTOR_CODE: 'The two-factor authentication code provided is incorrect',
  INCORRECT_TWO_FACTOR_BACKUP_CODE: 'The backup code provided is incorrect',
  UNVERIFIED_EMAIL: 'This account has not been verified. Please verify your account before signing in.',
};

export const LoginForm = () => {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onFormSubmit: SubmitHandler<LoginFormInputs> = async ({ email, password }) => {

    try {
      const result = await signIn('credentials', {
        email,
        password,
        inapp: false,
        callbackUrl: LOGIN_REDIRECT_PATH,
        redirect: false,
      });

      if (result?.error) {
        const errorMessage = ERROR_MESSAGES[result.error] || 'An unknown error occurred';

        if (result.error === 'UNVERIFIED_EMAIL') {
          router.push(`/unverified-account`);
        }

        toast({
          variant: 'destructive',
          title: 'Unable to sign in',
          description: errorMessage,
        });

        setError(errorMessage);
        return;
      }

      if (!result?.url) {
        throw new Error('An unknown error occurred');
      }
      
      router.push(result.url);
      
    } catch (err) {
      toast({
        title: 'An unknown error occurred',
        description: 'We encountered an unknown error while attempting to sign you in. Please try again later.',
      });
      setError('An unknown error occurred. Please try again later.');
    }
  };

  return (
    <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit(onFormSubmit)}>
      <div>
        <label htmlFor="email" className="block mb-2 text-sm font-light text-gray-900">
          Your email
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="bg-gray-50 border border-gray-300 sm:text-sm rounded-lg focus:ring-black focus:border-black block w-full p-2.5 text-black placeholder:text-gray-500"
          style={{ background: '#F9FAFB' }}
          placeholder="name@company.com"
        />
        {errors.email && (
          <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block mb-2 text-sm font-light text-gray-900">
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          placeholder="Enter your password"
          className="bg-gray-50 border border-gray-300 sm:text-sm rounded-lg focus:ring-black focus:border-black block w-full p-2.5 text-black placeholder:text-gray-500"
          style={{ background: '#F9FAFB' }}
        />
        {errors.password && (
          <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <div></div>

        <Link href="/forgot-password2" tabIndex={-1} className="text-gray-700 hover:underline text-sm font-medium">
          Forgot password?
        </Link>
      </div>

      <button type="submit" className="btn-primary bg-[#2ae8d3] w-full ">
        Sign in
      </button>
    </form>
  );
};
