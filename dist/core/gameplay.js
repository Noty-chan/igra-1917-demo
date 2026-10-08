import { evaluateRoll, damagePenalty } from './dice.js?v=15';

export function hydrateGameplay(content, saved) {
  const example = {id:'event-clean-night',title:content.cleanNight.title,text:content.cleanNight.text,dayId:'day-04',visible:saved.cleanNightVisible===true};
  const events = Array.isArray(saved.events) ? saved.events.filter(e=>e&&typeof e.id==='string'&&typeof e.title==='string'&&typeof e.text==='string').map(e=>({...e,visible:e.visible===true,dayId:content.days.some(d=>d.id===e.dayId)?e.dayId:null})) : [example];
  const journal = Array.isArray(saved.journal) ? saved.journal.filter(e=>e&&typeof e.id==='string'&&typeof e.authorId==='string'&&['roll','message'].includes(e.type)).map(e=>({...e,hidden:e.hidden===true,comments:Array.isArray(e.comments)?e.comments:[]})).slice(-1000) : [];
  return {events,journal};
}

export function applyGameplay(content, state, action, actor) {
  const types=['set-health','set-willpower','record-roll','post-message','comment-roll','save-event','toggle-event','delete-event','delete-journal'];
  if(!types.includes(action.type))return false;
  const gm=()=>{if(actor.role!=='gm')throw new Error('Это действие доступно ведущему.')};
  const character=(id)=>{
    const data=content.characters.find(c=>c.id===id), entry=state.characters[id];
    if(!data||!entry)throw new Error('Персонаж не найден.');
    if(actor.role!=='gm'&&(actor.role!=='player'||entry.claim?.ownerId!==actor.id||!entry.claim.confirmed))throw new Error('Это не ваш персонаж.');
    return [data,entry];
  };
  const text=(value,max,required=false)=>{if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error('Проверьте текст сообщения.');return value.trim()};
  const identity=()=>{
    if(typeof action.id!=='string'||!/^[a-z0-9-]{1,80}$/.test(action.id))throw new Error('Нужен идентификатор записи.');
    if(!Number.isFinite(Date.parse(action.createdAt)))throw new Error('Нужна дата записи.');
    if(state.journal.some(e=>e.id===action.id))throw new Error('Запись уже существует.');
    return {id:action.id,createdAt:action.createdAt,authorId:actor.id,authorName:String(actor.name||'Ведущий').slice(0,80),authorRole:actor.role,hidden:action.hidden===true,comments:[]};
  };
  switch(action.type){
    case 'set-health': {
      const [,entry]=character(action.id);
      if(!Array.isArray(action.health)||action.health.length!==7||action.health.some(n=>!Number.isInteger(n)||n<0||n>3))throw new Error('Нужно семь уровней повреждений.');
      entry.health=[...action.health];break;
    }
    case 'set-willpower': {
      const [data,entry]=character(action.id);
      if(!Number.isInteger(action.value)||action.value<0||action.value>data.willpower)throw new Error('Временная воля не может превышать постоянную.');
      entry.willpowerCurrent=action.value;break;
    }
    case 'record-roll': {
      if(actor.role==='spectator')throw new Error('Зритель не делает броски.');
      if(action.hidden===true)gm();
      const row=identity();
      let data,entry,pool=action.pool,label=String(action.label||'Бросок ведущего').slice(0,120),penalty=0;
      if(action.characterId){[data,entry]=character(action.characterId);penalty=damagePenalty(entry.health);}
      if(actor.role==='player'){
        if(!data)throw new Error('Сначала подтвердите персонажа.');
        if(entry.death)throw new Error('Персонаж отмечен погибшим.');
        if(penalty===null)throw new Error('Персонаж обездвижен; бросок согласуйте с ведущим.');
        const a=data.attributes.find(a=>a.key===action.attribute),s=data.abilities.find(a=>a.key===action.ability);
        if(!a||!s)throw new Error('Выберите характеристику и навык.');
        const modifier=action.modifier??0;
        if(!Number.isInteger(modifier)||modifier<-10||modifier>10)throw new Error('Модификатор должен быть от −10 до 10.');
        pool=Math.max(0,a.value+s.value+modifier-penalty);
        label=`${a.name} + ${s.name}${modifier?` (${modifier>0?'+':''}${modifier})`:''}${penalty?` · ранения −${penalty}`:''}`;
      }
      if(!Number.isInteger(pool)||pool<0||pool>50||!Array.isArray(action.dice)||action.dice.length!==pool)throw new Error('Количество результатов не соответствует пулу.');
      if(action.willpower===true&&(!entry||entry.willpowerCurrent<1))throw new Error('Нет временной воли для автоматического успеха.');
      const result=evaluateRoll(action.dice,action.difficulty,action.willpower===true);
      const note=text(action.note??'',2000);
      if(action.willpower===true)entry.willpowerCurrent--;
      state.journal.push({...row,type:'roll',characterId:data?.id??null,characterName:data?.name??null,label,pool,dice:[...action.dice],difficulty:action.difficulty,result,note});
      state.journal=state.journal.slice(-1000);break;
    }
    case 'post-message': {
      if(actor.role==='spectator')throw new Error('Зритель читает журнал.');
      if(action.hidden===true)gm();
      const row=identity(),note=text(action.note,2000,true);
      state.journal.push({...row,type:'message',note});state.journal=state.journal.slice(-1000);break;
    }
    case 'delete-journal': {
      const row=state.journal.find(e=>e.id===action.id);
      if(!row)throw new Error('Запись не найдена.');
      if(actor.role!=='gm'&&(actor.role!=='player'||row.authorId!==actor.id))throw new Error('Можно удалять только свои записи.');
      state.journal=state.journal.filter(e=>e.id!==action.id);break;
    }
    case 'comment-roll': {
      gm();const row=state.journal.find(e=>e.id===action.id);if(!row)throw new Error('Запись не найдена.');
      if(!Number.isFinite(Date.parse(action.createdAt)))throw new Error('Нужна дата комментария.');
      row.comments.push({text:text(action.text,2000,true),createdAt:action.createdAt,authorName:actor.name||'Ведущий'});break;
    }
    case 'save-event': {
      gm();if(typeof action.id!=='string'||!/^[a-z0-9-]{1,80}$/.test(action.id))throw new Error('Нужен идентификатор события.');
      if(action.dayId!==null&&!content.days.some(d=>d.id===action.dayId))throw new Error('Выберите ночь события.');
      const event={id:action.id,title:text(action.title,120,true),text:text(action.text,10000,true),dayId:action.dayId,visible:action.visible===true};
      const index=state.events.findIndex(e=>e.id===action.id);if(index<0)state.events.push(event);else state.events[index]=event;
      break;
    }
    case 'toggle-event': {
      gm();const event=state.events.find(e=>e.id===action.id);if(!event)throw new Error('Событие не найдено.');event.visible=action.visible===true;break;
    }
    case 'delete-event': gm();state.events=state.events.filter(e=>e.id!==action.id);break;
  }
  return true;
}
