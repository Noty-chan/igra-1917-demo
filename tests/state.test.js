import test from 'node:test';
import assert from 'node:assert/strict';
import { gameContent } from '../dist/content/game.js';
import { hydrateState, transition, ownedCharacter, validateContent } from '../dist/core/state.js';

const alice = { id: 'alice', name: 'Алиса', role: 'player' };
const bob = { id: 'bob', name: 'Борис', role: 'player' };
const gm = { id: 'gm', role: 'gm' };
const id = 'character-01';

test('the public viewer starts hidden and only the GM can enable or disable it', () => {
  let state = hydrateState(gameContent);
  assert.equal(state.publicViewerEnabled, false);
  assert.throws(() => transition(gameContent, state, { type: 'set-public-viewer', visible: true }, alice));
  state = transition(gameContent, state, { type: 'set-public-viewer', visible: true }, gm);
  assert.equal(state.publicViewerEnabled, true);
  assert.throws(() => transition(gameContent, state, { type: 'set-public-viewer', visible: false }, bob));
  state = transition(gameContent, state, { type: 'set-public-viewer', visible: false }, gm);
  assert.equal(state.publicViewerEnabled, false);
});

test('reserved and confirmed characters cannot be claimed by another player', () => {
  let state = transition(gameContent, hydrateState(gameContent), { type: 'reserve-character', id }, alice);
  assert.throws(() => transition(gameContent, state, { type: 'reserve-character', id }, bob));
  state = transition(gameContent, state, { type: 'confirm-character', id }, alice);
  assert.equal(ownedCharacter(state, alice.id), id);
  assert.throws(() => transition(gameContent, state, { type: 'reserve-character', id: 'character-02' }, alice));
  assert.throws(() => transition(gameContent, state, { type: 'release-character', id }, alice));
  state = transition(gameContent, state, { type: 'release-character', id }, gm);
  assert.equal(state.characters[id].claim, null);
});

test('content can be renamed, reordered and extended without losing claims or notes', () => {
  let state = transition(gameContent, hydrateState(gameContent), { type: 'reserve-character', id }, alice);
  state = transition(gameContent, state, { type: 'confirm-character', id }, alice);
  state = transition(gameContent, state, { type: 'save-note', id, text: 'Моя заметка' }, alice);
  const changed = structuredClone(gameContent);
  changed.characters.reverse();
  changed.characters.find(c => c.id === id).name = 'Новое имя';
  changed.rooms.push({ id: 'attic', layers: [], initialLevel: 0 });
  const restored = hydrateState(changed, state);
  assert.equal(ownedCharacter(restored, alice.id), id);
  assert.equal(restored.notes[`alice:${id}`], 'Моя заметка');
  assert.equal(restored.rooms.attic.level, 0);
});

test('death is tied to the moment it happened and survives day changes', () => {
  let state = transition(gameContent, hydrateState(gameContent), { type: 'set-death', id, dead: true }, gm);
  const label = state.characters[id].death.label;
  state = transition(gameContent, state, { type: 'set-day', id: 'day-02' }, gm);
  assert.equal(state.characters[id].death.label, label);
  assert.equal(state.characters[id].death.dayId, 'day-01');
  assert.throws(() => transition(gameContent, state, { type: 'reserve-character', id }, alice));
});

test('players cannot change days or disclosure, and new disclosure layers are supported', () => {
  const extended = structuredClone(gameContent);
  extended.characters[0].layers = [
    { title: 'Первый слой', text: 'Базовые сведения' },
    { title: 'Второй слой', text: 'Дополнительные сведения' },
    { title: 'Третий слой', text: 'Новые сведения' }
  ];
  const state = hydrateState(extended);
  assert.throws(() => transition(extended, state, { type: 'set-day', id: 'day-02' }, alice));
  assert.throws(() => transition(extended, state, { type: 'set-character-level', id, level: 1 }, alice));
  assert.equal(transition(extended, state, { type: 'set-character-level', id, level: 3 }, gm).characters[id].level, 3);
  assert.throws(() => transition(extended, state, { type: 'set-character-level', id, level: 4 }, gm));
  assert.throws(() => transition(extended, state, { type: 'save-note', id, text: 'Чужое' }, bob));
});

test('duplicate permanent identifiers are rejected before rendering', () => {
  const changed = structuredClone(gameContent);
  changed.characters[1].id = changed.characters[0].id;
  assert.throws(() => validateContent(changed));
});
