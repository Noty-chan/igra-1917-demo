// Decoration is driven by disclosed session state; values and controls stay readable.
const palette = [
  ['#a7a7a7','#8e8e8e','#535353','#c1c1c1'],
  ['#ed4942','#bd8279','#73352d','#ed5950'],
  ['#e66752','#b48c75','#73402c','#e87557'],
  ['#e6a06a','#c0a086','#705136','#e6aa70'],
  ['#edc17a','#c2ad83','#68552d','#eac678'],
  ['#f3d571','#c2ad83','#68552d','#f0cd59']
];
export function atmosphereLevel(state,role) {
  return role==='gm'||state.masquerade.visible?state.masquerade.value:5;
}
export function corruptedTitle(text,level) {
  if(level===0||level>=4)return text;
  const marks=['\u030d','\u0337','\u0323','\u035b','\u0330','\u030f'];
  const strength=4-level;
  return Array.from(text).map((c,i)=>{
    if(!/[А-Яа-яЁёA-Za-z]/.test(c)||i%(level===3?4:level===2?2:1))return c;
    return c+Array.from({length:strength},(_,j)=>marks[(i+j*2)%marks.length]).join('');
  }).join('');
}
export function applyAtmosphere(state,role) {
  const level=atmosphereLevel(state,role),root=document.documentElement;
  root.dataset.masquerade=String(level);
  ['--ink','--muted','--line','--accent'].forEach((key,i)=>root.style.setProperty(key,palette[level][i]));
  root.style.setProperty('--fracture-opacity',String([.55,.48,.32,.18,.06,0][level]));
  decorateTitles(document.querySelector('#content'),level);
  decorateTitles(document.querySelector('#detail-content'),level);
  const night=document.querySelector('#day-title');
  if(night)decorateTitle(night,level);
}
export function decorateTitles(scope,level=Number(document.documentElement.dataset.masquerade||5)) {
  scope?.querySelectorAll('h1,h2,h3').forEach(el=>decorateTitle(el,level));
}
function decorateTitle(el,level) {
  const text=el.dataset.cleanTitle||el.textContent;
  el.dataset.cleanTitle=text;
  el.replaceChildren();
  const readable=document.createElement('span');readable.className='sr-only';readable.textContent=text;
  const visual=document.createElement('span');visual.className='atmospheric-title';visual.setAttribute('aria-hidden','true');visual.textContent=corruptedTitle(text,level);
  el.append(readable,visual);
}
