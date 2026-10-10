# Verification record

Created 8 October 2026. Run the commands again on the final machine before submission.

## Automated checks

`npm test`: 26 tests passed. Coverage includes all level/bonus combinations, wrong answers, progress preservation, timeout precedence, loading pauses, hint idempotency and exhaustion, stale puzzles, response privacy, custom events, fallback image counts, adapter validation, retries, host restrictions and the HTTP identity-to-score workflow.

The HTTP integration test injects a memory repository and local puzzle provider. It checks registration, bcrypt hashes, login cookie flags, rejected CSRF and cross-origin mutations, server-generated score, one score per game, leaderboard output and logout revocation. It does not establish MongoDB connectivity.

## External contract

A direct HTTPS request to the supplied endpoint returned question, fish and chest fields. The observed question URL used the www.sanfoh.com image host. The application adapter has a live diagnostic and labelled fallback. The live application diagnostic succeeded with source api, MIME image/png and 123101 image bytes when this restricted environment used its configured network proxy and a 15-second timeout. The normal 6-second run timed out and correctly used fallback. Connectivity and latency depend on the deployment network.

## Browser check limitation

Browser rendering could not be verified here because a Chromium binary was unavailable and its download returned an invalid archive. JavaScript syntax checks passed. Complete the visual and interaction acceptance checks on your computer.

## Manual acceptance checks on your computer

- Run with MongoDB, register a fresh user and verify the user record contains a hash.
- Finish each difficulty and confirm target counts and bonuses.
- Confirm a saved result remains after restart, and an unfinished game does not.
- Use up hints; submit wrong answers; let time expire.
- Set offline mode and verify the source badge identifies it.
- Open two tabs and submit the same puzzle from both; only one answer may be accepted.
- Visit the game endpoints while signed out; they must reject access.
- Inspect browser responses: expected chest counts must not be sent.
- Check the game on a phone width and use keyboard navigation.

## Scope of verification

MongoDB execution and final video recording require the user's environment. No marks, academic acceptance, live service availability or production deployment are implied.
