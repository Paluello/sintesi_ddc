/**
 * comment controller - Custom controller for plugin comments
 */

export default {
  async find(ctx: any) {
    try {
      // Logging per debug
      console.log('Comment.find - Query params:', JSON.stringify(ctx.query, null, 2));
      
      // Costruisci i filtri nel formato corretto per Strapi 5
      // In Strapi 5, entityService.findMany accetta filtri diretti o con operatori
      const filters: any = {};
      
      // Filtro per related
      if (ctx.query['filters[related][$eq]']) {
        filters.related = ctx.query['filters[related][$eq]'];
      }
      
      // Filtro per approvalStatus
      if (ctx.query['filters[approvalStatus][$eq]']) {
        filters.approvalStatus = ctx.query['filters[approvalStatus][$eq]'];
      } else {
        // Default: solo commenti approvati
        filters.approvalStatus = 'APPROVED';
      }
      
      // Filtro per removed
      if (ctx.query['filters[removed][$eq]'] !== undefined) {
        const removedValue = ctx.query['filters[removed][$eq]'] === 'true' || ctx.query['filters[removed][$eq]'] === true;
        filters.removed = removedValue;
      } else {
        // Default: solo commenti non rimossi
        filters.removed = false;
      }
      
      // Parse sort
      const sort = ctx.query.sort || 'createdAt:asc';
      const [sortField, sortOrder] = sort.split(':');
      
      const sortObj: any = {};
      sortObj[sortField] = sortOrder === 'desc' ? 'desc' : 'asc';
      
      // Logging dei filtri costruiti
      console.log('Comment.find - Filters:', JSON.stringify(filters, null, 2));
      console.log('Comment.find - Sort:', JSON.stringify(sortObj, null, 2));
      
      // Usa entityService per recuperare i commenti direttamente dal database
      const comments = await ctx.strapi.entityService.findMany('plugin::comments.comment', {
        filters,
        sort: sortObj,
      });
      
      console.log(`Comment.find - Trovati ${comments?.length || 0} commenti`);
      
      return ctx.send({ data: comments || [] });
    } catch (error: any) {
      // Logging dettagliato dell'errore
      console.error('Errore nel controller comment.find:', {
        message: error?.message,
        stack: error?.stack,
        details: error?.details,
        query: ctx.query,
      });
      
      ctx.throw(500, error?.message || 'Errore interno del server');
    }
  },

  async create(ctx: any) {
    try {
      const bodyData = ctx.request.body.data || ctx.request.body;
      const { content, related, approvalStatus = 'APPROVED' } = bodyData;
      
      // Logging per debug
      console.log('Comment.create - Request body:', JSON.stringify(bodyData, null, 2));
      
      // Validazione campi obbligatori
      if (!content || !related) {
        return ctx.badRequest('content e related sono obbligatori');
      }
      
      // Validazione formato related (dovrebbe essere api::postit.postit:id)
      if (!related.match(/^api::[\w-]+\.[\w-]+:\d+$/)) {
        return ctx.badRequest('Il formato di related non è valido. Dovrebbe essere: api::postit.postit:id');
      }
      
      const user = ctx.state.user;
      
      // Prepara i dati per la creazione del commento
      const commentData: any = {
        content: String(content).trim(),
        related: String(related),
        approvalStatus: String(approvalStatus).toUpperCase(),
        // Assicurati che tutti i campi booleani siano valori booleani veri
        removed: false,
        blocked: false,
        blockedThread: false,
      };
      
      // Gestione utente autenticato
      if (user && user.id) {
        commentData.authorId = String(user.id);
        commentData.authorName = String(user.username || user.email || 'Utente');
        commentData.authorEmail = user.email ? String(user.email) : `user${user.id}@example.com`;
        // Imposta la relazione authorUser solo se l'utente è autenticato
        // Per le relazioni oneToOne in Strapi 5, passiamo direttamente l'ID numerico
        commentData.authorUser = Number(user.id);
      } else {
        // Utente anonimo - non includere authorUser per evitare errori di relazione
        commentData.authorId = 'anonimo';
        commentData.authorName = 'Anonimo';
        // Assicurati che authorEmail sia un'email valida anche per utenti anonimi
        commentData.authorEmail = 'anonimo@example.com';
        // Non impostare authorUser per utenti anonimi (sarà null di default)
      }
      
      // Logging per debug
      console.log('Comment.create - Dati preparati:', {
        content: commentData.content.substring(0, 50) + '...',
        related: commentData.related,
        approvalStatus: commentData.approvalStatus,
        authorId: commentData.authorId,
        authorName: commentData.authorName,
        authorEmail: commentData.authorEmail,
        removed: commentData.removed,
        blocked: commentData.blocked,
        blockedThread: commentData.blockedThread,
        hasAuthorUser: commentData.authorUser !== undefined,
        authorUser: commentData.authorUser,
      });
      
      // Usa entityService per creare il commento direttamente nel database
      const comment = await ctx.strapi.entityService.create('plugin::comments.comment', {
        data: commentData,
      });
      
      console.log('Comment.create - Commento creato con successo:', {
        id: comment?.id,
        related: comment?.related,
      });
      
      return ctx.send({ data: comment });
    } catch (error: any) {
      // Logging dettagliato dell'errore
      console.error('Errore nel controller comment.create:', {
        message: error?.message,
        stack: error?.stack,
        details: error?.details,
        body: ctx.request.body,
        user: ctx.state.user ? { id: ctx.state.user.id, username: ctx.state.user.username } : 'anonimo',
      });
      
      // Restituisci un messaggio di errore più informativo
      const errorMessage = error?.message || 'Errore interno del server durante la creazione del commento';
      ctx.throw(500, errorMessage);
    }
  },

  async findOne(ctx: any) {
    try {
      const { id } = ctx.params;
      
      // Usa entityService per recuperare il commento direttamente dal database
      const comment = await ctx.strapi.entityService.findOne('plugin::comments.comment', id);
      
      if (!comment) {
        return ctx.notFound('Commento non trovato');
      }
      
      return ctx.send({ data: comment });
    } catch (error: any) {
      console.error('Errore nel controller comment.findOne:', error);
      ctx.throw(500, error?.message || 'Errore interno del server');
    }
  },
};

