# AnotherMCWebsite

A responsive Minecraft server website template built with Next.js. It retains the full multi-page layout, voting portal, staff area, store, blog, suggestions, and admin interface from the source design, with server-specific identity, addresses, and credentials replaced by configuration placeholders.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:3000`.

## Customize

- Copy `.env.example` to `.env.local` and configure the server identity, address, and external services you intend to use.
- Configure voting site URLs with `NEXT_PUBLIC_VOTE_SITE_1_URL` through `NEXT_PUBLIC_VOTE_SITE_4_URL`.
- Replace `public/server-placeholder.svg` with your server mark.
- Customize the page copy and theme in `data/site-pages.json`, `app/`, and `public/reference/custom.css`.

No real credentials, player data, staff identities, or provider account URLs are included. Database-backed pages show setup states until you connect your own Supabase project and apply a schema for your deployment. Payment processing is disabled until you configure your own provider credentials.
