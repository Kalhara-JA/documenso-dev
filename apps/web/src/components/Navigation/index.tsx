import classNames from "classnames";
import Image from "next/image";
import './navigation.css';  
import Link from "next/link";
import { IMAGE_URL } from "~/utils/image_url";
import { routes } from "~/utils/routes";

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
    <nav className="flex w-full justify-between items-center mx-auto pr-[10px] dark">
      <div className="relative font-extrabold text-black">
        <Image
          loader={({ src }) => src}
          alt="logo"
          height={70}
          width={120}
          objectFit="contain"
          className="h-[110px] w-[120px] 2xl:h-[100px] 2xl:w-[150px] object-contain"
          src={`${IMAGE_URL}/assets/day/logo.webp`}
        />
        <div
          className="z-20 absolute h-full w-full rounded-full top-0 cursor-pointer"
          onClick={() => {}}
        ></div>
      </div>

      <div className="flex items-center gap-[25px] mr-[10px]">
        <div
          className={classNames("relative", "dark", "hamburger-container", { navOpen })}
        >
          <div
            className="z-20 absolute h-full w-full rounded-full duration-[800ms] extra-nav"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setNavOpen(!navOpen)}
          ></div>
          <button className={classNames("menu__icon", { "hovered-class": isHovered || navOpen })}>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className={classNames("navigation", "dark")}>
          <input
            type="checkbox"
            className="navigation__checkbox"
            checked={navOpen}
            id="navi-toggle"
            readOnly
          />

          <div className={classNames("navigation__background", { navOpen })}>
            &nbsp;
          </div>

          <nav className="navigation__nav">
            <div className="custom-container flex justify-between min-h-[130px] items-center">
              <div></div>
              <div
                className={classNames("relative", "dark", "hamburger-container", { navOpen })}
              >
                <div
                  className="z-20 absolute w-20 h-20 rounded-full duration-[800ms] extra-nav"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onClick={() => setNavOpen(!navOpen)}
                ></div>
                <button className={classNames("mr-8 menu__icon", { "hovered-class": isHovered || navOpen })}>
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
