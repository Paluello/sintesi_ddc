/**
 * Middleware per autenticazione opzionale
 * Verifica il token JWT se presente, ma non blocca se assente
 */
export default (config: any, { strapi }: any) => {
  return async (ctx: any, next: any) => {
    try {
      // Verifica se c'è un token nell'header Authorization
      const authHeader = ctx.request.header.authorization || ctx.request.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          // Verifica il token usando il servizio di users-permissions
          const jwtService = strapi.plugin('users-permissions').service('jwt');
          const userService = strapi.plugin('users-permissions').service('user');
          
          const decodedToken = await jwtService.verify(token);
          const user = await userService.fetch(decodedToken.id);
          
          if (user && !user.blocked) {
            ctx.state.user = user;
          }
        } catch (error) {
          // Token non valido o scaduto, ma non blocchiamo la richiesta
          // ctx.state.user rimane undefined
          console.log('Token JWT non valido o scaduto:', error);
        }
      }
    } catch (error) {
      // Errore nel middleware, ma non blocchiamo la richiesta
      console.log('Errore nel middleware optional-auth:', error);
    }
    
    await next();
  };
};

