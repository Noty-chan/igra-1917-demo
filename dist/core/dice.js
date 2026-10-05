export const healthLevels = [
  {name:'Ушибы',penalty:0}, {name:'Лёгкие ранения',penalty:1},
  {name:'Повреждения',penalty:1}, {name:'Тяжёлые ранения',penalty:2},
  {name:'Травмы',penalty:2}, {name:'Увечья',penalty:5},
  {name:'Обездвижен',penalty:null}
];
export function damagePenalty(health) {
  const count = health.filter(Boolean).length;
  return count ? healthLevels[Math.min(6,count-1)].penalty : 0;
}
export function evaluateRoll(dice, difficulty = 6, willpower = false) {
  if (!Array.isArray(dice) || dice.length > 50 || dice.some(n=>!Number.isInteger(n)||n<1||n>10)) throw new Error('Нужны результаты кубиков d10.');
  if (!Number.isInteger(difficulty) || difficulty<2 || difficulty>10) throw new Error('Сложность должна быть от 2 до 10.');
  const raw = dice.filter(n=>n>=difficulty).length, ones = dice.filter(n=>n===1).length;
  const ordinary = Math.max(0,raw-ones), automatic = willpower ? 1 : 0;
  const successes = ordinary + automatic;
  return {raw,ones,ordinary,automatic,successes,outcome:successes>0?'success':raw===0&&ones>0?'botch':'failure'};
}
export function throwD10(pool) {
  if (!Number.isInteger(pool)||pool<0||pool>50) throw new Error('Пул должен быть от 0 до 50.');
  const dice=[];
  while(dice.length<pool){
    const bytes = new Uint8Array(Math.max(1,pool-dice.length));
    globalThis.crypto.getRandomValues(bytes);
    for(const byte of bytes)if(byte<250&&dice.length<pool)dice.push(byte%10+1);
  }
  return dice;
}
export function visibleJournal(state, actor) {
  return state.journal.filter(entry=>actor.role==='gm'||!entry.hidden);
}
