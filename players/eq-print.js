/* Stampa delle mini card equipaggiamento: si sceglie cosa stampare (singole carte, l'equipaggiamento di un
   personaggio o del party) e si ottengono fogli A4 con 16 mini card 41×63 mm (4×4), con i segni di taglio.
   La selezione resta nel browser; anteprima a schermo e PDF con html2canvas + jsPDF come la scheda. */
const EQP={open:false,q:'',sel:[],kinds:['primary','secondary','armor'],camp:false};
try{EQP.sel=JSON.parse(localStorage.getItem('dh-eq-print')||'[]').filter(x=>eqItem(x.id))}catch(e){}
const eqpSave=()=>{try{localStorage.setItem('dh-eq-print',JSON.stringify(EQP.sel))}catch(e){}};
const EQP_PER=16;
function eqpAdd(id,n=1){if(!eqItem(id))return;const x=EQP.sel.find(s=>s.id===id);if(x)x.n=Math.min(20,x.n+n);else EQP.sel.push({id,n:Math.max(1,n)});eqpSave()}
function eqpCards(){return EQP.sel.flatMap(s=>Array.from({length:s.n},()=>s.id))}
// equipaggiamento di un personaggio: armi e armatura attive, inventory weapon e oggetti con carta
function eqpFromChar(c){eqEnsure(c);const ids=new Set();for(const k of ['primary','secondary','armorId'])if(c[k])ids.add(c[k]);for(const x of c.items||[]){const e=eqItem(x.gear);if(e&&!e.brawler&&!/^supply-/.test(e.id))eqpAdd(e.id,Math.min(x.qty||1,5)),ids.delete(e.id)}for(const id of ids)eqpAdd(id)}
// carte di un tier, coi tipi spuntati; le armi delle campagne solo se richiesto
function eqpTier(t){return EQ_CATALOG.filter(e=>!e.brawler&&e.tier===t&&EQP.kinds.includes(e.kind)&&(EQP.camp||!/^campaign-/.test(e.id)))}
function eqpPages(){const cards=eqpCards(),pages=[];for(let i=0;i<cards.length;i+=EQP_PER)pages.push(cards.slice(i,i+EQP_PER));return pages}
function eqpPageHTML(ids,k,total){return `<div class="eqp-page"><div class="eqp-grid">${Array.from({length:EQP_PER},(_,i)=>ids[i]?`<div class="eqp-cell">${eqPrintCard(eqItem(ids[i]))}</div>`:'<div class="eqp-cell empty"></div>').join('')}</div><footer>Mini card 41 × 63 mm · ritaglia lungo i segni · foglio ${k+1} di ${total}</footer></div>`}
function eqpHTML(){const q=cfold(EQP.q.trim()),hits=q?EQ_CATALOG.filter(e=>!e.brawler&&cfold(e.name).includes(q)).slice(0,12):[],pages=eqpPages(),n=eqpCards().length;
 const chars=(typeof PL!=='undefined'?PL.chars:[]).filter(c=>c.className);
 return `<div class="pl-print-bar"><b>Stampa mini card</b><span class="pl-print-msg" role="status">${n} carte · ${pages.length} ${pages.length===1?'foglio':'fogli'} A4</span><button type="button" class="btn pri" data-eqp="pdf" ${n?'':'disabled'}>Scarica PDF</button><button type="button" class="btn" data-eqp="print" ${n?'':'disabled'}>Stampa</button><button type="button" class="btn" data-eqp="close">Chiudi</button></div>
 <div class="eqp-body"><aside class="eqp-side">
  <label class="eqp-search">Aggiungi una carta<input type="search" data-eqp-q value="${esc(EQP.q)}" placeholder="Cerca per nome…"></label>
  ${hits.length?`<ul class="eqp-hits">${hits.map(e=>`<li><button type="button" data-eqp="add" data-id="${esc(e.id)}"><b>${esc(e.name)}</b><small>${esc(eqLabel(e.kind))}${e.tier?' · T'+e.tier:''}</small><span>＋</span></button></li>`).join('')}</ul>`:''}
  <div class="eqp-quick eqp-tiers"><small>Tutte le carte di un tier</small>
   <div class="eqp-kinds">${[['primary','Primarie'],['secondary','Secondarie'],['armor','Armature']].map(([k,l])=>`<label><input type="checkbox" data-eqp-kind="${k}" ${EQP.kinds.includes(k)?'checked':''}> ${l}</label>`).join('')}<label title="Armi delle campagne Beast Feast, Colossus, Andaluria"><input type="checkbox" data-eqp-camp ${EQP.camp?'checked':''}> anche le campagne</label></div>
   ${[1,2,3,4].map(t=>`<button type="button" class="btn" data-eqp="tier" data-t="${t}">＋ Tier ${t} <span>${eqpTier(t).length}</span></button>`).join('')}
   <button type="button" class="btn" data-eqp="kind-all" data-k="item">＋ Tutti gli oggetti <span>${EQ_CATALOG.filter(e=>e.kind==='item').length}</span></button><button type="button" class="btn" data-eqp="kind-all" data-k="consumable">＋ Tutti i consumabili <span>${EQ_CATALOG.filter(e=>e.kind==='consumable').length}</span></button></div>
  ${chars.length?`<div class="eqp-quick"><small>Equipaggiamento di un personaggio</small>${chars.map(c=>`<button type="button" class="btn" data-eqp="char" data-id="${esc(c.id)}">＋ ${esc(c.name||'Senza nome')}</button>`).join('')}${chars.length>1?`<button type="button" class="btn" data-eqp="party">＋ Tutti i personaggi</button>`:''}</div>`:''}
  <div class="eqp-sel"><small>Da stampare</small>${EQP.sel.length?EQP.sel.map(s=>{const e=eqItem(s.id);return `<div class="eqp-row"><span><b>${esc(e.name)}</b><small>${esc(eqLabel(e.kind))}</small></span><button type="button" data-eqp="less" data-id="${esc(s.id)}" aria-label="Una copia in meno">−</button><em>${s.n}</em><button type="button" data-eqp="more" data-id="${esc(s.id)}" aria-label="Una copia in più">+</button></div>`}).join(''):'<p class="eqp-empty">Nessuna carta. Cerca qui sopra, aggiungi l\'equipaggiamento di un personaggio, oppure apri una carta e premi «Aggiungi alla stampa».</p>'}${EQP.sel.length?'<button type="button" class="btn eqp-clear" data-eqp="clear">Svuota</button>':''}</div>
 </aside><div class="pl-print-stage eqp-stage">${pages.length?pages.map((p,k)=>`<div class="eqp-scale">${eqpPageHTML(p,k,pages.length)}</div>`).join(''):'<p class="eqp-none">L\'anteprima dei fogli compare qui.</p>'}</div></div>`}
function eqpRender(){let el=document.getElementById('eq-print-ov');if(!EQP.open){if(el)el.remove();document.body.classList.remove('pl-print-on');return}
 if(!el){el=document.createElement('div');el.id='eq-print-ov';el.className='pl-print-ov';document.body.appendChild(el)}
 const st=el.querySelector('.eqp-stage')?.scrollTop||0,focus=document.activeElement?.matches?.('[data-eqp-q]');el.innerHTML=eqpHTML();document.body.classList.add('pl-print-on');
 const stage=el.querySelector('.eqp-stage');if(stage)stage.scrollTop=st;if(focus){const i=el.querySelector('[data-eqp-q]');i.focus();i.setSelectionRange(i.value.length,i.value.length)}
 (document.fonts?.ready||Promise.resolve()).then(()=>{el.querySelectorAll('.eqp-cell').forEach(c=>eqPrintFit(c));eqpScale()})}
function eqpScale(){const el=document.getElementById('eq-print-ov'),stage=el?.querySelector('.eqp-stage');if(!stage)return;stage.querySelectorAll('.eqp-scale').forEach(s=>{const pg=s.firstElementChild;s.style.transform='none';const k=Math.min((stage.clientWidth-40)/pg.offsetWidth,1.2);s.style.transform=`scale(${k})`;s.style.width=pg.offsetWidth*k+'px';s.style.height=pg.offsetHeight*k+'px'})}
async function eqpPdf(){const el=document.getElementById('eq-print-ov'),msg=el?.querySelector('.pl-print-msg'),pages=eqpPages();if(!pages.length)return;if(msg)msg.textContent='Creo il PDF…';
 const host=document.createElement('div');host.className='pl-print-capture';document.body.appendChild(host);
 try{await Promise.all([loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')]);await (document.fonts?.ready||Promise.resolve());
  const pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4',compress:true});
  for(let k=0;k<pages.length;k++){host.innerHTML=eqpPageHTML(pages[k],k,pages.length);await Promise.all([...host.querySelectorAll('img')].map(im=>im.complete?0:new Promise(r=>{im.onload=im.onerror=r})));host.querySelectorAll('.eqp-cell').forEach(c=>eqPrintFit(c));if(msg)msg.textContent=`Creo il PDF… foglio ${k+1} di ${pages.length}`;
   plPdfSafeColors(host);const cv=await html2canvas(host.querySelector('.eqp-page'),{scale:3,useCORS:true,backgroundColor:'#ffffff',logging:false});if(k)pdf.addPage();pdf.addImage(cv.toDataURL('image/jpeg',.9),'JPEG',0,0,210,297,undefined,'FAST')}
  await plPdfSave(pdf.output('blob'),'Mini card equipaggiamento.pdf',msg)}
 catch(e){if(msg)msg.textContent='Non sono riuscito a creare il PDF: usa «Stampa» e scegli «Salva come PDF».'}finally{host.remove()}}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-eqp]');if(!b)return;e.preventDefault();e.stopPropagation();const a=b.dataset.eqp,id=b.dataset.id;
 if(a==='open'){EQP.open=true;if(id)eqpAdd(id)}else if(a==='close')EQP.open=false;else if(a==='add'){eqpAdd(id);EQP.q=''}
 else if(a==='more')eqpAdd(id);else if(a==='less'){const x=EQP.sel.find(s=>s.id===id);if(x&&--x.n<1)EQP.sel=EQP.sel.filter(s=>s!==x);eqpSave()}
 else if(a==='clear'){EQP.sel=[];eqpSave()}else if(a==='char'){const c=PL.chars.find(x=>x.id===id);if(c)eqpFromChar(c)}else if(a==='party')PL.chars.filter(c=>c.className).forEach(eqpFromChar);
 else if(a==='add-only'){eqpAdd(id);if(typeof toast==='function')toast(eqItem(id)?.name+' aggiunta alla stampa');b.textContent='✓ Aggiunta alla stampa';return}
 else if(a==='tier'){eqpTier(+b.dataset.t).forEach(e=>{if(!EQP.sel.some(x=>x.id===e.id))eqpAdd(e.id)})}
 else if(a==='kind-all'){EQ_CATALOG.filter(e=>e.kind===b.dataset.k&&!e.brawler).forEach(e=>{if(!EQP.sel.some(x=>x.id===e.id))eqpAdd(e.id)})}
 else if(a==='pdf'){eqpPdf();return}
 else if(a==='print'){const pages=eqpPages();plPrintPages(pages.map((p,k)=>eqpPageHTML(p,k,pages.length)).join(''),el=>el.querySelectorAll('.eqp-cell').forEach(c=>eqPrintFit(c)));return}
 eqpRender()},true);
document.addEventListener('change',e=>{const k=e.target.dataset?.eqpKind;if(k){EQP.kinds=e.target.checked?[...new Set([...EQP.kinds,k])]:EQP.kinds.filter(x=>x!==k);eqpRender()}else if(e.target.matches?.('[data-eqp-camp]')){EQP.camp=e.target.checked;eqpRender()}});
document.addEventListener('input',e=>{if(!e.target.matches?.('[data-eqp-q]'))return;EQP.q=e.target.value;eqpRender()});
addEventListener('resize',()=>{if(EQP.open)eqpScale()});
