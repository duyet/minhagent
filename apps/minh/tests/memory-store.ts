import { emptySession, type SessionState, type SessionStore } from "../src/harness.js";

export function memoryStore(initial?: SessionState): SessionStore {
  let state = initial ?? emptySession();
  return {
    async load() {
      return JSON.parse(JSON.stringify(state)) as SessionState;
    },
    async save(next) {
      state = JSON.parse(JSON.stringify(next)) as SessionState;
    },
  };
}
