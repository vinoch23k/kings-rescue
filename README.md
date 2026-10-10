# King's Rescue

A playable underwater counting game implemented from the supplied proposal for CIS045-3 Distributed Service Architectures. It includes three levels, animated SVG characters, Fish Game API integration, server-controlled rules, account registration, cookie sessions and separate leaderboards. This package was created with AI assistance; see `AI_DISCLOSURE.md` before using it for coursework.

## Start with MongoDB

Requirements: Node.js 22 or newer, npm, and a running MongoDB server. Install MongoDB locally or use the included Docker Compose configuration.

1. Open this folder in VS Code and open its terminal.
2. Run `npm install` (or `npm ci` for the exact locked dependencies).
3. Copy `.env.example` to `.env`. Windows PowerShell: `Copy-Item .env.example .env`. macOS/Linux: `cp .env.example .env`.
4. Start MongoDB. If Docker is installed, run `docker compose up -d`.
5. Keep `STORAGE_MODE=mongo`, and set `MONGODB_URI` if using a different server. For Atlas use your own connection string; do not commit `.env`.
6. Run `npm start` and open **http://localhost:3000**.
7. Create an account, sign in, and choose a level. There are no built-in accounts or shared passwords.

The app fails clearly when MongoDB is unavailable rather than silently changing storage. Docker binds the development database to localhost. This Compose configuration is for local development.

## Try without MongoDB

For a single-process local demonstration, change `.env` to `STORAGE_MODE=file`. Accounts, hashed passwords, sessions and scores persist in `data/store.json`. This mode is labelled in the interface. It demonstrates the application but is not evidence that MongoDB integration has been tested.

To play offline immediately, set `OFFLINE_PUZZLES=true`. For the assignment's external-service demonstration, set it back to `false` and run `npm run check:api`. The diagnostic prints the actual puzzle source and returns a failure exit code if only fallback works.

## Play

- Enter the number of **fish** and **treasure chests**. Both counts must be correct.
- A correct answer earns 10 points and 5 seconds, and advances one checkpoint.
- A wrong answer removes one life and gives a new puzzle. Existing progress stays.
- Hints reveal the fish count only. Reusing a hint on the same puzzle costs nothing further.
- Puzzle loading pauses the clock. A puzzle must become ready within 45 seconds; an abandoned loading screen cannot pause a game forever.
- Complete 8, 10 or 15 correct answers for Easy, Medium or Hard.
- Starting times: 60, 40 and 30 seconds. Every level starts with 3 lives; hints are 3, 2 and 1.
- Winning adds a bonus: 3 lives = 50, 2 lives = 30, 1 life = 10.
- Each leaderboard shows the best successful score per player. Equal scores are ordered by the time the score was recorded.

Returning to levels leaves the current round running; choosing another level replaces it. Refreshing can resume the current game in the same server process. Server restart ends unfinished games. Completed scores and user identities persist.

## Verify

```bash
npm test
npm run check:api
```

The automated suite verifies level configuration, all nine level/bonus combinations, timer races, paused loading, hint limits, lost lives, response privacy, stale puzzle rejection, API fallback, login, cookies, CSRF and score persistence through the HTTP API. The HTTP tests use an injected memory repository; validate MongoDB on your own running database before recording the final video.

## Project layout

```text
src/level-config.js       Difficulty settings
src/game-engine.js        Rules and server clock
src/event-bus.js          Server game events
src/fish-api-client.js     External API adapter and local puzzle fallback
src/auth-service.js       Password hashing, sessions and lockout
src/stats-repository.js   MongoDB and explicit local demo storage
src/server.js             Express routes and application composition
public/app.js             Browser UI controller and custom events
public/art.js             Original SVG characters and rescue animation
public/style.css          Responsive layout and CSS animation
public/event-bus.js       Browser event dispatcher
scripts/check-api.js      Live external-service diagnostic
 tests/                   Rules, adapter and HTTP integration tests
 docs/                    Architecture, API, video and verification guides
```

## Configuration

`APP_ORIGIN` must match the URL used in the browser. If changing port, change both `PORT` and `APP_ORIGIN`. Cookies use `HttpOnly` and `SameSite=Strict`; production mode adds `Secure`, so production needs HTTPS. Mutations require JSON and authenticated mutations also require the per-session CSRF token.

The API endpoint is `https://marcconrad.com/uob/fish/api.php`. Its `question`, `fish` and `chest` fields were confirmed with a live response on 8 October 2026. The observed image host was `www.sanfoh.com`; image requests are limited to the explicit host allowlist. Redirects, unexpected MIME types, malformed counts and oversized images cause fallback. Network calls use a configurable timeout and one retry. If a slow network causes fallback, try `FISH_TIMEOUT_MS=15000`; the 45-second loading cap still applies. No original upstream URL or answer counts are exposed in public puzzle state, except a fish count intentionally requested as a hint.

## Practical limits

This is a single-server coursework implementation. Active games, per-user request locks and login lockouts are held in memory; a distributed deployment would require shared game state and rate limiting. The database persists accounts, sessions and finished results. A trusted browser acknowledges image readiness; the 45-second loading guard limits abuse but cannot prove what a browser actually rendered. Sessions do not prevent every form of automated play or image counting. MongoDB integration needs a real database verification, and the upstream service may be temporarily unreachable.

Do not claim this code is entirely your own. Study and adapt it, retain its AI attribution, and record the video in your own voice as the proposal requires.
