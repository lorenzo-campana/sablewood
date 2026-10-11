/* Sussurri al GM: ogni giocatore ha una conversazione privata col master.
   Database: chat/<idGiocatore> (nome, ultimo messaggio) e chat/<idGiocatore>/m/<id> (un documento per messaggio).
   Regole: il prefisso chat lo legge e lo scrive solo il proprietario (il GM); chat/{self} lo scrive il giocatore,
   così nessuno vede le conversazioni degli altri. Il GM ha in basso a destra una linguetta per giocatore e i popup
   delle chat aperte; il giocatore ha un solo popup «Scrivi al GM». */
const CHAT={on:false,me:'',threads:{},msgs:{},subs:new Set(),open:[],min:{},seen:{},draft:{},err:''};
function chatSeenSave(){try{localStorage.setItem('dh-chat-seen:'+CHAT.me,JSON.stringify(CHAT.seen))}catch(e){}}
function chatInit(){if(CHAT.on||!VIEW.tdb||!PL.account||PL.account==='browser'||PL.localOnly)return;CHAT.on=true;CHAT.me=PL.account;
 try{CHAT.seen=JSON.parse(localStorage.getItem('dh-chat-seen:'+CHAT.me)||'{}')}catch(e){}
 if(VIEW.canGM)VIEW.tdb.collection('chat').onSnapshot(s=>{for(const d of s.docs||[]){const v=d.data()||{};CHAT.threads[d.id]=v;chatWatch(d.id)}chatRender()},()=>{});
 else{CHAT.threads[CHAT.me]={name:'Master'};chatWatch(CHAT.me)}
 chatRender()}
function chatWatch(id){if(CHAT.subs.has(id))return;CHAT.subs.add(id);
 VIEW.tdb.collection('chat/'+id+'/m').orderBy('at').onSnapshot(s=>{const first=!(id in CHAT.msgs),before=(CHAT.msgs[id]||[]).length,list=(s.docs||[]).map(d=>d.data()).filter(m=>m&&typeof m.text==='string');CHAT.msgs[id]=list;
  const last=list.at(-1);if(!first&&list.length>before&&last&&last.from!==chatSide()&&!chatVisible(id)){if(VIEW.canGM&&!CHAT.open.includes(id))CHAT.open.push(id),CHAT.min[id]=true;if(typeof toast==='function')toast((VIEW.canGM?chatName(id):'Il GM')+': '+last.text.slice(0,60))}
  if(chatVisible(id)){CHAT.seen[id]=Date.now();chatSeenSave()}chatRender()},()=>{CHAT.err='Chat non disponibile';chatRender()})}
const chatSide=()=>VIEW.canGM?'gm':'p';
const chatName=id=>VIEW.canGM?(CHAT.threads[id]?.name||'Giocatore'):'Master';
const chatVisible=id=>CHAT.open.includes(id)&&!CHAT.min[id]&&document.visibilityState!=='hidden';
const chatUnread=id=>(CHAT.msgs[id]||[]).filter(m=>m.from!==chatSide()&&m.at>(CHAT.seen[id]||0)).length;
async function chatSend(id,text){text=String(text||'').trim().slice(0,1000);if(!text||!VIEW.tdb)return;const at=Date.now();
 try{if(!VIEW.canGM){const names=(PL.chars||[]).filter(c=>c.name).map(c=>c.name);await VIEW.tdb.doc('chat/'+id).set({name:names.join(', ')||'Giocatore',at})}
  else await VIEW.tdb.doc('chat/'+id).set({name:CHAT.threads[id]?.name||'Giocatore',at});
  await VIEW.tdb.collection('chat/'+id+'/m').doc().set({from:chatSide(),text,at});CHAT.draft[id]='';CHAT.err=''}
 catch(e){CHAT.err='Messaggio non inviato: riprova.'}chatRender()}
function chatShown(){return VIEW.mode==='gm'?VIEW.canGM:VIEW.mode==='player'}
function chatRender(){let el=document.getElementById('chat-dock');if(!el){el=document.createElement('div');el.id='chat-dock';document.body.appendChild(el)}
 if(!CHAT.on||!chatShown()){el.innerHTML='';return}
 const task=document.querySelector('#tbl:not([hidden]) .tbl-task');el.style.setProperty('--chat-bottom',(task?task.offsetHeight+10:12)+'px');
 const ids=VIEW.canGM?Object.keys(CHAT.threads).sort((a,b)=>(CHAT.threads[b].at||0)-(CHAT.threads[a].at||0)):[CHAT.me];
 const fmt=t=>new Date(t).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
 const pop=id=>{const ms=CHAT.msgs[id]||[];return `<section class="chat-pop" data-id="${esc(id)}" role="dialog" aria-label="Chat con ${esc(chatName(id))}"><header><b>${esc(chatName(id))}</b><span>${VIEW.canGM?'privata':'solo tu e il GM'}</span><button type="button" data-chat="min" data-id="${esc(id)}" aria-label="Riduci">–</button>${VIEW.canGM?`<button type="button" data-chat="close" data-id="${esc(id)}" aria-label="Chiudi">×</button>`:''}</header>
  <div class="chat-list">${ms.length?ms.map(m=>`<div class="chat-msg ${m.from===chatSide()?'me':''}"><p>${esc(m.text)}</p><small>${fmt(m.at)}</small></div>`).join(''):`<p class="chat-empty">${VIEW.canGM?'Nessun messaggio.':'Scrivi al GM: azioni segrete, domande, idee. Lo vede solo lui.'}</p>`}</div>
  ${CHAT.err?`<p class="chat-err">${esc(CHAT.err)}</p>`:''}<form data-chat-form="${esc(id)}"><textarea rows="2" placeholder="Scrivi… (Invio per mandare)" aria-label="Messaggio" data-chat-input="${esc(id)}">${esc(CHAT.draft[id]||'')}</textarea><button type="submit" aria-label="Invia">➤</button></form></section>`};
 const act=document.activeElement?.dataset?.chatInput,sel=act?[document.activeElement.selectionStart,document.activeElement.selectionEnd]:null;
 const tabs=ids.map(id=>{const n=chatUnread(id),on=CHAT.open.includes(id)&&!CHAT.min[id];return `<button type="button" class="chat-tab ${on?'on':''} ${n?'new':''}" data-chat="toggle" data-id="${esc(id)}"><i aria-hidden="true">${VIEW.canGM?esc((chatName(id)[0]||'?').toUpperCase()):'✉'}</i><span>${VIEW.canGM?esc(chatName(id)):'Scrivi al GM'}</span>${n?`<em>${n}</em>`:''}</button>`}).join('');
 el.innerHTML=`<div class="chat-pops">${CHAT.open.filter(id=>!CHAT.min[id]).map(pop).join('')}</div>${ids.length?`<div class="chat-tabs">${tabs}</div>`:''}`;
 el.querySelectorAll('.chat-list').forEach(l=>l.scrollTop=l.scrollHeight);
 if(act){const t=el.querySelector(`[data-chat-input="${CSS.escape(act)}"]`);if(t){t.focus();try{t.setSelectionRange(sel[0],sel[1])}catch(e){}}}}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-chat]');if(!b)return;e.preventDefault();e.stopPropagation();const id=b.dataset.id,a=b.dataset.chat;
 if(a==='open-with'){if(!CHAT.on)chatInit();if(!CHAT.on){if(typeof toast==='function')toast('La chat non è disponibile qui.');return}if(!CHAT.threads[id])CHAT.threads[id]={name:b.dataset.name||'Giocatore',at:0};chatWatch(id);if(!CHAT.open.includes(id))CHAT.open.push(id);CHAT.min[id]=false;if(CHAT.open.length>3)CHAT.open=CHAT.open.filter(x=>x===id||!CHAT.min[x]).slice(-3)}
 else if(a==='toggle'){if(!CHAT.open.includes(id)){CHAT.open.push(id);CHAT.min[id]=false}else CHAT.min[id]=!CHAT.min[id];if(VIEW.canGM&&CHAT.open.length>3)CHAT.open=CHAT.open.filter(x=>x===id||!CHAT.min[x]).slice(-3)}
 else if(a==='min')CHAT.min[id]=true;else if(a==='close'){CHAT.open=CHAT.open.filter(x=>x!==id)}
 if(chatVisible(id)){CHAT.seen[id]=Date.now();chatSeenSave()}chatRender();if(chatVisible(id))document.querySelector(`[data-chat-input="${CSS.escape(id)}"]`)?.focus()},true);
document.addEventListener('input',e=>{const id=e.target.dataset?.chatInput;if(id!=null)CHAT.draft[id]=e.target.value});
document.addEventListener('keydown',e=>{const id=e.target.dataset?.chatInput;if(id==null)return;e.stopPropagation();if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();chatSend(id,e.target.value)}},true);
document.addEventListener('submit',e=>{const id=e.target.dataset?.chatForm;if(id==null)return;e.preventDefault();chatSend(id,e.target.querySelector('textarea')?.value)});
document.addEventListener('visibilitychange',()=>{for(const id of CHAT.open)if(chatVisible(id))CHAT.seen[id]=Date.now();chatSeenSave();chatRender()});
// la chat parte appena il tavolo conosce l'account; si ridisegna quando cambia la modalità o la barra del tavolo
setInterval(()=>{if(!CHAT.on)chatInit();else{const want=chatShown(),has=!!document.querySelector('#chat-dock .chat-tabs');if(want!==has)chatRender();const task=document.querySelector('#tbl:not([hidden]) .tbl-task'),b=(task?task.offsetHeight+10:12)+'px',el=document.getElementById('chat-dock');if(el&&el.style.getPropertyValue('--chat-bottom')!==b)el.style.setProperty('--chat-bottom',b)}},1000);
