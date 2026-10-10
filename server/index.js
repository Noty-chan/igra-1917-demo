import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {mkdirSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash,randomInt} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {WebSocketServer,WebSocket} from 'ws';
import {gameContent} from '../dist/content/game.js';
import {hydrateState,transition,validateContent} from '../dist/core/state.js';
import {damagePenalty} from '../dist/core/dice.js';
import {sessionView} from './view.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
const dbPath=process.env.DB_PATH||resolve(root,'../data/game.sqlite');
mkdirSync(dirname(dbPath),{recursive:true});
const db=new DatabaseSync(dbPath);db.exec(`PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS game(id INTEGER PRIMARY KEY CHECK(id=1), json TEXT NOT NULL, revision INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,role TEXT NOT NULL,normalized TEXT UNIQUE NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,userId TEXT NOT NULL,expires INTEGER NOT NULL);`);
validateContent(gameContent);
const saved=db.prepare('SELECT json,revision FROM game WHERE id=1').get();
let state=hydrateState(gameContent,saved?JSON.parse(saved.json):{}),revision=saved?.revision||0;
const persist=db.prepare('INSERT INTO game VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json,revision=excluded.revision');
persist.run(JSON.stringify(state),revision);
const gmPassword=process.env.GM_PASSWORD,playerPassword=process.env.PLAYER_PASSWORD;
if(!gmPassword||!playerPassword||gmPassword===playerPassword)throw Error('Set distinct GM_PASSWORD and PLAYER_PASSWORD.');
const hash=value=>createHash('sha256').update(value).digest('hex');
const json=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data));};
function actorFor(req){
 const raw=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('igra_session='))?.slice(13);
 if(!raw)return null;
 const row=db.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.userId WHERE token=? AND expires>?').get(hash(raw),Date.now());
 return row?{id:row.id,name:row.name,role:row.role}:null;
}
function snapshot(actor){return {...sessionView(gameContent,state,actor),revision};}
function broadcast(){for(const ws of wss.clients){if(ws.readyState!==WebSocket.OPEN)continue;if(ws.actor.role==='spectator'&&!state.publicViewerEnabled){ws.send(JSON.stringify({type:'closed'}));ws.close();}else ws.send(JSON.stringify({type:'snapshot',snapshot:snapshot(ws.actor)}));}}
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>600000)throw Error('Слишком большой запрос.');}return JSON.parse(raw||'{}');}
function serverRoll(action,actor){
 const a={...action,createdAt:new Date().toISOString()};
 if(a.type==='record-roll'){
  let pool=a.pool;
  if(actor.role==='player'){
   const c=gameContent.characters.find(c=>c.id===a.characterId),entry=state.characters[a.characterId];
   if(!c||entry.claim?.ownerId!==actor.id||!entry.claim.confirmed)throw Error('Сначала подтвердите своего персонажа.');
   const attr=c.attributes.find(v=>v.key===a.attribute),ability=c.abilities.find(v=>v.key===a.ability),penalty=damagePenalty(entry.health),mod=a.modifier??0;
   if(!attr||!ability||penalty===null||!Number.isInteger(mod)||mod<-10||mod>10)throw Error('Проверьте пул броска.');
   pool=Math.max(0,attr.value+ability.value+mod-penalty);
  }
  if(!Number.isInteger(pool)||pool<0||pool>50)throw Error('Пул должен быть от 0 до 50.');
  a.pool=pool;a.dice=Array.from({length:pool},()=>randomInt(1,11));
 }
 return a;
}
const allowed=new Set(['reserve-character','confirm-character','release-character','set-character-level','set-npc-level','set-goal-visibility','set-blood-pool','set-blood-visibility','adjust-masquerade','set-masquerade-visibility','set-public-viewer','set-death','set-npc-visible','save-note','save-custom-npc','save-npc-text','delete-custom-npc','set-room-visible','save-room-description','set-day','set-health','set-willpower','record-roll','post-message','comment-roll','save-event','toggle-event','delete-event','delete-journal']);
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&url.pathname==='/runtime.js'){res.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-store'});return res.end('window.IGRA_NETWORK=true;');}
  if(req.method==='GET'&&url.pathname==='/api/health')return json(res,200,{ok:true});
  if(req.method==='POST'&&url.pathname==='/api/login'){
   const input=await body(req),role=input.role,name=String(input.name||'').trim().slice(0,60);
   if(!['gm','player','spectator'].includes(role)||!name||input.password!==(role==='gm'?gmPassword:playerPassword))return json(res,401,{error:'Неверное имя, режим или пароль.'});
   if(role==='spectator'&&!state.publicViewerEnabled)return json(res,403,{error:'Ведущий ещё не открыл зрительский режим.'});
   const normalized=role+':'+name.toLocaleLowerCase('ru-RU'),id=role==='gm'?'gm':hash(normalized).slice(0,24);
   if(role==='gm')db.prepare('INSERT OR IGNORE INTO users VALUES(?,?,?,?)').run(id,'Ведущий',role,'gm');
   else db.prepare('INSERT OR IGNORE INTO users VALUES(?,?,?,?)').run(id,name,role,normalized);
   const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),id,Date.now()+30*86400000);
   const actor={id,name:role==='gm'?'Ведущий':db.prepare('SELECT name FROM users WHERE id=?').get(id).name,role};
   return json(res,200,snapshot(actor),{'Set-Cookie':`igra_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${process.env.COOKIE_SECURE==='true'?'; Secure':''}`});
  }
  const actor=actorFor(req);
  if(url.pathname.startsWith('/api/')){
   if(!actor)return json(res,401,{error:'Войдите в игру.'});
   if(req.headers.origin&&req.headers.origin!==`${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}`)return json(res,403,{error:'Неверный источник запроса.'});
   if(actor.role==='spectator'&&!state.publicViewerEnabled&&url.pathname!=='/api/logout')return json(res,403,{error:'Зрительский режим закрыт.'});
   if(req.method==='POST'&&url.pathname==='/api/logout'){
    const token=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('igra_session='))?.slice(13);
    if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token));
    return json(res,200,{ok:true},{'Set-Cookie':'igra_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'});
   }
   if(req.method==='GET'&&url.pathname==='/api/session')return json(res,200,snapshot(actor));
   if(req.method==='POST'&&url.pathname==='/api/action'){
    const action=await body(req);if(!allowed.has(action.type))throw Error('Неизвестное действие.');
    const next=transition(gameContent,state,serverRoll(action,actor),actor);
    persist.run(JSON.stringify(next),revision+1);state=next;revision++;
    broadcast();return json(res,200,snapshot(actor));
   }
   return json(res,404,{error:'Не найдено.'});
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Метод не поддерживается.'});
  // Full scenario source is never served from this deployment.
  if(url.pathname==='/content/game.js')return json(res,403,{error:'Сценарий доступен через игровую сессию.'});
  const file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(file===resolve(root,'content/game.js'))return json(res,403,{error:'Сценарий доступен через игровую сессию.'});
  if(!file.startsWith(root+'/')&&!file.startsWith(root+'\\'))return json(res,404,{error:'Не найдено.'});
  if((await stat(file)).isDirectory())return json(res,404,{error:'Не найдено.'});
  const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
  res.writeHead(200,{'Content-Type':(mime[extname(file)]||'application/octet-stream')+'; charset=utf-8','Cache-Control':file.endsWith('.html')?'no-store':'public, max-age=300'});
  res.end(req.method==='HEAD'?undefined:await readFile(file));
 }catch(error){if(!res.headersSent)json(res,error.code==='ENOENT'?404:400,{error:error.code==='ENOENT'?'Не найдено.':error.message});else res.end();}
});
const wss=new WebSocketServer({noServer:true,maxPayload:1024});
server.on('upgrade',(req,socket,head)=>{
 const actor=actorFor(req),origin=req.headers.origin;
 let validOrigin=true;try{if(origin)validOrigin=new URL(origin).host===req.headers.host;}catch{validOrigin=false;}
 if(req.url!=='/ws'||!actor||(actor.role==='spectator'&&!state.publicViewerEnabled)||!validOrigin){socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');return socket.destroy();}
 wss.handleUpgrade(req,socket,head,ws=>{ws.actor=actor;ws.alive=true;ws.on('pong',()=>ws.alive=true);ws.on('error',()=>{});ws.send(JSON.stringify({type:'snapshot',snapshot:snapshot(actor)}));});
});
const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive)ws.terminate();else{ws.alive=false;ws.ping();}}},30000);heartbeat.unref();
server.listen(Number(process.env.PORT||4180),process.env.HOST||'127.0.0.1',()=>console.log('ИГРА: сервер запущен'));
process.on('SIGTERM',()=>{clearInterval(heartbeat);for(const ws of wss.clients)ws.close();server.close(()=>{db.close();process.exit(0);});setTimeout(()=>process.exit(0),5000).unref();});
