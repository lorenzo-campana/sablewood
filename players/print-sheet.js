/* Scheda cartacea A4: solo ciò che non cambia al tavolo. Niente soglie né punteggi che dipendono dall'armatura,
   niente carte dominio né inventory weapon (sono carte stampate tenute accanto al foglio): per armi e armatura
   equipaggiate restano i posti delle mini card 41×63 mm. Anteprima a schermo, poi PDF con html2canvas + jsPDF. */
function plPrintBoxes(n,cls='pr-box'){return `<span class="pr-boxes">${Array.from({length:n},()=>`<i class="${cls}"></i>`).join('')}</span>`}
// come sul manuale: in grassetto il costo con cui si apre una feature (Mark a Stress, Spend 3 Hope…)
function plPrintBold(t){return esc(t).replace(/^((?:Mark|Spend|Clear) (?:a|an|one|two|\d+) (?:Stress|Hope|Hit Points?|Armor Slots?))/,'<strong>$1</strong>')}
// cornice a doppia linea con angoli smussati del riquadro Class Feature, disegnata sulle misure reali del pannello
function plPrintFrame(panel){if(!panel)return;panel.querySelector(':scope>.pr-frame')?.remove();const w=panel.offsetWidth,h=panel.offsetHeight,mm=panel.closest('.pr-page').offsetWidth/210,c=3.2*mm,g=1.1*mm,right=!!panel.closest('.pr-right');
 // il lato aperto va verso il bordo del foglio: per la colonna destra a destra, per quella sinistra a sinistra
 const path=(o)=>{const x0=right?o:-1,x1=right?w+1:w-o,t=o,b=h-o;return right?`M${x1} ${t}H${x0+c}L${x0} ${t+c}V${b-c}L${x0+c} ${b}H${x1}`:`M${x0} ${t}H${x1-c}L${x1} ${t+c}V${b-c}L${x1-c} ${b}H${x0}`};
 panel.insertAdjacentHTML('afterbegin',`<svg class="pr-frame" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${path(.5)}" fill="none" stroke="#5f5e63" stroke-width="${.35*mm}"/><path d="${path(g)}" fill="none" stroke="#5f5e63" stroke-width="${.3*mm}"/></svg>`)}
function plPrintSlots(n){return `<span class="pr-slots12">${Array.from({length:12},(_,i)=>`<i class="${i<n?'':'x'}"></i>`).join('')}</span>`}
function plPrintSheet(c){const k=plClass(c),st=plStats(c),cls=[[c.className,k?.features]];if(c.multiclass)cls.push([c.multiclass.className,PLAYER_RULES.classes[c.multiclass.className]?.features]);
 const accent=CDOM[k.domains[0]]?.c||'#6e57a5',hopeT=String(k.hope||''),hi=hopeT.indexOf(':');
 const feats=cls.flatMap(([n,t])=>plFxParts(t).map(f=>({...f,cls:n})));
 const featHTML=feats.map(f=>`<div class="pr-feat"><b>${esc(f.name)}${cls.length>1?` <small>${esc(f.cls)}</small>`:''}</b>${f.items.map(x=>x.li!==undefined?`<p class="li">• ${plPrintBold(x.li)}</p>`:`<p>${plPrintBold(x.p)}</p>`).join('')}</div>`).join('');
 const panel=(title,body,cls='')=>`<section class="pr-panel ${cls}"><h2><span>${title}</span></h2>${body}</section>`;
 const lines=n=>Array.from({length:n},()=>'<div class="pr-line"></div>').join('');
 const xp=Array.from({length:5},(_,i)=>{const e=c.experiences[i];return `<div class="pr-xp"><span>${e?esc(e.name):''}</span><b>${e&&e.name?sgn(e.value):''}</b></div>`}).join('');
 const slot=(label)=>`<div class="pr-slot"><b>${label}</b><small>mini card 41×63</small></div>`;
 return `<div class="pr-page" style="--pa:${accent}">
 <header class="pr-head"><div class="pr-class"><div class="pr-class-row"><h1>${esc(c.className)}</h1><div class="pr-doms">${k.domains.map(i=>`<img src="${cdomimg(i)}" alt="">`).join('')}</div></div><p>${k.domains.map(i=>esc(CDOM[i].k)).join(' & ')}</p></div>
  <div class="pr-id"><div><small>Name</small><b>${esc(c.name||'')}</b></div><div><small>Pronouns</small><b>${esc(c.pronouns||'')}</b></div><div><small>Heritage</small><b>${esc(plCard(c.ancestry)?.n||'')}${c.mixed!==''&&c.mixed!=null?' / '+esc(plCard(c.mixed)?.n||''):''} · ${esc(plCard(c.community)?.n||'')}</b></div><div><small>Subclass</small><b>${esc(c.subclass||'')}${c.multiclass?' · '+esc(c.multiclass.className)+' '+esc(c.multiclass.subclass):''}</b></div></div>
  <div class="pr-level"><b>${c.level}</b><small>Level</small></div></header>
 <section class="pr-top"><div class="pr-def"><div class="pr-shield ev"><small>Evasion</small><em>Start at ${k.evasion+(c.evasionBonus||0)}</em></div><i class="pr-def-div"></i><div class="pr-shield ar"><small>Armor</small></div><div class="pr-armslots">${Array.from({length:12},()=>'<i></i>').join('')}</div></div>
  <div class="pr-traits">${PL_TRAITS.map((n,i)=>`<div class="pr-trait"><div class="pr-flag"><small>${n}</small><b>${sgn(c.traits[i])}</b></div><em>${PL_VERBS[i].split(' · ').join('<br>')}</em></div>`).join('')}</div></section>
 <div class="pr-cols"><div class="pr-col pr-left">
  ${panel('Damage & Health',`<p class="pr-inst">Add your current level to your damage thresholds.</p><div class="pr-thr"><div><span>Minor<br>Damage</span><em>Mark 1 HP</em></div><i></i><div><span>Major<br>Damage</span><em>Mark 2 HP</em></div><i></i><div><span>Severe<br>Damage</span><em>Mark 3 HP</em></div></div><div class="pr-track"><b>HP</b>${plPrintSlots(st.hp)}</div><div class="pr-track"><b>Stress</b>${plPrintSlots(st.stress)}</div>`)}
  ${panel('Hope',`<p class="pr-inst">Spend a Hope to use an experience or help an ally.</p><div class="pr-hopebar">${Array.from({length:st.hope},()=>'<i></i>').join('<b></b>')}</div><p class="pr-hope"><b>${esc(hi>0?hopeT.slice(0,hi):'Hope Feature')}:</b> ${esc((hi>0?hopeT.slice(hi+1):hopeT).replace(/\s*\n\s*/g,' ').trim()).replace(/^(Spend \d+ Hope)/,'<strong>$1</strong>')}</p>`)}
  ${panel('Experience',xp)}
  ${panel('Gold',`<div class="pr-goldrow"><div class="pr-hand"><span>${Array.from({length:9},()=>'<i></i>').join('')}</span><small>Handfuls</small></div><div class="pr-bags"><span>${Array.from({length:9},()=>'<i></i>').join('')}</span><small>Bags</small></div><div class="pr-chest"><i></i><small>Chest</small></div></div>`)}
  ${panel('Notes',lines(4),'pr-notes')}</div>
  <div class="pr-col pr-right">
  ${panel('Active Weapons & Armor',`<div class="pr-prof"><b>Proficiency</b>${Array.from({length:6},(_,i)=>`<i class="${i<c.proficiency?'on':''}"></i>`).join('')}</div><div class="pr-slots">${slot('Primary')}${slot('Secondary')}${slot('Armor')}</div>`)}
  ${panel('Inventory',`<div class="pr-armrow"><div class="pr-slot pr-stack"><b>Inventory</b><small>inventory weapon<br>e carte oggetto<br>impilate qui</small></div><div class="pr-inv"><small>Oggetti senza carta</small>${lines(6)}</div></div>`)}
  ${panel('Class Feature',`<div class="pr-feats-in">${featHTML}</div>`,'pr-feats')}</div></div>
 <footer class="pr-foot"><span>Daggerheart © Darrington Press 2025 · scheda adattata</span><span>${esc(c.name||'')} · ${esc(c.className)} ${c.level}</span></footer></div>`}
// il testo delle feature si rimpicciolisce finché la pagina sta in un A4
function plPrintFit(root){const page=root.querySelector('.pr-page'),f=root.querySelector('.pr-feats-in');if(!page||!f)return;let pt=9;f.style.fontSize=pt+'pt';while((f.scrollHeight>f.clientHeight+1||page.scrollHeight>page.clientHeight+1)&&pt>5.4){pt-=.2;f.style.fontSize=pt+'pt'}plPrintFrame(f.closest('.pr-panel'))}
function plPrintOpen(c){let el=document.getElementById('pl-print');if(!el){el=document.createElement('div');el.id='pl-print';el.className='pl-print-ov';document.body.appendChild(el)}
 el.innerHTML=`<div class="pl-print-bar"><b>Anteprima di stampa · A4</b><span class="pl-print-msg" role="status"></span><button type="button" class="btn pri" data-pl="print-pdf">Scarica PDF</button><button type="button" class="btn" data-pl="print-close">Chiudi</button></div><div class="pl-print-stage"><div class="pl-print-scale">${plPrintSheet(c)}</div></div>`;
 el.hidden=false;document.body.classList.add('pl-print-on');(document.fonts?.ready||Promise.resolve()).then(()=>{plPrintFit(el);plPrintScale()})}
function plPrintScale(){const el=document.getElementById('pl-print'),st=el?.querySelector('.pl-print-stage'),sc=el?.querySelector('.pl-print-scale'),pg=sc?.querySelector('.pr-page');if(!pg)return;sc.style.transform='none';const k=Math.min((st.clientWidth-32)/pg.offsetWidth,1.6);sc.style.transform=`scale(${k})`;sc.style.height=pg.offsetHeight*k+'px';sc.style.width=pg.offsetWidth*k+'px'}
function plPrintClose(){const el=document.getElementById('pl-print');if(el){el.innerHTML='';el.hidden=true}document.body.classList.remove('pl-print-on')}
async function plPrintPdf(c){const el=document.getElementById('pl-print'),msg=el?.querySelector('.pl-print-msg');if(msg)msg.textContent='Creo il PDF…';
 const host=document.createElement('div');host.className='pl-print-capture';host.innerHTML=plPrintSheet(c);document.body.appendChild(host);
 try{await Promise.all([loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')]);await (document.fonts?.ready||Promise.resolve());plPrintFit(host);
  const cv=await html2canvas(host.querySelector('.pr-page'),{scale:3,backgroundColor:'#ffffff',logging:false}),pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4',compress:true});
  pdf.addImage(cv.toDataURL('image/jpeg',.92),'JPEG',0,0,210,297,undefined,'FAST');const blob=pdf.output('blob'),name=(c.name||'personaggio').replace(/[\\/:*?"<>|]/g,'-')+' - scheda.pdf';
  const dl=window.claude?.use?await window.claude.use('downloads').catch(()=>null):null;
  if(dl){try{await dl.save({filename:name,data:blob})}catch(e){if(e?.code!=='declined')throw e}}
  else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}
  if(msg)msg.textContent='PDF pronto.'}
 catch(e){if(msg)msg.textContent='Non sono riuscito a creare il PDF: riprova.'}
 finally{host.remove()}}
