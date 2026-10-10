export function npcWithEdits(n,state){const edit=state.npcOverrides?.[n.id];return edit?{...n,name:edit.name,role:edit.role,summary:edit.summary,layers:[{title:'Сведения ведущего',text:edit.privateText}]}:n;}
/** Only disclosed data leaves the server. Stable IDs keep the existing UI intact. */
export function sessionView(content, state, actor) {
  const game=structuredClone(content), view=structuredClone(state);
  game.npcs=game.npcs.map(n=>npcWithEdits(n,state));
  if(actor.role==='gm')return {content:game,state:view,actor};
  view.npcOverrides={};
  game.gmGuide=[];
  game.cleanNight={...game.cleanNight,text:''};
  view.events=view.events.filter(e=>e.visible);
  view.journal=view.journal.filter(e=>!e.hidden);
  view.notes=Object.fromEntries(Object.entries(view.notes).filter(([k])=>k.startsWith(actor.id+':')));
  if(!view.masquerade.visible)view.masquerade.value=5;
  for(const c of game.characters){
    const entry=view.characters[c.id], mine=actor.role==='player'&&entry.claim?.ownerId===actor.id&&entry.claim.confirmed;
    c.layers=c.layers.slice(0,entry.level);
    if(!mine){
      c.attributes=[];c.abilities=[];c.disciplines=[];c.virtues=[];
      c.nature='';c.demeanor='';c.curse='';c.willpower=0;c.humanity=0;c.bloodPool=0;
      entry.health=[0,0,0,0,0,0,0];entry.willpowerCurrent=0;
      entry.goals={mainVisible:false,traitorVisible:false};
    }
    if(!mine||!entry.bloodVisible){entry.bloodPool=0;entry.bloodVisible=false;c.bloodPool=0;}
    if(!mine||!entry.goals.mainVisible)c.goals.main={personal:'',game:''};
    if(!mine||!entry.goals.traitorVisible)c.goals.traitor='';
    if(c.concealedIdentity&&!mine){c.clan='???';c.affiliation='???';c.generation='';c.description='???';}
  }
  for(const r of game.rooms){
    if(!view.rooms[r.id].visible){r.summary='';r.layers=[];r.image=null;view.rooms[r.id].description=null;}
  }
  game.npcs=game.npcs.filter(n=>view.npcs[n.id]?.visible).map(n=>({...n,layers:n.layers.slice(0,view.npcs[n.id].level)}));
  view.customNpcs=view.customNpcs.filter(n=>view.npcs[n.id]?.visible);
  return {content:game,state:view,actor};
}
