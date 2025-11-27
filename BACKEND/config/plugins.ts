export default ({ env }: { env: any }) => ({
  comments: {
    enabled: true,
    config: {
      enabledCollections: ['api::postit.postit'], // Abilita i commenti per i postit
      'no-profanity': false, // Disabilita il filtro delle bad words
      badWords: false, // Mantieni anche questo per compatibilità
      moderatorRoles: ['Authenticated'],
      approvalFlow: ['api::postit.postit'],
      entryLabel: {
        '*': ['Title', 'title', 'Name', 'name', 'Subject', 'subject'],
        'api::postit.postit': ['Title', 'title'],
      },
      blockedAuthorProps: ['name', 'email'],
      reportReasons: {
        BAD_LANGUAGE: 'BAD_LANGUAGE',
        DISCRIMINATION: 'DISCRIMINATION',
        OTHER: 'OTHER',
      },
      gql: {
        auth: false, // Permetti query GraphQL senza autenticazione
      },
    },
  },
});
