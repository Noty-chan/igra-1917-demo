/** Pure session transitions. The local preview is not an authorization boundary. */
import { hydrateGameplay, applyGameplay } from './gameplay.js?v=19';
export function validateContent(content) {
  for (const collection of ['days', 'characters', 'rooms', 'npcs']) {
    if (!Array.isArray(content[collection])) throw new Error(`Не задан раздел ${collection}.`);
    const ids = content[collection].map(item => item.id);
    if (ids.some(id => typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) || new Set(ids).size !== ids.length) {
      throw new Error(`В разделе ${collection} нужны уникальные постоянные идентификаторы.`);
    }
  }
  if (!content.days.length) throw new Error('Нужно задать хотя бы один день.');
  for (const item of [...content.characters, ...content.rooms, ...content.npcs]) {
    if (!Array.isArray(item.layers)) throw new Error(`У ${item.id} не заданы уровни раскрытия.`);
  }
  for (const character of content.characters) {
    if (!character.goals?.main?.personal || !character.goals?.main?.game || !character.goals?.traitor) {
      throw new Error(`У ${character.id} должны быть две основные цели и отдельная цель предателя.`);
    }
  }
  return content;
}

export function sanitizeCustomNpc(item) {
  if(!item||typeof item.id!=='string'||!/^custom-[a-z0-9-]{1,80}$/.test(item.id))throw new Error('Неверный идентификатор персонажа.');
  const field=(name,max,required=false)=>{const value=item[name];if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error('Проверьте описание персонажа.');return value.trim();};
  const src=item.portrait?.src??'';
  if(typeof src!=='string'||src.length>350000||(src&&!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src)))throw new Error('Выберите изображение JPEG, PNG или WebP.');
  return {id:item.id,name:field('name',120,true),role:field('role',120),summary:field('summary',10000),portrait:src?{src,alt:field('name',120,true)}:null,layers:[],custom:true};
}
export function hydrateState(content, saved = {}) {
  const result = {
    version: 4,
    customNpcs: Array.isArray(saved.customNpcs)?saved.customNpcs.flatMap(item=>{try{return [sanitizeCustomNpc(item)];}catch{return [];}}).filter((n,i,a)=>a.findIndex(x=>x.id===n.id)===i).slice(0,40):[],
    ...hydrateGameplay(content,saved),
    dayId: content.days.some(d => d.id === saved.dayId) ? saved.dayId : content.days[0].id,
    characters: {}, rooms: {}, npcs: {}, notes: saved.notes && typeof saved.notes === 'object' ? saved.notes : {},
    masquerade: {
      value: Number.isInteger(saved.masquerade?.value) ? Math.max(0, Math.min(5, saved.masquerade.value)) : 5,
      visible: saved.masquerade?.visible === true
    },
    publicViewerEnabled: saved.publicViewerEnabled === true,
    cleanNightVisible: saved.cleanNightVisible === true
  };
  const level = (n, max) => Math.max(0, Math.min(max, Number.isInteger(n) ? n : 0));
  for (const character of content.characters) {
    const old = saved.characters?.[character.id] ?? {};
    result.characters[character.id] = {
      level: level(old.level, character.layers.length),
      death: old.death && typeof old.death.label === 'string' ? old.death : null,
      bloodPool: Number.isSafeInteger(old.bloodPool) && old.bloodPool >= 0 ? old.bloodPool : Math.max(0, Number(character.bloodPool) || 0),
      bloodVisible: old.bloodVisible === true,
      health: Array.from({length:7},(_,i)=>Number.isInteger(old.health?.[i])&&old.health[i]>=0&&old.health[i]<=3?old.health[i]:0),
      willpowerCurrent: Number.isInteger(old.willpowerCurrent) ? Math.max(0,Math.min(character.willpower,old.willpowerCurrent)) : character.willpower,
      goals: {
        mainVisible: old.goals?.mainVisible === true,
        traitorVisible: old.goals?.traitorVisible === true
      },
      claim: old.claim && typeof old.claim.ownerId === 'string' && typeof old.claim.ownerName === 'string'
        ? { ownerId: old.claim.ownerId, ownerName: old.claim.ownerName, confirmed: old.claim.confirmed === true } : null
    };
  }
  for (const room of content.rooms) {
    result.rooms[room.id] = { description:typeof saved.rooms?.[room.id]?.description==='string'?saved.rooms[room.id].description.slice(0,20000):null, level: level(saved.rooms?.[room.id]?.level ?? room.initialLevel ?? 0, room.layers.length), visible:typeof saved.rooms?.[room.id]?.visible==='boolean'?saved.rooms[room.id].visible:room.initialVisible!==false };
  }
  for (const npc of [...content.npcs,...result.customNpcs]) {
    result.npcs[npc.id] = { visible: saved.npcs?.[npc.id]?.visible === true, level: level(saved.npcs?.[npc.id]?.level, npc.layers.length) };
  }
  return result;
}

export function ownedCharacter(state, actorId) {
  return Object.entries(state.characters).find(([, c]) => c.claim?.ownerId === actorId && c.claim.confirmed)?.[0] ?? null;
}

export function transition(content, previous, action, actor) {
  if (!actor || !['gm', 'player', 'spectator'].includes(actor.role) || typeof actor.id !== 'string') throw new Error('Не выбрана роль.');
  if(actor.role==='spectator')throw new Error('Зритель может только просматривать открытую информацию.');
  const state = structuredClone(previous);
  if(applyGameplay(content,state,action,actor))return state;
  const gm = () => { if (actor.role !== 'gm') throw new Error('Это действие доступно ведущему.'); };
  const entity = (collection, id) => {
    const data = (collection==='npcs'?[...content.npcs,...state.customNpcs]:content[collection]).find(item => item.id === id);
    if (!data || !state[collection][id]) throw new Error('Материал не найден.');
    return [data, state[collection][id]];
  };
  const setLevel = (collection) => {
    gm(); const [data, entry] = entity(collection, action.id);
    if (!Number.isInteger(action.level) || action.level < 0 || action.level > data.layers.length) throw new Error('Неизвестный уровень раскрытия.');
    entry.level = action.level;
  };
  switch (action.type) {
    case 'save-custom-npc': {
      gm();const item=sanitizeCustomNpc(action.item),index=state.customNpcs.findIndex(n=>n.id===item.id);
      if(index<0){if(state.customNpcs.length>=40)throw new Error('Можно добавить до 40 действующих лиц.');state.customNpcs.push(item);}else state.customNpcs[index]=item;
      state.npcs[item.id]??={visible:false,level:0};break;
    }
    case 'delete-custom-npc': {
      gm();if(!state.customNpcs.some(n=>n.id===action.id))throw new Error('Можно удалить только добавленного персонажа.');
      state.customNpcs=state.customNpcs.filter(n=>n.id!==action.id);delete state.npcs[action.id];break;
    }
    case 'save-room-description': {
      gm();const [,entry]=entity('rooms',action.id);if(typeof action.text!=='string'||action.text.length>20000)throw new Error('Описание должно быть не длиннее 20 000 символов.');entry.description=action.text.trim();break;
    }
    case 'set-room-visible': {
      gm();const [,entry]=entity('rooms',action.id);entry.visible=action.visible===true;
      if(entry.visible&&entry.level===0)entry.level=1;break;
    }
    case 'set-day':
      gm(); if (!content.days.some(d => d.id === action.id)) throw new Error('Такой день не задан.');
      state.dayId = action.id;
      if (action.id === 'day-02') state.masquerade.visible = true;
      break;
    case 'reserve-character': {
      if (actor.role !== 'player') throw new Error('Выбор персонажа доступен игроку.');
      const [, entry] = entity('characters', action.id);
      if (entry.death) throw new Error('Этот персонаж погиб.');
      if (entry.claim && entry.claim.ownerId !== actor.id) throw new Error('Этот персонаж уже выбран другим игроком.');
      if (ownedCharacter(state, actor.id)) throw new Error('У вас уже есть закреплённый персонаж.');
      for (const c of Object.values(state.characters)) if (c.claim?.ownerId === actor.id && !c.claim.confirmed) c.claim = null;
      entry.claim = { ownerId: actor.id, ownerName: actor.name || 'Игрок', confirmed: false }; break;
    }
    case 'confirm-character': {
      const [, entry] = entity('characters', action.id);
      if (actor.role !== 'player' || entry.claim?.ownerId !== actor.id) throw new Error('Сначала выберите этого персонажа.');
      if (entry.death) throw new Error('Этот персонаж погиб.');
      const owned = ownedCharacter(state, actor.id);
      if (owned && owned !== action.id) throw new Error('У вас уже есть закреплённый персонаж.');
      entry.claim.confirmed = true; break;
    }
    case 'release-character': {
      const [, entry] = entity('characters', action.id);
      if (actor.role !== 'gm' && (!entry.claim || entry.claim.ownerId !== actor.id || entry.claim.confirmed)) throw new Error('Закреплённого персонажа может освободить ведущий.');
      entry.claim = null; break;
    }
    case 'set-character-level': setLevel('characters'); break;
    case 'set-room-level': setLevel('rooms'); break;
    case 'set-npc-level': setLevel('npcs'); break;
    case 'set-goal-visibility': {
      gm(); const [, entry] = entity('characters', action.id);
      if (!['main', 'traitor'].includes(action.kind)) throw new Error('Выберите основную цель или цель предателя.');
      entry.goals[action.kind === 'main' ? 'mainVisible' : 'traitorVisible'] = action.visible === true;
      break;
    }
    case 'set-blood-pool': {
      const [, entry] = entity('characters', action.id);
      if(actor.role!=='gm'&&(entry.claim?.ownerId!==actor.id||!entry.claim.confirmed||!entry.bloodVisible))throw new Error('Кровь можно менять только в своём открытом листе.');
      if (!Number.isSafeInteger(action.value) || action.value < 0 || action.value > 100) throw new Error('Запас крови должен быть целым числом от 0 до 100.');
      entry.bloodPool = action.value; break;
    }
    case 'set-blood-visibility': {
      gm(); const [, entry] = entity('characters', action.id);
      entry.bloodVisible = action.visible === true; break;
    }
    case 'adjust-masquerade': {
      gm(); if (!Number.isInteger(action.delta) || ![-2, -1, 1, 2].includes(action.delta)) throw new Error('Изменение Маскарада должно быть −2, −1, +1 или +2.');
      state.masquerade.value = Math.max(0, Math.min(5, state.masquerade.value + action.delta)); break;
    }
    case 'set-masquerade-visibility':
      gm(); state.masquerade.visible = action.visible === true; break;
    case 'set-public-viewer':
      gm(); state.publicViewerEnabled = action.visible === true; break;
    case 'set-clean-night-visibility':
      gm(); state.cleanNightVisible = action.visible === true; break;
    case 'set-death': {
      gm(); const [, entry] = entity('characters', action.id);
      const day = content.days.find(d => d.id === state.dayId);
      entry.death = action.dead ? { dayId: day.id, label: `${day.title} · ${day.dateLabel}` } : null; break;
    }
    case 'set-npc-visible': {
      gm(); const [, entry] = entity('npcs', action.id); entry.visible = action.visible === true; break;
    }
    case 'save-note': {
      const [, entry] = entity('characters', action.id);
      if (actor.role !== 'player' || entry.claim?.ownerId !== actor.id || !entry.claim.confirmed) throw new Error('Заметки доступны владельцу персонажа.');
      if (typeof action.text !== 'string' || action.text.length > 20000) throw new Error('Заметка слишком длинная.');
      state.notes[`${actor.id}:${action.id}`] = action.text; break;
    }
    default: throw new Error('Неизвестное действие.');
  }
  return state;
}
