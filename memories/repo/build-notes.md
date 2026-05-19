# Build Notes

- Use @dimforge/rapier3d-compat for this Vite app; the raw WASM package failed bundling.
- Call ensureRapierReady() before createGameSession(); tests must await Rapier init too.
- Verified validation commands: npm run build and npm run test -- src/game/core/createGameSession.test.ts
