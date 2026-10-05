import { hydrateState, transition, validateContent } from './state.js?v=6';

/** Device-local workbench only; production will use an authenticated API. */
export function createLocalSession(content, storage, key = 'igra-workbench-v1') {
  validateContent(content);
  let saved = {}, available = true;
  try { saved = JSON.parse(storage.getItem(key) || '{}'); } catch { available = false; }
  let current = hydrateState(content, saved && typeof saved === 'object' ? saved : {});
  return {
    read: () => structuredClone(current),
    isPersistent: () => available,
    dispatch(action, actor) {
      const next = transition(content, current, action, actor);
      try { storage.setItem(key, JSON.stringify(next)); available = true; } catch { available = false; }
      current = next;
      return structuredClone(current);
    },
    refresh(raw) {
      try { current = hydrateState(content, JSON.parse(raw || '{}')); return true; } catch { return false; }
    }
  };
}
