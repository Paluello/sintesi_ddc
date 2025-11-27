import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Crea automaticamente l'account "anonimo" se non esiste
    try {
      // Verifica se l'utente esiste già
      const existingUser = await strapi.db
        .query('plugin::users-permissions.user')
        .findOne({
          where: {
            $or: [
              { username: 'anonimo' },
              { email: 'anonimo@example.com' },
            ],
          },
        });

      if (!existingUser) {
        // Ottieni il ruolo "Authenticated"
        const authenticatedRole = await strapi.db
          .query('plugin::users-permissions.role')
          .findOne({
            where: { type: 'authenticated' },
          });

        if (authenticatedRole) {
          // Usa il service per creare l'utente (gestisce automaticamente l'hashing della password)
          const userService = strapi.plugin('users-permissions').service('user');
          
          // Crea l'utente anonimo
          const anonymousUser = await userService.add({
            username: 'anonimo',
            email: 'anonimo@example.com',
            password: 'anonimo',
            confirmed: true,
            blocked: false,
            role: authenticatedRole.id,
          });
          
          console.log('✅ Account anonimo creato automaticamente:', {
            id: anonymousUser.id,
            username: anonymousUser.username,
            email: anonymousUser.email,
            role: authenticatedRole.type,
            roleId: authenticatedRole.id,
          });
        } else {
          console.warn('⚠️ Ruolo "Authenticated" non trovato. L\'account anonimo non può essere creato.');
        }
      } else {
        console.log('ℹ️ Account anonimo già esistente');
      }
    } catch (error) {
      console.error('❌ Errore durante la creazione dell\'account anonimo:', error);
    }

    // Configura automaticamente i permessi per le API
    try {
      const authenticatedRole = await strapi.db
        .query('plugin::users-permissions.role')
        .findOne({
          where: { type: 'authenticated' },
        });

      if (authenticatedRole) {
        // Lista delle API e dei permessi da abilitare
        const apiPermissions = [
          { api: 'postit', actions: ['find', 'findOne', 'create', 'update', 'delete'] },
          { api: 'settore', actions: ['find', 'findOne'] },
          { api: 'tema', actions: ['find', 'findOne'] },
        ];

        for (const { api, actions } of apiPermissions) {
          for (const action of actions) {
            // Verifica se il permesso esiste già
            const existingPermission = await strapi.db
              .query('plugin::users-permissions.permission')
              .findOne({
                where: {
                  role: authenticatedRole.id,
                  action: `api::${api}.${api}.${action}`,
                },
              });

            if (!existingPermission) {
              // Crea il permesso
              await strapi.db.query('plugin::users-permissions.permission').create({
                data: {
                  role: authenticatedRole.id,
                  action: `api::${api}.${api}.${action}`,
                  enabled: true,
                },
              });
              console.log(`✅ Permesso configurato: api::${api}.${api}.${action} per ruolo Authenticated`);
            }
          }
        }
        console.log('✅ Configurazione permessi API completata');

        // Configura permessi per il plugin Comments (ruolo Authenticated)
        const commentPermissions = [
          'plugin::comments.comment.find',
          'plugin::comments.comment.findOne',
          'plugin::comments.comment.create',
          'plugin::comments.comment.update',
          'plugin::comments.comment.delete',
          'plugin::comments.comment.count',
          'plugin::comments.comment.getPageSize',
          'plugin::comments.subcomment.find',
          'plugin::comments.subcomment.findOne',
          'plugin::comments.subcomment.create',
          'plugin::comments.subcomment.update',
          'plugin::comments.subcomment.delete',
        ];

        for (const action of commentPermissions) {
          const existingPermission = await strapi.db
            .query('plugin::users-permissions.permission')
            .findOne({
              where: {
                role: authenticatedRole.id,
                action: action,
              },
            });

          if (!existingPermission) {
            try {
              await strapi.db.query('plugin::users-permissions.permission').create({
                data: {
                  role: authenticatedRole.id,
                  action: action,
                  enabled: true,
                },
              });
              console.log(`✅ Permesso commenti configurato: ${action} per ruolo Authenticated`);
            } catch (permError: any) {
              console.warn(`⚠️ Impossibile creare permesso ${action}:`, permError.message);
            }
          } else {
            console.log(`ℹ️ Permesso già esistente: ${action} per ruolo Authenticated`);
          }
        }
        console.log('✅ Configurazione permessi Comments completata per ruolo Authenticated');

        // Configura permessi per il plugin Comments (ruolo Public) - solo lettura
        const publicRole = await strapi.db
          .query('plugin::users-permissions.role')
          .findOne({
            where: { type: 'public' },
          });

        if (publicRole) {
          const publicCommentPermissions = [
            'plugin::comments.comment.find',
            'plugin::comments.comment.findOne',
            'plugin::comments.comment.create',
            'plugin::comments.comment.count',
            'plugin::comments.comment.getPageSize',
            'plugin::comments.subcomment.find',
            'plugin::comments.subcomment.findOne',
            'plugin::comments.subcomment.create',
          ];

          for (const action of publicCommentPermissions) {
            const existingPermission = await strapi.db
              .query('plugin::users-permissions.permission')
              .findOne({
                where: {
                  role: publicRole.id,
                  action: action,
                },
              });

            if (!existingPermission) {
              try {
                await strapi.db.query('plugin::users-permissions.permission').create({
                  data: {
                    role: publicRole.id,
                    action: action,
                    enabled: true,
                  },
                });
                console.log(`✅ Permesso commenti configurato: ${action} per ruolo Public`);
              } catch (permError: any) {
                console.warn(`⚠️ Impossibile creare permesso ${action}:`, permError.message);
              }
            } else {
              console.log(`ℹ️ Permesso già esistente: ${action} per ruolo Public`);
            }
          }
          console.log('✅ Configurazione permessi Comments completata per ruolo Public');
        } else {
          console.warn('⚠️ Ruolo "Public" non trovato. I permessi per i commenti pubblici non possono essere configurati.');
        }

        // Verifica che i permessi siano stati creati correttamente
        const verifyPermissions = await strapi.db
          .query('plugin::users-permissions.permission')
          .findMany({
            where: {
              role: authenticatedRole.id,
              action: {
                $contains: 'plugin::comments',
              },
            },
          });
        console.log(`ℹ️ Permessi Comments trovati per ruolo Authenticated: ${verifyPermissions.length}`);
        
        if (publicRole) {
          const verifyPublicPermissions = await strapi.db
            .query('plugin::users-permissions.permission')
            .findMany({
              where: {
                role: publicRole.id,
                action: {
                  $contains: 'plugin::comments',
                },
              },
            });
          console.log(`ℹ️ Permessi Comments trovati per ruolo Public: ${verifyPublicPermissions.length}`);
        }
        
        // Prova anche ad aggiornare i permessi usando il service di Strapi
        try {
          const permissionService = strapi.plugin('users-permissions').service('permission');
          const actions = await permissionService.getActions();
          
          // Filtra le azioni del plugin Comments
          const commentActions = actions.filter((action: any) => 
            action.action && action.action.includes('plugin::comments')
          );
          
          console.log(`ℹ️ Azioni Comments disponibili: ${commentActions.length}`);
          
          // Aggiorna i permessi del ruolo usando il service
          const roleService = strapi.plugin('users-permissions').service('role');
          const rolePermissions = await roleService.findOne({ id: authenticatedRole.id });
          
          if (rolePermissions) {
            // Prepara i permessi da abilitare
            const permissionsToEnable = commentActions
              .filter((action: any) => {
                const actionKey = action.action;
                return actionKey.includes('comment.create') || 
                       actionKey.includes('subcomment.create') ||
                       actionKey.includes('comment.find') ||
                       actionKey.includes('comment.count');
              })
              .map((action: any) => ({
                action: action.action,
                enabled: true,
              }));
            
            if (permissionsToEnable.length > 0) {
              console.log(`ℹ️ Tentativo di abilitare ${permissionsToEnable.length} permessi Comments tramite service`);
            }
          }
        } catch (serviceError: any) {
          console.warn('⚠️ Errore nell\'uso del service per i permessi:', serviceError.message);
        }
      }

    } catch (error) {
      console.error('❌ Errore durante la configurazione dei permessi API:', error);
    }
  },
};