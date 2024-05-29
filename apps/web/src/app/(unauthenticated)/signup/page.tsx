"use client";

import { useEffect, useState } from 'react';
import { Navigation } from '~/components/Navigation';
import SignupForm from '~/components/forms/signup2';

let codeRun = false;

export default function PageSignup() {
  const [langBtnState, setLangBtnState] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [navOpen, setNavOpen] = useState<boolean>(false);
  const [isLangBtnHovered, setIsLangBtnHovered] = useState(false);
  const [langOpen, setLangOpen] = useState<boolean>(false);
  const [welcomeBack, setWelcomeBack] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
    if (!codeRun) {
      codeRun = true;

      if (typeof window !== "undefined") {
        const isReturningUser = window.localStorage.getItem('hasVisitedBefore2');
        setWelcomeBack(!!isReturningUser);
        if (!isReturningUser) {
          window.localStorage.setItem('hasVisitedBefore2', 'true');
        }

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (!token) {
          setIsAuthorized(false);
        }
      }
    }
  }, []);

  if (!isAuthorized) {
    return (
      <section>
        <div className="flex flex-col items-center justify-center mb-[50px] px-6 py-8 mx-auto  lg:py-0 cera-pro-font no-65">
          <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                Unauthorized
              </h1>
              <p className="text-gray-700">You do not have access to this page.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className='custom-container'>
        <Navigation navOpen={navOpen} langOpen={langOpen} setLangOpen={setLangOpen} setNavOpen={setNavOpen} isHovered={isHovered} setIsHovered={setIsHovered} isLangBtnHovered={isLangBtnHovered} setIsLangBtnHovered={setIsLangBtnHovered} />
      </div>
      <div className="flex flex-col items-center justify-center mb-[50px] px-6 py-8 mx-auto  lg:py-0 cera-pro-font no-65">
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              {welcomeBack ? 'Welcome Back' : 'Welcome'}
            </h1>
            <SignupForm />
          </div>
        </div>
      </div>
    </section>
  );
}
