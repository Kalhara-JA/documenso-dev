
import React from 'react'
import { routes } from '~/utils/routes';

const useLinks = () => {
  
    const locale = 'en';
    const t  = (str:string)=>str;


    const menuNavigationLinks = [
        {
          href: routes[locale]['resources'],
          text: t('Resources'),
        },
        {
          href: routes[locale]['store'],
          text: t('Store'),
        },
        {
          href: routes[locale]['plans'],
          text: t('Plans'),
        },
        {
          href: routes[locale]['appointments'],
          text: t('Appointments'),
        },
        {
            href: routes[locale]['payments'],
            text: t('Payments'),
          },
          {
            href: routes[locale]['documents'],
            text: t('Documents'),
          },
      ];

    // const menuNavigationLinks = [];
  return {menuNavigationLinks};
}

export default useLinks