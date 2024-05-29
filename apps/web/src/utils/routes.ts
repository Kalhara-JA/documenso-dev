interface LanguageRoutes {
  home: string;
  "about-us": string;
  "enlist-form": string;
  cookies?: string;
  privacy: string;
  "terms-of-use": string;
  "enlist-form-path"?: string;
  "our-studies": string;
}

interface Routes {
  en: LanguageRoutes;
  de: LanguageRoutes;
  nl: LanguageRoutes;
  fr: LanguageRoutes;
  es: LanguageRoutes;
  pt: LanguageRoutes;
  it: LanguageRoutes;
}

// Assuming your routes object is defined like this:
export const routes: Routes = {
  "en": {
    "home": "/home",
    "about-us": "/about-us",
    "enlist-form": "/enlist-form",
    "enlist-form-path": "/enlist-form/:path*",
    "cookies": "/cookies",
    "privacy": "/privacy",
    "terms-of-use": "/terms-of-use",
    "our-studies": "/our-studies"
  },
  "de": {
    "home": "/startseite",
    "about-us": "/ueber-uns",
    "enlist-form": "/registrierungsformular",
    "cookies": "/datenschutzbestimmungen",
    "privacy": "/datenschutz",
    "terms-of-use": "/nutzungsbedingungen",
    "our-studies": "/unsere-studien"
  },
  "nl": {
    "home": "/startpagina",
    "about-us": "/over-ons",
    "enlist-form": "/inschrijfformulier",
    "cookies": "/cookiebeleid",
    "privacy": "/privacybeleid",
    "terms-of-use": "/gebruiksvoorwaarden",
    "our-studies": "/onze-studies"
  },
  "fr": {
    "home": "/accueil",
    "about-us": "/a-propos",
    "enlist-form": "/formulaire-d-inscription",
    "cookies": "/politique-de-cookies",
    "privacy": "/confidentialite",
    "terms-of-use": "/conditions-d-utilisation",
    "our-studies": "/nos-etudes"
  },
  "es": {
    "home": "/inicio",
    "about-us": "/sobre-nosotros",
    "enlist-form": "/formulario-de-inscripcion",
    "cookies": "/politica-de-cookies",
    "privacy": "/privacidad",
    "terms-of-use": "/terminos-de-uso",
    "our-studies": "/nuestros-estudios"
  },
  "pt": {
    "home": "/pagina-inicial",
    "about-us": "/sobre-nos",
    "enlist-form": "/formulario-de-inscricao",
    "cookies": "/politica-dos-cookies",
    "privacy": "/privacidade",
    "terms-of-use": "/termos-de-uso",
    "our-studies": "/nossos-estudos"
  },
  "it": {
    "home": "/casa",
    "about-us": "/chi-siamo",
    "enlist-form": "/modulo-di-iscrizione",
    "cookies": "/politica-sui-cookie",
    "privacy": "/informativa-sulla-privacy",
    "terms-of-use": "/termini-di-utilizzo",
    "our-studies": "/nostri-studi"
  }
}

export type LocalActiveType = keyof Routes;
