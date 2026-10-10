# REST API

All responses are JSON except puzzle images. Login cookie authentication protects game routes. Requests that mutate state use `Content-Type: application/json`; authenticated mutations include `X-CSRF-Token` from login or `/api/auth/me`. The configured origin must match the browser origin.

| Method | Path | Purpose |
|---|---|---|
| GET | /api/levels | Difficulty settings and storage mode |
| POST | /api/auth/register | Create identity with username and password |
| POST | /api/auth/login | Authenticate; set cookie and return csrf token |
| GET | /api/auth/me | Get current username and csrf token |
| POST | /api/auth/logout | Revoke session and clear cookie |
| POST | /api/game/start | Start or replace current game with level |
| GET | /api/game | Synchronize state, check expiry and save final result |
| GET | /api/game/image/:id | Serve the current puzzle image for its owner |
| POST | /api/game/ready | Resume timer after image load with puzzleId |
| POST | /api/game/answer | Submit puzzleId, fish and chest |
| POST | /api/game/hint | Reveal fish count for puzzleId |
| GET | /api/leaderboard/:level | Top 10 players' best winning scores |

Example answer request: `{ "puzzleId": "server-issued-id", "fish": 3, "chest": 2 }`.

Public game state contains id, level, status, remainingMs, lives, hints, progress, target, score, puzzleId and source. A requested hint adds hintFish. Final states include rating and reason. An answer response also includes correct. No request-supplied score, timer, lives or progress is accepted.

400: invalid input. 401: missing or expired identity. 403: rejected origin or CSRF. 404: missing game or image. 409: stale puzzle, ended game or conflicting request. 429: authentication rate limit or lockout. 500: unexpected server or storage failure.
