import Image from 'next/image';
import Link from 'next/link';

import classNames from 'classnames';

import { IMAGE_URL } from '~/utils/image_url';
import { routes } from '~/utils/routes';

import './navigation.css';

interface NavigationProps {
  navOpen: boolean;
  langOpen: boolean;
  setLangOpen: (value: boolean) => void;
  setNavOpen: (value: boolean) => void;
  isHovered: boolean;
  setIsHovered: (value: boolean) => void;
  isLangBtnHovered: boolean;
  setIsLangBtnHovered: (value: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  navOpen,
  langOpen,
  setLangOpen,
  setNavOpen,
  isHovered,
  setIsHovered,
  isLangBtnHovered,
  setIsLangBtnHovered,
}) => {
  return (
    <nav className="dark mx-auto flex w-full items-center justify-between pr-[10px] main-nav">
      <div className="relative font-extrabold text-black">
        <Image
          loader={({ src }) => src}
          alt="logo"
          height={70}
          width={120}
          objectFit="contain"
          className="h-[110px] w-[120px] object-contain 2xl:h-[100px] 2xl:w-[150px]"
          src={`${IMAGE_URL}/assets/day/logo.webp`}
        />
        <div
          className="absolute top-0 z-20 h-full w-full cursor-pointer rounded-full"
          onClick={() => {}}
        ></div>
      </div>

      <div className="mr-[10px] flex items-center gap-[25px]">
        <div className={classNames('relative', 'dark', 'hamburger-container', { navOpen })}>
          <div
            className="extra-nav absolute z-20 h-full w-full rounded-full duration-[800ms]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setNavOpen(!navOpen)}
          ></div>
          <button className={classNames('menu__icon', { 'hovered-class': isHovered || navOpen })}>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className={classNames('navigation', 'dark')}>
          <input
            type="checkbox"
            className="navigation__checkbox"
            checked={navOpen}
            id="navi-toggle"
            readOnly
          />

          <div className={classNames('navigation__background', { navOpen })}>&nbsp;</div>

          <nav className="navigation__nav">
            <div className="custom-container flex min-h-[130px] items-center justify-between">
              <div></div>
              <div className={classNames('relative', 'dark', 'hamburger-container', { navOpen })}>
                <div
                  className="extra-nav absolute z-20 h-20 w-20 rounded-full duration-[800ms]"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onClick={() => setNavOpen(!navOpen)}
                ></div>
                <button
                  className={classNames('menu__icon mr-8', {
                    'hovered-class': isHovered || navOpen,
                  })}
                >
                  <span></span>
                  <span></span>
                </button>
              </div>
            </div>

            <ul className="navigation__list flex flex-col">
              <li className="navigation__item">
                <Link href={routes['en']['home']} className="inline-block">
                  <span className="navigation__link">Home</span>
                </Link>
              </li>
              <li className="navigation__item">
                <Link href={routes['en']['about-us']} className="inline-block">
                  <span className="navigation__link">About Us</span>
                </Link>
              </li>
              <li className="navigation__item">
                <Link href={routes['en']['our-studies']} className="inline-block">
                  <span className="navigation__link">Our Studies</span>
                </Link>
              </li>
              <li className="navigation__item">
                <Link href={routes['en']['terms-of-use']} className="inline-block">
                  <span className="navigation__link">Terms of Service</span>
                </Link>
              </li>
              {routes['en']['cookies'] && (
                <li className="navigation__item">
                  <Link href={routes['en']['cookies']} className="inline-block">
                    <span className="navigation__link">Cookies Policy</span>
                  </Link>
                </li>
              )}
              <li className="navigation__item">
                <Link href={routes['en']['privacy']} className="inline-block">
                  <span className="navigation__link">Privacy Policy</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </nav>
  );
};
