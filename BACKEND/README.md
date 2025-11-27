# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

## ⚙️ Configurazione iniziale

Prima di avviare il progetto, è necessario creare un file `.env` con le variabili d'ambiente necessarie.

### Opzione 1: Generazione automatica (consigliata)

Esegui lo script di generazione automatica:

```bash
./generate-env.sh
```

Questo script creerà automaticamente un file `.env` con tutti i secret necessari generati in modo sicuro.

### Opzione 2: Creazione manuale

1. Copia il file di esempio:
```bash
cp .env.example .env
```

2. Genera i secret necessari usando `openssl`:
```bash
# Genera ADMIN_JWT_SECRET
openssl rand -base64 32

# Genera API_TOKEN_SALT
openssl rand -base64 32

# Genera TRANSFER_TOKEN_SALT
openssl rand -base64 32

# Genera ENCRYPTION_KEY
openssl rand -base64 32

# Genera APP_KEYS (ripeti 4 volte e separa con virgola)
openssl rand -base64 32
```

3. Apri il file `.env` e inserisci i valori generati.

**⚠️ IMPORTANTE**: Il file `.env` contiene informazioni sensibili e non deve essere committato nel repository. È già incluso nel `.gitignore`.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
