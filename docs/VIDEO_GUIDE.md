# Ten minute demonstration guide

Record this video yourself and use your own voice. This outline is a preparation aid; understand the code and adapt the wording to what you actually ran.

| Time | Demonstration | Code to explain |
|---|---|---|
| 0:00–0:45 | Introduce the trapped king and rescue objective | README and level configuration |
| 0:45–2:30 | Register, sign in, choose Easy, solve a puzzle, use a hint, show a wrong answer | Browser forms and game screen |
| 2:30–3:20 | Show a winning result and separate leaderboards; explain victory bonuses | GameEngine end and StatsRepository leaderboard |
| 3:20–4:40 | Explain low coupling and high cohesion, compare with a single-file alternative | GameEngine, FishApiClient, AuthService |
| 4:40–6:00 | Explain DOM events, timer callbacks, custom events and asynchronous fetch | public/event-bus.js, public/app.js, src/event-bus.js |
| 6:00–7:20 | Show a successful live API diagnostic, JSON contract and protected image flow | FishApiClient and image route |
| 7:20–8:10 | Force offline mode and show labelled fallback; discuss timeout and retry | OFFLINE_PUZZLES and localPuzzle |
| 8:10–9:20 | Show MongoDB records, hashed password and cookie flags; discuss virtual identity | AuthService, sessions and CSRF |
| 9:20–10:00 | Run tests, state single-instance limits and acknowledge AI assistance | tests and AI_DISCLOSURE |

## Before recording

1. Read and adapt every component you plan to explain.
2. Run with MongoDB and verify records persist after restart.
3. Verify `npm run check:api` prints `source: api`. If unavailable, explain the outage honestly; a fallback run cannot establish live integration.
4. Prepare enough time to complete a real level; use the timer bonuses, not altered game rules.
5. Avoid exposing `.env`, session tokens, database credentials or personal passwords in the video.
6. Keep screenshots and screen recordings of your actual work. Start a real Git repository and commit your actual changes; this package does not fabricate a development history.
7. Confirm your final assignment brief still allows AI-generated code and includes any marking criteria beyond the proposal.

## Questions you should be able to answer

- Why does the engine not know about Express or MongoDB?
- Why are scoring changes applied together before emitting events?
- How does the browser receive an image without receiving expected counts?
- What happens if an answer and timer expiry occur together?
- Why does a stale puzzle ID protect against duplicate submissions?
- What is the difference between the session cookie and CSRF token?
- Which state survives a restart? What would need to change for multiple servers?
- Why is fallback useful, and why must its source remain visible?
