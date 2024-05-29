"use client";

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@documenso/ui/primitives/use-toast';

const ERROR_MESSAGES: Partial<Record<string, string>> = {
  CREDENTIALS_NOT_FOUND: 'The email or password provided is incorrect',
  INCORRECT_EMAIL_PASSWORD: 'The email or password provided is incorrect',
  USER_MISSING_PASSWORD: 'This account appears to be using a social login method, please sign in using that method',
  INCORRECT_TWO_FACTOR_CODE: 'The two-factor authentication code provided is incorrect',
  INCORRECT_TWO_FACTOR_BACKUP_CODE: 'The backup code provided is incorrect',
  UNVERIFIED_EMAIL: 'This account has not been verified. Please verify your account before signing in.',
};

const SignupSchema = z.object({
  firstName: z.string().nonempty("First name is required"),
  lastName: z.string().nonempty("Last name is required"),
  email: z.string().email("Invalid email address").nonempty("Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").nonempty("Password is required"),
  confirmPassword: z.string().nonempty("Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof SignupSchema>;

export default function SignupForm() {

  const router = useRouter()

  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
  });

  const onSubmit: SubmitHandler<SignupFormData> = async data => {
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        confirmPassword: data.confirmPassword,
        inapp: false,
        callbackUrl: '/documents',
        redirect: false,
      });

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: ERROR_MESSAGES[result.error] || 'An unknown error occurred',
        });
      } else {
        if (result?.url) {
          router.push(result.url);
        }
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unknown error occurred',
      });
    }
  }

  return (
    <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="firstName" className="block mb-2 text-sm font-light text-gray-900">
          First name
        </label>
        <input
          {...register('firstName')}
          type="text"
          id="firstName"
          className="bg-gray-50 border border-gray-300 sm:text-sm rounded-lg focus:ring-black focus:border-black block w-full p-2.5 text-black placeholder:text-gray-500"
          style={{ background: '#F9FAFB' }}
          placeholder="First name"
        />
        {errors.firstName && (
          <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="lastName" className="block mb-2 text-sm font-light text-gray-900">
          Last name
        </label>
        <input
          {...register('lastName')}
          type="text"
          id="lastName"
          className="bg-gray-50 border border-gray-300 sm:text-sm rounded-lg focus:ring-black focus:border-black block w-full p-2.5 text-black placeholder:text-gray-500"
          style={{ background: '#F9FAFB' }}
          placeholder="Last name"
        />
        {errors.lastName && (
          <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>
        )}
      </div>

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

      <div>
        <label htmlFor="confirmPassword" className="block mb-2 text-sm font-light text-gray-900">
          Confirm password
        </label>
        <input
          {...register('confirmPassword')}
          type="password"
          id="confirmPassword"
          placeholder="Confirm your password"
          className="bg-gray-50 border border-gray-300 sm:text-sm rounded-lg focus:ring-black focus:border-black block w-full p-2.5 text-black placeholder:text-gray-500"
          style={{ background: '#F9FAFB' }}
        />
        {errors.confirmPassword && (
          <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button type="submit" className="btn-primary bg-[#2ae8d3] w-full">
        Sign up
      </button>
    </form>
  );
}
