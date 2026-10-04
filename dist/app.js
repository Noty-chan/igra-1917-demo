import { gameContent as game } from './content/game.js';
import { ownedCharacter } from './core/state.js';
import { createLocalSession } from './core/local-session.js';
import { requireDemoLogin } from './core/access.js';

await requireDemoLogin();

// This workbench has no authentication boundary. Production access and secret
// delivery must be enforced by the future session server.
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const session = createLocalSession(game, storage, 'igra-workbench-v2');
let playerIdentity = {id:'preview-player',name:'Игрок 1'};
try { const savedIdentity=JSON.parse(storage?.getItem('igra-preview-identity-v1')||'null'); if(typeof savedIdentity?.id==='string'&&typeof savedIdentity?.name==='string')playerIdentity=savedIdentity; } catch {}
let state = session.read(), role = 'player', opened = null, selectedSheetCharacter = null;
const views = ['house', 'roster', 'sheet', 'public', 'npcs', 'entry', 'gm'];
let view = views.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'house';
const main = document.querySelector('#content');
const dialog = document.querySelector('#detail');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const prose = value => String(value ?? '').split(/\n\s*\n/).filter(Boolean).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
const actor = () => role === 'gm' ? ({id:'preview-gm',role,name:'Ведущий'}) : ({...playerIdentity,role});
const day = () => game.days.find(d => d.id === state.dayId);
const owner = () => ownedCharacter(state, playerIdentity.id);
const sheetCharacter = () => role === 'gm' ? (selectedSheetCharacter || owner()) : owner();
function asset(src) {
  if (!src) return '';
  try { const u = new URL(src, location.href); return u.protocol === 'https:' || (u.origin === location.origin && /^https?:$/.test(u.protocol)) ? u.href : ''; } catch { return ''; }
}
function illustration(data, className = '') {
  const src = asset(data?.src);
  return src ? `<img class="${className}" src="${esc(src)}" alt="${esc(data.alt)}" loading="lazy">` : '';
}
function portrait(person) {
  const src = asset(person.portrait?.src), cell = person.portrait?.cell;
  if (!src) return '<div class="portrait absent" aria-label="Портрет ожидается">И</div>';
  if (Number.isInteger(cell) && cell >= 0 && cell < 9) return `<div class="portrait atlas" role="img" aria-label="${esc(person.portrait.alt)}" style="background-image:url('${esc(src)}');background-position:${cell % 3 * 50}% ${Math.floor(cell / 3) * 50}%"></div>`;
  return illustration(person.portrait, 'portrait');
}
function title(text, subtitle, kicker = 'ИГРА · СЕНТЯБРЬ 1917') { return `<div class="title-block"><div><span class="eyebrow">${esc(kicker)}</span><h1>${esc(text)}</h1></div>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>`; }
function toast(message) {
  const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 4200);
}
function navigate(next, updateHash = true) {
  if (!views.includes(next)) throw new Error('Неизвестный раздел');
  view = next; dialog.close(); if (updateHash) history.replaceState(null, '', `#${next}`); render();
}
function act(action, message = '') {
  try { state = session.dispatch(action, actor()); render(); if (opened) renderDialog(); if (message) toast(message); }
  catch (error) { toast(error.message || 'Действие не выполнено'); }
}
function levelControl(kind, item, current) {
  return `<label class="level-control">Общие сведения <select data-level="${kind}" data-id="${esc(item.id)}">${Array.from({length:item.layers.length + 1}, (_, i) => `<option value="${i}" ${current === i ? 'selected' : ''}>${i === 0 ? 'Базовые' : `${i} · ${esc(item.layers[i - 1].title)}`}</option>`).join('')}</select></label>`;
}
function layers(item, level) {
  return item.layers.map((layer, i) => i < level || role === 'gm' ? `<section class="disclosure ${i >= level ? 'behind-screen' : ''}"><span class="eyebrow">${i >= level ? 'Только для ведущего · ' : ''}${esc(layer.title)}</span>${prose(layer.text)}</section>` : '').join('');
}
function dots(value) {
  const count = Math.max(0, Math.min(5, Number(value) || 0));
  return `<span class="dot-rating" aria-label="${count} из 5">${'●'.repeat(count)}${'○'.repeat(5-count)}</span>`;
}
function dotList(items) {
  if (!items?.length) return '';
  return `<dl class="dot-list">${items.map(item => `<div><dt>${esc(item.name)}</dt><dd>${dots(item.value)}</dd></div>`).join('')}</dl>`;
}
function statGroups(c) {
  const attributes = [
    ['Физические', c.attributes.filter(s => ['strength','dexterity','stamina'].includes(s.key))],
    ['Социальные', c.attributes.filter(s => ['charisma','manipulation','appearance'].includes(s.key))],
    ['Ментальные', c.attributes.filter(s => ['perception','intelligence','wits'].includes(s.key))]
  ];
  const abilities = ['Таланты','Навыки','Знания','Другие умения'].map(group => [group,c.abilities.filter(s => s.group === group)]);
  return attributes.map(([name,items]) => items.length ? `<section class="stat-group"><h3>${name}</h3>${dotList(items)}</section>` : '').join('') +
    abilities.map(([name,items]) => items.length ? `<section class="stat-group"><h3>${name}</h3>${dotList(items)}</section>` : '').join('') +
    (c.disciplines.length ? `<section class="stat-group"><h3>Дисциплины</h3>${dotList(c.disciplines)}</section>` : '') +
    `<section class="stat-group"><h3>Воля и человечность</h3>${dotList([{name:'Сила воли',value:c.willpower},{name:'Человечность',value:c.humanity}])}</section>` +
    (c.virtues.some(v => v.value) ? `<section class="stat-group"><h3>Добродетели</h3>${dotList(c.virtues.filter(v=>v.value))}</section>` : '');
}
function objectivePanel(c, s) {
  if (role === 'gm') return `<section class="private-info objective-management"><span class="eyebrow">Цели · видит только ведущий</span><h3>Основные цели</h3><p><strong>Личная:</strong> ${esc(c.goals.main.personal)}</p><p><strong>Игровая:</strong> ${esc(c.goals.main.game)}</p><button data-goal="main" data-id="${esc(c.id)}" data-visible="${!s.goals.mainVisible}">${s.goals.mainVisible ? 'Скрыть две основные цели' : 'Открыть две основные цели игроку'}</button><span class="disclosure-state">${s.goals.mainVisible ? 'Открыты владельцу' : 'Пока скрыты от игрока'}</span><h3>Цель предателя</h3><p>${esc(c.goals.traitor)}</p><button data-goal="traitor" data-id="${esc(c.id)}" data-visible="${!s.goals.traitorVisible}">${s.goals.traitorVisible ? 'Скрыть цель предателя' : 'Открыть цель предателя игроку'}</button><span class="disclosure-state">${s.goals.traitorVisible ? 'Открыта владельцу' : 'Пока скрыта от игрока'}</span></section>`;
  return `${s.goals.mainVisible ? `<details class="objective-card" open><summary>Две основные цели</summary><p><strong>Личная:</strong> ${esc(c.goals.main.personal)}</p><p><strong>Игровая:</strong> ${esc(c.goals.main.game)}</p></details>` : '<p class="closed-message">Основные цели пока не открыты ведущим.</p>'}${s.goals.traitorVisible ? `<details class="objective-card" open><summary>Цель предателя</summary><p>${esc(c.goals.traitor)}</p></details>` : '<p class="closed-message">Отдельная цель пока не открыта ведущим.</p>'}`;
}
function bloodPanel(c, s) {
  if (role === 'gm') return `<section class="blood-panel"><label for="blood-${esc(c.id)}">Запас крови <input id="blood-${esc(c.id)}" type="number" min="0" step="1" value="${s.bloodPool}" data-blood="${esc(c.id)}"></label><span class="disclosure-state">${s.bloodVisible ? 'Показан игроку' : 'Скрыт от игрока'}</span><button data-blood-visible="${esc(c.id)}" data-visible="${!s.bloodVisible}">${s.bloodVisible ? 'Скрыть от игрока' : 'Показать игроку'}</button></section>`;
  return s.bloodVisible ? `<p class="blood-player">Запас крови · ${s.bloodPool}</p>` : '';
}
function masqueradePanel() {
  if (role !== 'gm' && !state.masquerade.visible) return '';
  return `<section class="masquerade-panel"><div><span class="eyebrow">Шкала 0–5</span><h2>Маскарад</h2><p>${role === 'gm' && !state.masquerade.visible ? 'Пока видна только ведущему.' : 'Текущее значение'}</p></div><strong class="masquerade-value">${state.masquerade.value}</strong>${role === 'gm' ? `<div class="card-controls"><button data-masquerade="-2">−2</button><button data-masquerade="-1">−1</button><button data-masquerade="1">+1</button><button data-masquerade="2">+2</button><button data-masquerade-visible="${!state.masquerade.visible}">${state.masquerade.visible ? 'Скрыть от игроков' : 'Открыть игрокам'}</button></div>` : ''}</section>`;
}
function house() {
  const d = day();
  return `<section class="hero"><span class="chapter-number">${esc(d.title)} / ${esc(d.period)}</span><span class="eyebrow">${esc(game.chronology)}</span><h1><span>Усадебный ваншот</span>${esc(game.title)}</h1><figure class="manor-frame">${illustration(game.house.image)}<figcaption>${esc(game.house.caption)}</figcaption></figure><div class="ornament" aria-hidden="true">◇</div><div class="hero-intro">${prose(game.house.intro || d.intro)}</div><button class="gold-button" data-view="roster">Знакомство с гостями <span aria-hidden="true"></span></button></section>${masqueradePanel()}${role === 'player' && state.cleanNightVisible ? `<section class="disclosure"><span class="eyebrow">${esc(game.cleanNight.night)}</span><h2>${esc(game.cleanNight.title)}</h2>${prose(game.cleanNight.text)}</section>` : ''}${game.house.history ? `<section class="house-history"><h2>История дома</h2>${prose(game.house.history)}</section>` : ''}<section class="locations"><div class="section-heading"><h2>За дверями дома</h2><span>${role === 'gm' ? 'Управление раскрытием' : 'План особняка'}</span></div><div class="room-grid">${game.rooms.map((r, i) => { const level = state.rooms[r.id].level; return `<article class="room-card ${level === 0 ? 'locked' : ''}">${r.image ? illustration(r.image, 'room-image') : ''}<span class="eyebrow">${String(i + 1).padStart(2,'0')} / ${level ? 'Открыто' : 'Закрыто'}</span><h3>${esc(r.name)}</h3><p>${esc(r.summary)}</p><button data-room="${esc(r.id)}">${level || role === 'gm' ? 'Осмотреть' : 'Дверь закрыта'} <span aria-hidden="true"></span></button>${role === 'gm' ? levelControl('room',r,level) : ''}</article>`; }).join('')}</div></section>`;
}
function claimLabel(s) { return s.death ? 'Погиб' : s.claim ? (s.claim.confirmed ? 'Персонаж закреплён' : 'Предварительный выбор') : 'Свободен'; }
function roster() {
  return title('Девять судеб', 'Выберите персонажа, затем подтвердите выбор в его досье.') + `<div class="roster">${game.characters.map((c, i) => { const s = state.characters[c.id]; return `<article class="character-card ${s.death ? 'dead' : ''}"><button class="portrait-button" data-character="${esc(c.id)}" aria-label="Открыть досье: ${esc(c.name)}">${portrait(c)}<span class="portrait-index">${String(i + 1).padStart(2,'0')}</span>${s.death ? '<span class="death-stamp">ПОГИБ</span>' : ''}</button><div class="card-copy"><span class="eyebrow">${esc([c.clan,c.affiliation].filter(Boolean).join(' · ') || 'Персонаж')}</span><h2><button data-character="${esc(c.id)}">${esc(c.name)}</button></h2><p>${esc(c.nature || c.demeanor || 'Гость усадьбы')}</p><span class="claim-state ${s.claim ? 'occupied' : ''}">${esc(claimLabel(s))}${s.claim ? ` · ${esc(s.claim.ownerName)}` : ''}</span>${s.death ? `<small class="death-date">${esc(s.death.label)}</small>` : ''}${role === 'gm' ? `<div class="card-controls">${levelControl('character',c,s.level)}<button data-death="${esc(c.id)}">${s.death ? 'Отменить отметку смерти' : 'Отметить смерть'}</button>${s.claim ? `<button data-release="${esc(c.id)}">Освободить персонажа</button>` : ''}</div>` : ''}</div></article>`; }).join('')}</div>`;
}
function sheet() {
  const id = sheetCharacter(), c = game.characters.find(p => p.id === id);
  if (!c) return title(role === 'gm' ? 'Листы персонажей' : 'Мой персонаж', '') + '<div class="empty-state"><span class="empty-symbol" aria-hidden="true">◇</span><h2>Место за столом ещё свободно</h2><p>Личный лист откроется после подтверждения персонажа.</p><button class="gold-button" data-view="roster">Выбрать персонажа</button></div>';
  const s = state.characters[id];
  const meta = [c.clan,c.affiliation,c.generation ? `${c.generation}-е поколение` : ''].filter(Boolean).join(' · ');
  return title(c.name, meta, role === 'gm' ? 'ЛИЧНЫЙ ЛИСТ · ПРОСМОТР ВЕДУЩЕГО' : 'ЛИЧНЫЙ ЛИСТ') + `<div class="sheet-layout"><aside>${portrait(c)}${s.death ? `<span class="death-date">Погиб · ${esc(s.death.label)}</span>` : ''}${role === 'gm' ? `<label class="sheet-picker" for="gm-sheet-select">Лист персонажа <select id="gm-sheet-select">${game.characters.map(p=>`<option value="${esc(p.id)}" ${p.id===id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>` : ''}<div class="character-facts">${c.nature ? `<span>Натура · ${esc(c.nature)}</span>` : ''}${c.demeanor ? `<span>Поведение · ${esc(c.demeanor)}</span>` : ''}</div>${bloodPanel(c,s)}<span class="sample-label">Характеристики и навыки</span></aside><article class="sheet-copy"><h2>Личный лист</h2>${statGroups(c)}${c.curse ? `<section class="private-info curse"><span class="eyebrow">Проклятие</span><p>${esc(c.curse)}</p></section>` : ''}<section class="goals-block"><h2>Цели</h2>${objectivePanel(c,s)}</section><section class="roll-card"><span class="eyebrow">Бросок</span><h2>Пул из характеристики и навыка</h2><p class="roll-help">Трудность по умолчанию — 6. Результаты от неё считаются успехами; выпавшая 1 отменяет один успех.</p><div class="roll-controls"><label for="roll-attribute">Характеристика<select id="roll-attribute">${c.attributes.map(x=>`<option value="${x.value}">${esc(x.name)} · ${x.value}</option>`).join('')}</select></label><label for="roll-ability">Навык<select id="roll-ability">${c.abilities.map(x=>`<option value="${x.value}">${esc(x.name)} · ${x.value}</option>`).join('')}</select></label><label for="roll-difficulty">Трудность<select id="roll-difficulty">${[4,5,6,7,8,9,10].map(n=>`<option value="${n}" ${n===6?'selected':''}>${n}</option>`).join('')}</select></label><strong class="roll-pool">Кубиков: <span id="roll-pool-count">${(c.attributes[0]?.value||0)+(c.abilities[0]?.value||0)}</span>d10</strong><button class="gold-button" id="roll-button">Бросить</button></div><output id="roll-result" class="roll-result" aria-live="polite"></output></section><label class="notes-label" for="notes">Ваши заметки</label><textarea id="notes" rows="6" ${role === 'gm' ? 'readonly' : ''} placeholder="Здесь можно оставить личные записи…">${esc(state.notes[`${playerIdentity.id}:${id}`] || '')}</textarea><small id="notes-status">${role === 'gm' ? 'Просмотр листа игрока в локальном макете.' : 'Сохраняются в этом браузере.'}</small></article></div>`;
}
function npcs() {
  const visible = game.npcs.filter(n => role === 'gm' || state.npcs[n.id].visible);
  return title('Другие действующие лица', role === 'gm' ? 'Откройте персонажа, когда он появится в истории.' : '') + (visible.length ? `<div class="roster">${visible.map(n => {const s = state.npcs[n.id]; return `<article class="character-card ${!s.visible ? 'unpublished' : ''}">${portrait(n)}<div class="card-copy"><span class="eyebrow">${!s.visible ? 'Скрыт от игроков · ' : ''}${esc(n.role)}</span><h2>${esc(n.name)}</h2>${prose(n.summary)}${layers(n,s.level)}${role === 'gm' ? `<div class="card-controls"><button data-npc="${esc(n.id)}">${s.visible ? 'Скрыть от игроков' : 'Открыть игрокам'}</button>${n.layers.length ? levelControl('npc',n,s.level) : ''}</div>` : ''}</div></article>`; }).join('')}</div>` : '<div class="empty-state"><span class="empty-symbol" aria-hidden="true">◇</span><p>Новые лица ещё не появились в истории.</p></div>');
}
function publicLayers(item, level) {
  return item.layers.slice(0, level).map(layer => `<section class="public-disclosure"><span class="eyebrow">${esc(layer.title)}</span>${prose(layer.text)}</section>`).join('');
}
function publicViewer() {
  const d = day();
  const rooms = game.rooms.map((r, i) => {
    const level = state.rooms[r.id].level;
    return `<article class="public-card">${r.image ? illustration(r.image, 'room-image') : ''}<span class="eyebrow">Место · ${String(i + 1).padStart(2, '0')}</span><h2>${esc(r.name)}</h2>${prose(r.summary)}${publicLayers(r, level)}</article>`;
  }).join('');
  const characters = game.characters.map(c => {
    const s = state.characters[c.id];
    const facts = [c.clan, c.affiliation, c.generation ? `${c.generation}-е поколение` : '', c.nature ? `Натура · ${c.nature}` : '', c.demeanor ? `Поведение · ${c.demeanor}` : ''].filter(Boolean).join(' · ');
    return `<article class="public-card public-person">${portrait(c)}<div><span class="eyebrow">${esc(facts || 'Гость усадьбы')}</span><h2>${esc(c.name)}</h2><p>${esc(s.death ? `Погиб · ${s.death.label}` : s.claim ? `${s.claim.confirmed ? 'Персонаж закреплён' : 'Предварительный выбор'} · ${s.claim.ownerName}` : 'Персонаж свободен')}</p>${publicLayers(c, s.level)}</div></article>`;
  }).join('');
  const npcsPublic = game.npcs.filter(n => state.npcs[n.id].visible).map(n => {
    const s = state.npcs[n.id];
    return `<article class="public-card public-person">${portrait(n)}<div><span class="eyebrow">${esc(n.role)}</span><h2>${esc(n.name)}</h2>${prose(n.summary)}${publicLayers(n, s.level)}</div></article>`;
  }).join('');
  return title('Открытая информация', 'Сводка для зрителей · только сведения, раскрытые всем игрокам') +
    `<section class="public-banner"><span class="eyebrow">${esc(game.chronology)}</span><h2>${esc(d.title)} · ${esc(d.period)}</h2>${prose(d.intro || game.house.intro)}</section>` +
    (game.house.history ? `<section class="public-banner"><h2>История дома</h2>${prose(game.house.history)}</section>` : '') +
    (state.masquerade.visible ? `<section class="public-banner public-status"><div><span class="eyebrow">Шкала 0–5</span><h2>Маскарад</h2></div><strong>${state.masquerade.value}</strong></section>` : '') +
    (state.cleanNightVisible ? `<section class="public-banner"><span class="eyebrow">${esc(game.cleanNight.night)}</span><h2>${esc(game.cleanNight.title)}</h2>${prose(game.cleanNight.text)}</section>` : '') +
    `<section class="gm-section"><div class="section-heading"><h2>Особняк</h2><span>Открытые места и сведения</span></div><div class="public-grid">${rooms}</div></section>` +
    `<section class="gm-section"><div class="section-heading"><h2>Гости усадьбы</h2><span>Общедоступные сведения</span></div><div class="public-grid">${characters}</div></section>` +
    (npcsPublic ? `<section class="gm-section"><div class="section-heading"><h2>Другие лица</h2><span>Уже представлены игрокам</span></div><div class="public-grid">${npcsPublic}</div></section>` : '');
}
function gm() {
  return title('За ширмой', 'Цели, запас крови и правила игры. Раскрытия видны только владельцу соответствующего персонажа.') +
    `<section class="gm-section"><div class="section-heading"><h2>Зрительская вкладка</h2><span>Публичная сводка для гостей без персонажа</span></div><div class="viewer-control"><p>${state.publicViewerEnabled ? 'Вкладка доступна игрокам и зрителям.' : 'Вкладка скрыта от игроков.'}</p><button class="gold-button" data-public-viewer="${!state.publicViewerEnabled}">${state.publicViewerEnabled ? 'Отключить зрительскую вкладку' : 'Включить зрительскую вкладку'}</button></div></section>` +
    `<section class="gm-section"><div class="section-heading"><h2>Цели и запас крови</h2><span>Девять личных листов</span></div><div class="gm-character-grid">${game.characters.map(c=>{const s=state.characters[c.id];return `<article class="gm-character"><button class="gm-character-open" data-character="${esc(c.id)}"><span class="eyebrow">${esc([c.clan,c.affiliation].filter(Boolean).join(' · '))}</span><h3>${esc(c.name)}</h3></button>${objectivePanel(c,s)}${bloodPanel(c,s)}</article>`}).join('')}</div></section>`+
    `<section class="gm-section"><div class="section-heading"><h2>Маскарад</h2><span>Откроется во вторую ночь</span></div>${masqueradePanel()}<ul class="rule-events">${game.masqueradeEvents.map(x=>`<li><span>${esc(x.label)}</span><strong>${x.change>0?'+':''}${x.change}</strong>${x.note?`<small>${esc(x.note)}</small>`:''}</li>`).join('')}</ul></section>`+
    `<section class="gm-section"><div class="section-heading"><h2>${esc(game.cleanNight.title)}</h2><span>${esc(game.cleanNight.night)} · необязательное событие</span></div>${prose(game.cleanNight.text)}<p class="disclosure-state">${state.cleanNightVisible?'Игрокам объявлено.':'Пока видит только ведущий.'}</p><button data-clean-night="${!state.cleanNightVisible}">${state.cleanNightVisible?'Скрыть событие':'Объявить игрокам и включить событие'}</button></section>`+
    `<section class="gm-section"><div class="section-heading"><h2>Общие правила</h2><span>Памятка ведущему</span></div>${game.gmGuide.map((r,i)=>`<details class="rule-card" ${i===0?'open':''}><summary>${esc(r.title)}</summary>${prose(r.text)}</details>`).join('')}</section>`+
    `<p class="version-caption">${esc(game.notice)}</p>`;
}
function entry() {
  return title('Вход в игру', 'В рабочем макете каждый участник выбирает себе имя, затем закрепляет персонажа.') + `<div class="entry-grid"><section class="entry-card"><span class="eyebrow">Для гостей дома</span><h2>Выбрать персонажа</h2><p>После подтверждения выбора откроется личный лист с характеристиками, бросками и целями, которые ведущий уже раскрыл.</p><label for="player-name">Имя игрока</label><input id="player-name" maxlength="40" value="${esc(playerIdentity.name)}" autocomplete="nickname"><button class="gold-button" data-set-player="true" data-view="roster">Продолжить к ростеру</button></section><section class="entry-card"><span class="eyebrow">Для ведущего</span><h2>Управление сессией</h2><p>Ведущий открывает цели, отмечает запас крови, ведёт Маскарад и объявляет события.</p><button data-role="gm" data-open-gm="true">Открыть ширму</button><p class="disclosure-state">Вход по ключу приглашения и паролю пока не подключён.</p></section></div><p class="version-caption">Имена и закрепления в этой версии хранятся только в браузере. Доступ между устройствами и проверка личности появятся после подключения серверных сессий.</p>`;
}
function render() {
  const d = day(), npcVisible = role === 'gm' || game.npcs.some(n => state.npcs[n.id].visible);
  if (role !== 'gm' && (view === 'gm' || (view === 'public' && !state.publicViewerEnabled))) {
    view = 'house'; history.replaceState(null, '', '#house');
  }
  document.querySelector('#day-title').textContent = d.title;
  document.querySelector('#day-date').textContent = `${d.dateLabel} · ${d.period}`;
  document.querySelector('#day-select').innerHTML = game.days.map(d => `<option value="${esc(d.id)}" ${d.id === state.dayId ? 'selected' : ''}>${esc(d.title)}</option>`).join('');
  document.querySelector('#gm-tools').hidden = role !== 'gm';
  document.querySelector('.role-preview>span').textContent = role === 'gm' ? 'Просмотр · ведущий' : `Просмотр · ${playerIdentity.name}`;
  document.querySelector('#npc-nav').hidden = !npcVisible;
  document.querySelector('#gm-nav').hidden = role !== 'gm';
  document.querySelector('#public-nav').hidden = role !== 'gm' && !state.publicViewerEnabled;
  document.querySelectorAll('[data-role]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.role === role)));
  document.querySelectorAll('.main-nav [data-view]').forEach(b => b.dataset.view === view ? b.setAttribute('aria-current','page') : b.removeAttribute('aria-current'));
  main.innerHTML = ({house,roster,sheet,public:publicViewer,npcs,entry,gm})[view]();
}
function renderDialog() {
  if (!opened) return;
  let html = '';
  if (opened.kind === 'character') {
    const c = game.characters.find(c => c.id === opened.id), s = state.characters[c.id];
    const mine = s.claim?.ownerId === playerIdentity.id;
    const facts = [c.clan,c.affiliation,c.generation ? `${c.generation}-е поколение` : ''].filter(Boolean).join(' · ');
    const hasSheetAccess = role === 'gm' || (mine && s.claim.confirmed);
    html = `<div class="dossier-layout">${portrait(c)}<article><span class="eyebrow">${esc(facts || 'Персонаж')}</span><h2 id="detail-title">${esc(c.name)}</h2>${c.nature || c.demeanor ? `<p>${c.nature ? `Натура · ${esc(c.nature)}` : ''}${c.demeanor ? ` · Поведение · ${esc(c.demeanor)}` : ''}</p>` : ''}${s.death ? `<p class="death-date">Погиб · ${esc(s.death.label)}</p>` : ''}${layers(c,s.level)}${hasSheetAccess ? `<section class="character-preview-stats">${statGroups(c)}</section>${c.curse ? `<div class="private-info curse"><span class="eyebrow">Проклятие</span><p>${esc(c.curse)}</p></div>` : ''}${objectivePanel(c,s)}${role === 'gm' ? bloodPanel(c,s) : s.bloodVisible ? `<p class="blood-player">Запас крови · ${s.bloodPool}</p>` : ''}` : ''}${role === 'gm' ? levelControl('character',c,s.level) : ''}<div class="dialog-actions">${role === 'player' ? mine && s.claim.confirmed ? '<button class="gold-button" data-view="sheet">Открыть личный лист</button>' : s.death ? '<p>Этот персонаж недоступен для выбора.</p>' : s.claim && !mine ? '<p>Этот персонаж уже выбран другим игроком.</p>' : owner() ? '<p>У вас уже есть закреплённый персонаж.</p>' : mine ? `<p>Вы выбрали этого персонажа предварительно.</p><button class="gold-button" data-confirm="${esc(c.id)}">Подтвердить выбор</button><button data-release="${esc(c.id)}">Отменить выбор</button>` : `<button class="gold-button" data-reserve="${esc(c.id)}">Выбрать предварительно</button>` : `<button class="gold-button" data-gm-sheet="${esc(c.id)}">Открыть личный лист</button>`}</div></article></div>`;
  } else if (opened.kind === 'room') {
    const r = game.rooms.find(r => r.id === opened.id), s = state.rooms[r.id];
    html = `<span class="eyebrow">Особняк</span><h2 id="detail-title">${esc(r.name)}</h2>${r.image ? illustration(r.image,'location-illustration') : ''}${prose(r.summary)}${s.level || role === 'gm' ? layers(r,s.level) : '<p class="closed-message">Сведения об этой комнате ещё не открыты.</p>'}${role === 'gm' ? levelControl('room',r,s.level) : ''}`;
  } else {
    html = `<span class="eyebrow">Рабочая версия</span><h2 id="detail-title">Подготовка к игре</h2><p>Приняты оформление «Чёрное золото», название «ИГРА» и сентябрь 1917 года. Образ особняка сохранён.</p><p>В ростер внесены очки из девяти листов. Биографии и предыстории из листов не переносились; тексты правил и целей взяты из отдельного DOCX.</p><p>Уже можно проверить предварительный выбор и закрепление персонажа, личный лист, броски d10, раскрытие двух основных целей и отдельной цели предателя, запас крови, пять ночей и шкалу Маскарада.</p><div class="disclosure"><p>${esc(game.notice)}</p></div>`;
  }
  document.querySelector('#detail-content').innerHTML = html;
}
function show(kind, id) { opened = {kind,id}; renderDialog(); dialog.showModal(); }
function updateRollPool() {
  const attribute = document.querySelector('#roll-attribute'), ability = document.querySelector('#roll-ability'), count = document.querySelector('#roll-pool-count');
  if (attribute && ability && count) count.textContent = String((Number(attribute.value)||0) + (Number(ability.value)||0));
}
function rollDice() {
  const pool = Number(document.querySelector('#roll-pool-count')?.textContent)||0, difficulty = Number(document.querySelector('#roll-difficulty')?.value)||6;
  const dice = Array.from({length:pool},()=>Math.floor(Math.random()*10)+1), raw = dice.filter(n=>n>=difficulty).length, ones=dice.filter(n=>n===1).length, successes=Math.max(0,raw-ones);
  const result=document.querySelector('#roll-result');
  if(!result)return;
  const outcome=successes>0?`${successes} ${successes===1?'успех':'успехов'}`:ones?'Провал с единицами':'Успехов нет';
  result.textContent=`${dice.length?dice.join(' · '):'Нет кубиков'} · трудность ${difficulty} · ${outcome}`;
  result.dataset.result=successes>0?'success':ones?'botch':'failure';
}
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const d = b.dataset;
  if (d.setPlayer) {
    const name=document.querySelector('#player-name')?.value.trim();
    if(!name){toast('Укажите имя игрока.');return;}
    playerIdentity={id:`player:${name.toLocaleLowerCase('ru-RU')}`,name};
    try{storage?.setItem('igra-preview-identity-v1',JSON.stringify(playerIdentity));}catch{}
  }
  if (d.view) return navigate(d.view);
  if (d.role) {role = d.role; if(d.openGm==='true')view='gm'; else if(role!=='gm'&&view==='gm')view='house'; dialog.close(); render(); return;}
  if (d.gmSheet) {selectedSheetCharacter=d.gmSheet; return navigate('sheet');}
  if (d.character) {if(role==='gm')selectedSheetCharacter=d.character; return show('character',d.character);}
  if (d.room) return show('room',d.room);
  if (d.reserve) return act({type:'reserve-character',id:d.reserve},'Предварительный выбор отмечен. Подтвердите его в досье.');
  if (d.confirm) return act({type:'confirm-character',id:d.confirm},'Персонаж закреплён. Личный лист открыт.');
  if (d.release) return act({type:'release-character',id:d.release},'Персонаж освобождён.');
  if (d.death) return act({type:'set-death',id:d.death,dead:!state.characters[d.death].death});
  if (d.npc) return act({type:'set-npc-visible',id:d.npc,visible:!state.npcs[d.npc].visible});
  if (d.goal) return act({type:'set-goal-visibility',id:d.id,kind:d.goal,visible:d.visible==='true'});
  if (d.bloodVisible) return act({type:'set-blood-visibility',id:d.bloodVisible,visible:d.visible==='true'});
  if (d.masquerade) return act({type:'adjust-masquerade',delta:Number(d.masquerade)});
  if (d.masqueradeVisible) return act({type:'set-masquerade-visibility',visible:d.masqueradeVisible==='true'});
  if (d.cleanNight) return act({type:'set-clean-night-visibility',visible:d.cleanNight==='true'});
  if (d.publicViewer !== undefined) return act({type:'set-public-viewer',visible:d.publicViewer==='true'},d.publicViewer==='true'?'Зрительская вкладка включена.':'Зрительская вкладка отключена.');
  if (b.id === 'roll-button') return rollDice();
  if (b.id === 'about' || b.id === 'about-footer') return show('about');
  if (b.classList.contains('close')) dialog.close();
});
document.addEventListener('change', e => {
  if (e.target.id === 'day-select') act({type:'set-day',id:e.target.value},'Хроника обновлена.');
  if (e.target.dataset.level) act({type:`set-${e.target.dataset.level}-level`,id:e.target.dataset.id,level:Number(e.target.value)});
  if (e.target.dataset.blood) act({type:'set-blood-pool',id:e.target.dataset.blood,value:Number(e.target.value)});
  if (e.target.id === 'gm-sheet-select') {selectedSheetCharacter=e.target.value;render();}
  if (e.target.id === 'roll-attribute' || e.target.id === 'roll-ability') updateRollPool();
});
document.addEventListener('input', e => {
  if (e.target.id !== 'notes' || role !== 'player') return;
  try {state = session.dispatch({type:'save-note',id:owner(),text:e.target.value},actor()); document.querySelector('#notes-status').textContent = session.isPersistent() ? 'Сохранено в этом браузере.' : 'Хранится до закрытия страницы: локальное сохранение недоступно.';}
  catch {document.querySelector('#notes-status').textContent = 'Не удалось сохранить заметку.';}
});
dialog.addEventListener('close', () => {opened = null;});
dialog.addEventListener('click', e => {const r = dialog.getBoundingClientRect(); if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close();});
window.addEventListener('storage', e => {if (e.key === 'igra-workbench-v2' && session.refresh(e.newValue)) {state = session.read(); render(); if (opened) renderDialog();}});
window.addEventListener('hashchange', () => navigate(views.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'house',false));
if (document.modelContext?.registerTool) {
  document.modelContext.registerTool({name:'navigate_game_view',description:'Открывает раздел рабочей версии сайта ИГРА.',inputSchema:{type:'object',properties:{view:{type:'string',enum:views}},required:['view'],additionalProperties:false},execute:async args => {if (!args || typeof args !== 'object' || Object.keys(args).some(key => key !== 'view') || !views.includes(args.view)) throw new Error('Неизвестный раздел'); navigate(args.view); return {content:[{type:'text',text:JSON.stringify({view,day:day().title})}]};}});
}
render();



