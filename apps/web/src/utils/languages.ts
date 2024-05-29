export const languages : {text :string ,code : string , label : string}[]= [
    { code: 'en', label: 'English' , text : 'english'},
    { code: 'pt', label: 'Português', text : 'portuguese' },
    { code: 'es', label: 'Español' , text : 'spanish'},
    { code: 'fr', label: 'Français' , text : 'french'},
    { code: 'it', label: 'Italiano' , text : 'italian'},
    { code: 'nl', label: 'Nederlands', text : 'dutch' },
    { code: 'de', label: 'Deutsch', text : 'german' },
  ];

  export const locales =languages.map((lang)=>lang.code);
 