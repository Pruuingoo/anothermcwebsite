# Minecraft Server Points Bridge (Paper)

This plugin replaces the website's direct RCON fulfillment with a server-side poller. It talks to the Your Server HTTPS API using a dedicated bearer secret, claims only verified paid orders in Supabase, executes the PlayerPoints command from the Paper console, then acknowledges the order.

## Build

Requires JDK 21 and Gradle 8. Install Gradle, then run from this directory:

```sh
gradle build
```

The jar is written under `build/libs/MinecraftServerPointsBridge-1.0.0.jar`.

## Install on the Survival Paper backend

1. Stop the **Paper Survival backend** in UltraServers.
2. Upload `MinecraftServerPointsBridge-1.0.0.jar` to that backend's `plugins/` directory. Do not put it on Velocity.
3. Start the backend once to create `plugins/MinecraftServerPointsBridge/config.yml`, then stop it.
4. Set `api-base-url` to `https://your-domain.example`.
5. Set `api-key` to the value configured as `MINECRAFT_SERVER_PLUGIN_API_KEY` in Vercel. Share it only through the server's private config editor; never commit the plugin config.
6. Start the backend. Verify the console logs `Website order polling enabled.`

The plugin invokes only `playerpoints:points give <validated username> <verified amount>` for claimed orders. The key is separate from all Supabase credentials.

When NuVotifier (Paper plugin name `Votifier`) is installed on the same server, the bridge also forwards received vote notifications to the website. Configure each listing's provider name with `MINECRAFT_SERVER_VOTE_SERVICE_1` through `MINECRAFT_SERVER_VOTE_SERVICE_4` so incoming vote notifications match the four generic voting-site slots. The website accepts these notifications only with the same plugin bearer key. If vote events are not needed, set `vote-events-enabled: false` in the plugin config.

## Delivery safety

Orders are atomically claimed before delivery. A failed command is marked `needs_review`, not automatically replayed. If the server or plugin stops after a command executes but before the acknowledgement reaches the website, inspect the in-game balance and order before taking manual action; the system intentionally avoids automatic retries that might duplicate currency.

The website plugin endpoints are:

- `GET /api/plugin/points/pending`
- `POST /api/plugin/points/{orderId}/complete` with `{ "success": true|false }`

Both require `Authorization: Bearer <plugin secret>`.

`POST /api/plugin/votes` records validated NuVotifier events for the four enabled listing sites. Today's, this week's, monthly, total, recent vote, and voter leaderboard figures are calculated from these received provider events; outbound link clicks and imported snapshots are excluded.
