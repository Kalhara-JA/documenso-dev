// ForgetPass.tsx
"use client";
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import type { ReactNode} from 'react';
import { useState } from 'react';
import { Navigation } from '~/components/Navigation';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const ForgetPass = () => {
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
    // loginCheck(data.email, data.password);
  };
  const [langBtnState , setLangBtnState]= useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [navOpen , setNavOpen] = useState<boolean>(false);
  const [isLangBtnHovered , setIsLangBtnHovered] = useState(false);


  const [langOpen , setLangOpen] = useState<boolean>(false);


  return (
    <section>
    <div className='custom-container'>
    <Navigation navOpen={navOpen} langOpen={langOpen} setLangOpen={setLangOpen} setNavOpen={setNavOpen} isHovered={isHovered} setIsHovered={setIsHovered} isLangBtnHovered={isLangBtnHovered} setIsLangBtnHovered={setIsLangBtnHovered} />
      </div>
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto mt-[50px] lg:py-0 cera-pro-font no-65">
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              Forget Password
            </h1>
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-light text-gray-900"
                >
                  Your Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-black focus:border-black block w-full p-2.5 text-black placeholder:text-gray-500"
                  style={{ background: '#F9FAFB' }}
                  placeholder="name@company.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message as ReactNode}</p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary bg-[#2ae8d3] w-full "
              >
                Send reset email
              </button>
              <p className="text-sm font-light text-gray-500">
                <Link
                  href="/signin2"
                  className="font-medium text-black text-sm hover:underline"
                >
                  Back to sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgetPass;
