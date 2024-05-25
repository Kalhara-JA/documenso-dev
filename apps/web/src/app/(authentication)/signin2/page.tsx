// PageLogin.tsx
"use client";
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const PageLogin = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = (data) => {
    // Handle your login logic here
    console.log('Form submitted:', data);
  };

  return (
    <section>
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0 cera-pro-font no-65">
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              Welcome Back 👋
            </h1>
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-light text-gray-900"
                >
                  Your email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="border border-gray-300 text-gray-900 placeholder:text-gray-900 sm:text-sm rounded-lg focus:ring-black focus:border-black block w-full p-2.5 text-black placeholder:text-gray-500"
                  style={{ background: '#F9FAFB' }}
                  placeholder="name@company.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-light text-gray-900"
                >
                  Password
                </label>
                <input
                  {...register('password')}
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 sm:text-sm rounded-lg focus:ring-black focus:border-black block w-full p-2.5 text-black placeholder:text-gray-500"
                  style={{ background: '#F9FAFB' }}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div></div>

                <Link
                  href="/forgot-password2"
                  tabIndex={-1}
                  className="text-gray-700 hover:underline text-sm font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full text-white bg-[#111827] hover:bg-black focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Sign in
              </button>
              {/* <p className="text-sm font-light text-gray-500">
                Don’t have an account yet?{' '}
                <a
                  href="#"
                  className="font-medium text-black hover:underline"
                >
                  Sign up
                </a>
              </p> */}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageLogin;
