export async function networkLogin(){
  const form=document.querySelector('#login-form'),error=document.querySelector('#login-error');
  document.querySelector('label[for="login-username"]').textContent='Ваше имя';
  document.querySelector('#login-username').placeholder='Имя игрока или gm';
  const mode=document.createElement('label');mode.textContent='Войти как';
  mode.innerHTML+=' <select name="role"><option value="player">Игрок</option><option value="gm">Ведущий</option><option value="spectator">Зритель</option></select>';
  form.insertBefore(mode,form.querySelector('button'));
  async function request(path,body){const res=await fetch(path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});const data=await res.json();if(!res.ok)throw Error(data.error||'Ошибка соединения.');return data;}
  const reveal=()=>{document.querySelector('#login-screen').hidden=true;document.querySelector('#application').hidden=false;};
  try{const snapshot=await request('/api/session');reveal();return snapshot;}catch{}
  return new Promise(resolve=>form.addEventListener('submit',async e=>{
    e.preventDefault();const button=form.querySelector('button');button.disabled=true;
    try{const f=new FormData(form),snapshot=await request('/api/login',{name:f.get('username'),password:f.get('password'),role:f.get('role')});error.textContent='';form.querySelector('[name="password"]').value='';reveal();resolve(snapshot);}
    catch(ex){error.textContent=ex.message;}finally{button.disabled=false;}
  }));
}
export function createNetworkSession(initial){
  let current=initial,listener=()=>{},socket,timer,stopped=false;
  const status=document.createElement('span');status.className='connection-status';status.textContent='Подключение…';document.querySelector('.role-panel').append(status);
  function accept(snapshot){if(snapshot.revision<=current.revision)return;current=snapshot;listener(snapshot);}
  function connect(){
    socket=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws`);
    socket.onopen=()=>{status.textContent='В сети';};
    socket.onmessage=e=>{try{const data=JSON.parse(e.data);if(data.type==='snapshot')accept(data.snapshot);if(data.type==='closed'){stopped=true;location.reload();}}catch{status.textContent='Ошибка обновления';}};
    socket.onerror=()=>socket.close();
    socket.onclose=()=>{status.textContent='Переподключение…';if(!stopped)timer=setTimeout(connect,2000);};
  }
  connect();
  return {read:()=>structuredClone(current.state),isPersistent:()=>true,subscribe(fn){listener=fn;},async dispatch(action){
    if(socket?.readyState!==WebSocket.OPEN)throw Error('Нет связи с сервером. Дождитесь переподключения.');
    const res=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action)});
    const data=await res.json();if(!res.ok)throw Error(data.error||'Действие не выполнено.');accept(data);return structuredClone(data.state);
  },async logout(){stopped=true;clearTimeout(timer);socket?.close();await fetch('/api/logout',{method:'POST'});location.reload();}};
}
