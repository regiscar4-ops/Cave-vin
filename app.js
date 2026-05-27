// ═══════════════════════════════════════
// MA CAVE À VIN — App principale
// Architecture B — Supabase + Claude
// ═══════════════════════════════════════
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm'

const SUPA_URL = 'https://oqmfdhngzfdpcrlrwtob.supabase.co'
const SUPA_KEY = 'sb_publishable_HBqxiga3cvRaagqEVLaj0g_oI0mYfcSjJN6'
export const sb = createClient(SUPA_URL, SUPA_KEY)

// ── STATE ──
export let currentUser = null
export let bottles = []
export let courses = []
export let prefs = {}
export let colorFilter = 'tous'
export let selColAdd = 'rouge'
export let selColScan = 'rouge'
export let selColCfc = 'rouge'
export let pendingDel = null
export let pendingQtyId = null
export let pinBuffer = ''
export let pinAttempts = 0
export let pinBlockedUntil = null
export let scanImgData = null
export let courseTab = 'active'
export let obStep = 0

export function setState(key, val) {
  const map = {
    currentUser: v => currentUser = v,
    bottles: v => bottles = v,
    courses: v => courses = v,
    prefs: v => prefs = v,
    colorFilter: v => colorFilter = v,
    selColAdd: v => selColAdd = v,
    selColScan: v => selColScan = v,
    selColCfc: v => selColCfc = v,
    pendingDel: v => pendingDel = v,
    pendingQtyId: v => pendingQtyId = v,
    pinBuffer: v => pinBuffer = v,
    pinAttempts: v => pinAttempts = v,
    pinBlockedUntil: v => pinBlockedUntil = v,
    scanImgData: v => scanImgData = v,
    courseTab: v => courseTab = v,
    obStep: v => obStep = v,
  }
  if (map[key]) map[key](val)
}

// ── CONSTANTS ──
export const icons = { rouge:'ti-droplet', blanc:'ti-sun', rosé:'ti-heart', bulle:'ti-glass-champagne' }
export const colorClass = { rouge:'c-rouge', blanc:'c-blanc', rosé:'c-rosé', bulle:'c-bulle' }

// ── UTILS ──
export function toast(msg, type='') {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.className = 'toast show' + (type ? ' '+type : '')
  clearTimeout(t._tid)
  t._tid = setTimeout(() => t.classList.remove('show'), 2400)
}

export function hashPin(pin) {
  let h = 0
  for (let c of pin) { h = ((h<<5)-h)+c.charCodeAt(0); h|=0 }
  return h.toString(36)
}

export function getApogeeStatus(debut, fin) {
  const now = new Date().getFullYear()
  if (!debut || !fin) return 'unknown'
  if (now < parseInt(debut)) return 'wait'
  if (now > parseInt(fin)) return 'past'
  if (parseInt(fin) - now <= 1) return 'urgent'
  if (parseInt(fin) - now <= 2) return 'soon'
  return 'now'
}

export function statusInfo(s) {
  return ({
    urgent:{label:'⚠️ À boire maintenant',cls:'badge-urgent',bar:'bar-urgent'},
    soon:{label:'🟠 À boire bientôt',cls:'badge-soon',bar:'bar-soon'},
    now:{label:'🟢 En apogée',cls:'badge-now',bar:'bar-now'},
    wait:{label:'🔵 À garder',cls:'badge-wait',bar:'bar-wait'},
    past:{label:'⚫ Passé apogée',cls:'badge-past',bar:'bar-past'},
    unknown:{label:'',cls:'',bar:'bar-wait'}
  })[s] || {label:'',cls:'',bar:''}
}

// ── AUTH ──
export function switchAuthTab(tab) {
  document.getElementById('auth-login-form').style.display = tab==='login'?'':'none'
  document.getElementById('auth-signup-form').style.display = tab==='signup'?'':'none'
  document.getElementById('auth-forgot-form').style.display = 'none'
  document.getElementById('tab-login').classList.toggle('active', tab==='login')
  document.getElementById('tab-signup').classList.toggle('active', tab==='signup')
  clearAuthMsg()
}

export function showForgot() {
  document.getElementById('auth-login-form').style.display='none'
  document.getElementById('auth-signup-form').style.display='none'
  document.getElementById('auth-forgot-form').style.display=''
  clearAuthMsg()
}

function showAuthError(msg) {
  const el=document.getElementById('auth-error'); el.textContent=msg; el.classList.add('show')
  document.getElementById('auth-success').classList.remove('show')
}
function showAuthSuccess(msg) {
  const el=document.getElementById('auth-success'); el.textContent=msg; el.classList.add('show')
  document.getElementById('auth-error').classList.remove('show')
}
function clearAuthMsg() {
  document.getElementById('auth-error').classList.remove('show')
  document.getElementById('auth-success').classList.remove('show')
}

export async function doLogin() {
  const email=document.getElementById('login-email').value.trim()
  const pwd=document.getElementById('login-pwd').value
  if(!email||!pwd){showAuthError('Remplissez tous les champs');return}
  try {
    const{error}=await sb.auth.signInWithPassword({email,password:pwd})
    if(error)throw error
  } catch {showAuthError('Email ou mot de passe incorrect')}
}

export async function doSignup() {
  const email=document.getElementById('signup-email').value.trim()
  const pwd=document.getElementById('signup-pwd').value
  const pwd2=document.getElementById('signup-pwd2').value
  if(!email||!pwd){showAuthError('Remplissez tous les champs');return}
  if(pwd.length<8){showAuthError('Mot de passe trop court (8 caractères min.)');return}
  if(pwd!==pwd2){showAuthError('Les mots de passe ne correspondent pas');return}
  try {
    const{error}=await sb.auth.signUp({email,password:pwd})
    if(error)throw error
    showAuthSuccess('Compte créé ! Vérifiez votre email pour confirmer.')
  } catch(e){showAuthError(e.message.includes('already')?'Email déjà utilisé':'Erreur lors de la création')}
}

export async function doForgot() {
  const email=document.getElementById('forgot-email').value.trim()
  if(!email){showAuthError('Entrez votre email');return}
  await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin})
  showAuthSuccess('Email de réinitialisation envoyé !')
}

export async function doLogout() { await sb.auth.signOut() }

// ── SCREENS ──
export function showAuth() {
  document.getElementById('auth-screen').classList.add('show')
  document.getElementById('app').classList.remove('show')
  document.getElementById('onboarding').classList.remove('show')
  document.getElementById('pin-screen').classList.remove('show')
}

export function showApp() {
  document.getElementById('auth-screen').classList.remove('show')
  const pinHash=localStorage.getItem('cave_pin')
  if(pinHash){
    document.getElementById('pin-screen').classList.add('show')
    document.getElementById('pin-setup-link').style.display='none'
    setState('pinBuffer',''); updatePinDots('')
  } else { launchApp() }
}

export async function launchApp() {
  document.getElementById('pin-screen').classList.remove('show')
  if(!prefs.onboarding_done) { showOnboardingScreen() }
  else { document.getElementById('app').classList.add('show') }
}

export function showOnboardingScreen() {
  document.getElementById('onboarding').classList.add('show')
  document.getElementById('app').classList.remove('show')
  setState('obStep',0); renderObStep()
}

export function renderObStep() {
  const slides=document.getElementById('ob-slides')
  slides.style.transform=`translateX(-${obStep*100}%)`
  document.getElementById('ob-step-lbl').textContent=`${obStep+1} / 3`
  document.getElementById('ob-next-btn').textContent=obStep===2?"C'est parti !":'Suivant'
  for(let i=0;i<3;i++) document.getElementById(`ob-dot-${i}`).classList.toggle('active',i===obStep)
}

export async function obNext() {
  if(obStep<2){setState('obStep',obStep+1);renderObStep()}
  else await finishOnboarding()
}

export async function finishOnboarding() {
  document.getElementById('onboarding').classList.remove('show')
  document.getElementById('app').classList.add('show')
  if(currentUser){
    await sb.from('preferences').upsert({user_id:currentUser.id,onboarding_done:true})
    setState('prefs',{...prefs,onboarding_done:true})
  }
}

// ── LOAD DATA ──
export async function loadUserData() {
  const[bRes,cRes,pRes]=await Promise.all([
    sb.from('bouteilles').select('*').order('created_at',{ascending:false}),
    sb.from('courses').select('*').order('created_at',{ascending:false}),
    sb.from('preferences').select('*').eq('user_id',currentUser.id).single()
  ])
  setState('bottles',bRes.data||[])
  setState('courses',cRes.data||[])
  setState('prefs',pRes.data||{})
  document.getElementById('user-email-lbl').textContent=currentUser.email
  loadPrefsUI()
  updateStats()
  renderBottles()
  renderCourses()
  updatePinStatus()

  sb.channel('db-changes')
    .on('postgres_changes',{event:'*',schema:'public',table:'bouteilles'},async()=>{
      const{data}=await sb.from('bouteilles').select('*').order('created_at',{ascending:false})
      setState('bottles',data||[]); updateStats(); renderBottles()
    })
    .on('postgres_changes',{event:'*',schema:'public',table:'courses'},async()=>{
      const{data}=await sb.from('courses').select('*').order('created_at',{ascending:false})
      setState('courses',data||[]); renderCourses()
    })
    .subscribe()
}

// ── STATS ──
export function updateStats() {
  const total=bottles.reduce((s,b)=>s+(parseInt(b.quantite)||1),0)
  const val=bottles.reduce((s,b)=>s+((parseInt(b.quantite)||1)*(parseFloat(b.prix_achat)||0)),0)
  document.getElementById('s-btl').textContent=total
  document.getElementById('s-ref').textContent=bottles.length
  document.getElementById('s-val').textContent=Math.round(val)+'€'
}

// ── NAV ──
export function showSection(n,btn) {
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'))
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'))
  document.getElementById('sec-'+n).classList.add('active')
  if(btn)btn.classList.add('active')
  if(n==='dashboard')buildDashboard()
}

// ── BOTTLES ──
export function renderBottles() {
  const q=(document.getElementById('search-input').value||'').toLowerCase()
  const list=bottles.filter(b=>{
    if(colorFilter==='bio')return b.profil_sante?.bio===true
    if(colorFilter!=='tous'&&b.couleur!==colorFilter)return false
    if(q&&!b.nom?.toLowerCase().includes(q)&&!(b.region||'').toLowerCase().includes(q)&&!(b.domaine||'').toLowerCase().includes(q))return false
    return true
  })
  const el=document.getElementById('bottle-list')
  if(!list.length){
    el.innerHTML='<div class="empty-state"><i class="ti ti-building-arch"></i><p>Aucune bouteille.<br>Appuyez sur + pour commencer !</p></div>'
    return
  }
  const now=new Date().getFullYear()
  el.innerHTML=list.map(b=>{
    const status=getApogeeStatus(b.apogee_debut,b.apogee_fin)
    const si=statusInfo(status)
    let apogee=''
    if(b.apogee_debut&&b.apogee_fin){
      const s=parseInt(b.apogee_debut),e=parseInt(b.apogee_fin)
      const pct=Math.min(100,Math.max(0,Math.round(((now-s)/(e-s))*100)))
      apogee=`<div class="apogee-bar">
        <div class="apogee-label">${b.apogee_debut}–${b.apogee_fin}</div>
        <div class="bar-track"><div class="bar-fill ${si.bar}" style="width:${pct}%"></div></div>
        ${si.label?`<div class="apogee-badge ${si.cls}">${si.label}</div>`:''}
      </div>`
    }
    const bioTag=b.profil_sante?.bio?'<span style="font-size:10px;margin-left:4px">🌿</span>':''
    return `<div class="bottle-card">
      <div class="bico ${colorClass[b.couleur]||'c-rouge'}"><i class="ti ${icons[b.couleur]||'ti-droplet'}"></i></div>
      <div class="bottle-info">
        <div class="bottle-name">${b.nom}${bioTag}</div>
        <div class="bottle-meta">${b.region||''}${b.millesime?' · '+b.millesime:''}${b.note?' · '+b.note+'/20':''}</div>
        ${apogee}
        ${b.commentaire?`<div style="font-size:11px;color:var(--text3);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.commentaire}</div>`:''}
      </div>
      <div class="bottle-actions">
        <div class="qty-row">
          <button class="qty-btn" onclick="window.changeQty('${b.id}',-1)" aria-label="Diminuer">−</button>
          <span class="qty-num">${b.quantite||1}</span>
          <button class="qty-btn" onclick="window.changeQty('${b.id}',1)" aria-label="Augmenter">+</button>
        </div>
        <div class="action-row">
          <button class="btn-icon" onclick="window.openEdit('${b.id}')" aria-label="Modifier"><i class="ti ti-edit"></i></button>
          <button class="btn-icon del" onclick="window.askDelete('${b.id}')" aria-label="Supprimer"><i class="ti ti-trash"></i></button>
        </div>
        ${b.prix_achat?`<div style="font-size:11px;color:var(--text3)">${b.prix_achat}€</div>`:''}
      </div>
    </div>`
  }).join('')
}

export function setFilter(c,el) {
  setState('colorFilter',c)
  document.querySelectorAll('.filter-row .chip').forEach(x=>x.classList.remove('active'))
  el.classList.add('active')
  renderBottles()
}

export function selCol(el,c) {
  setState('selColAdd',c)
  document.querySelectorAll('#ov-add .copt').forEach(o=>o.classList.remove('sel'))
  el.classList.add('sel')
}

export async function changeQty(id,delta) {
  const b=bottles.find(x=>x.id===id); if(!b)return
  const newQty=Math.max(0,(parseInt(b.quantite)||1)+delta)
  if(newQty===0){
    setState('pendingQtyId',id)
    document.getElementById('ov-motif').classList.add('open')
  } else {
    await sb.from('bouteilles').update({quantite:newQty}).eq('id',id)
    toast(delta>0?'Quantité augmentée':'Quantité diminuée')
  }
}

export async function confirmMotif(motif) {
  document.getElementById('ov-motif').classList.remove('open')
  if(!pendingQtyId)return
  const b=bottles.find(x=>x.id===pendingQtyId); if(!b)return
  await sb.from('historique').insert({user_id:currentUser.id,bouteille_id:b.id,bouteille_nom:b.nom,motif,quantite:1})
  await sb.from('bouteilles').update({quantite:0}).eq('id',b.id)
  setState('pendingQtyId',null)
  toast('Sortie enregistrée dans l\'historique')
}

export function openAdd() {
  document.getElementById('edit-id').value=''
  document.getElementById('modal-title').innerHTML='<i class="ti ti-plus"></i>Ajouter une bouteille'
  ;['f-nom','f-dom','f-mil','f-reg','f-prix','f-note','f-ad','f-af','f-comment'].forEach(id=>document.getElementById(id).value='')
  document.getElementById('f-qty').value=1
  setState('selColAdd','rouge')
  document.querySelectorAll('#ov-add .copt').forEach((o,i)=>o.classList.toggle('sel',i===0))
  document.getElementById('ov-add').classList.add('open')
}

export function openEdit(id) {
  const b=bottles.find(x=>x.id===id); if(!b)return
  document.getElementById('edit-id').value=b.id
  document.getElementById('modal-title').innerHTML='<i class="ti ti-edit"></i>Modifier'
  document.getElementById('f-nom').value=b.nom||''
  document.getElementById('f-dom').value=b.domaine||''
  document.getElementById('f-mil').value=b.millesime||''
  document.getElementById('f-qty').value=b.quantite||1
  document.getElementById('f-reg').value=b.region||''
  document.getElementById('f-prix').value=b.prix_achat||''
  document.getElementById('f-note').value=b.note||''
  document.getElementById('f-ad').value=b.apogee_debut||''
  document.getElementById('f-af').value=b.apogee_fin||''
  document.getElementById('f-comment').value=b.commentaire||''
  setState('selColAdd',b.couleur||'rouge')
  document.querySelectorAll('#ov-add .copt').forEach(o=>{
    const t=o.textContent.toLowerCase().trim()
    o.classList.toggle('sel',t===selColAdd||(selColAdd==='bulle'&&t==='bulles')||(selColAdd==='rosé'&&t==='rosé'))
  })
  document.getElementById('ov-add').classList.add('open')
}

export function closeAdd() { document.getElementById('ov-add').classList.remove('open') }

export async function saveBottle() {
  const nom=document.getElementById('f-nom').value.trim()
  if(!nom){toast('Le nom est requis','error');return}
  const ad=parseInt(document.getElementById('f-ad').value)||null
  const af=parseInt(document.getElementById('f-af').value)||null
  if(ad&&af&&ad>=af){toast('L\'apogée début doit être antérieur à la fin','error');return}
  const data={nom,couleur:selColAdd||'rouge',domaine:document.getElementById('f-dom').value.trim()||null,
    millesime:parseInt(document.getElementById('f-mil').value)||null,
    quantite:parseInt(document.getElementById('f-qty').value)||1,
    region:document.getElementById('f-reg').value.trim()||null,
    prix_achat:parseFloat(document.getElementById('f-prix').value)||null,
    note:parseInt(document.getElementById('f-note').value)||null,
    apogee_debut:ad,apogee_fin:af,
    commentaire:document.getElementById('f-comment').value.trim()||null}
  const id=document.getElementById('edit-id').value
  if(id){await sb.from('bouteilles').update(data).eq('id',id);toast('Bouteille modifiée !','success')}
  else{await sb.from('bouteilles').insert({...data,user_id:currentUser.id,source_ajout:'manuel'});toast('Bouteille ajoutée !','success')}
  closeAdd()
}

export function askDelete(id) {
  setState('pendingDel',id)
  const b=bottles.find(x=>x.id===id)
  document.getElementById('confirm-msg').textContent=`Supprimer "${b?.nom}" ? Action irréversible.`
  document.getElementById('ov-confirm').classList.add('open')
}

export async function confirmDelete() {
  if(!pendingDel)return
  await sb.from('bouteilles').delete().eq('id',pendingDel)
  setState('pendingDel',null)
  document.getElementById('ov-confirm').classList.remove('open')
  toast('Bouteille supprimée')
}

// ── COURSES ──
export function switchCourseTab(tab,el) {
  setState('courseTab',tab)
  document.querySelectorAll('.ctab').forEach(b=>b.classList.remove('active'))
  el.classList.add('active')
  renderCourses()
}

export function renderCourses() {
  const filtered=courses.filter(c=>courseTab==='active'?c.statut==='a_acheter':c.statut==='archive')
  const el=document.getElementById('courses-list')
  if(!filtered.length){
    el.innerHTML=`<div class="empty-state"><i class="ti ti-shopping-cart"></i><p>${courseTab==='active'?'Liste vide !<br>Ajoutez vos souhaits.':'Aucun achat archivé.'}</p></div>`
    return
  }
  el.innerHTML=filtered.map(c=>`
    <div class="course-item">
      <div class="ccheck ${c.statut==='archive'?'done':''}" onclick="window.toggleCourse('${c.id}')" aria-label="Marquer acheté">
        ${c.statut==='archive'?'<i class="ti ti-check" style="font-size:12px;color:white"></i>':''}
      </div>
      <div class="course-info">
        <div class="course-name" style="${c.statut==='archive'?'text-decoration:line-through;color:var(--text3)':''}">${c.nom}</div>
        <div class="course-detail">${c.quantite||1} btl${c.ou_acheter?' · '+c.ou_acheter:''}${c.date_achat?' · '+new Date(c.date_achat).toLocaleDateString('fr-FR'):''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <div class="course-price">${c.prix_max?'max '+c.prix_max+'€':''}</div>
        <button class="btn-icon del" onclick="window.deleteCourse('${c.id}')" aria-label="Supprimer"><i class="ti ti-trash"></i></button>
      </div>
    </div>`).join('')
}

export function openCourses() { document.getElementById('ov-courses').classList.add('open') }

export async function saveCourse() {
  const nom=document.getElementById('c-nom').value.trim()
  if(!nom){toast('Le nom est requis','error');return}
  await sb.from('courses').insert({user_id:currentUser.id,nom,
    prix_max:parseFloat(document.getElementById('c-prix').value)||null,
    quantite:parseInt(document.getElementById('c-qty').value)||1,
    ou_acheter:document.getElementById('c-ou').value.trim()||null,
    statut:'a_acheter'})
  ;['c-nom','c-prix','c-qty','c-ou'].forEach(id=>document.getElementById(id).value='')
  document.getElementById('ov-courses').classList.remove('open')
  toast('Ajouté à la liste !','success')
}

export function toggleCourse(id) {
  const c=courses.find(x=>x.id===id); if(!c)return
  if(c.statut==='a_acheter'){
    document.getElementById('cfc-course-id').value=id
    document.getElementById('cfc-nom').value=c.nom
    document.getElementById('cfc-qty').value=c.quantite||1
    document.getElementById('cfc-prix').value=c.prix_max||''
    document.getElementById('cfc-mil').value=''
    document.getElementById('cfc-reg').value=''
    setState('selColCfc','rouge')
    document.querySelectorAll('#ov-cave-from-course .copt').forEach((o,i)=>o.classList.toggle('sel',i===0))
    document.getElementById('ov-cave-from-course').classList.add('open')
  }
}

export function selCfcCol(el,c) {
  setState('selColCfc',c)
  document.querySelectorAll('#ov-cave-from-course .copt').forEach(o=>o.classList.remove('sel'))
  el.classList.add('sel')
}

export async function confirmCaveFromCourse() {
  const id=document.getElementById('cfc-course-id').value
  const nom=document.getElementById('cfc-nom').value.trim()
  if(!nom){toast('Le nom est requis','error');return}
  await sb.from('bouteilles').insert({user_id:currentUser.id,nom,couleur:selColCfc,
    millesime:parseInt(document.getElementById('cfc-mil').value)||null,
    quantite:parseInt(document.getElementById('cfc-qty').value)||1,
    region:document.getElementById('cfc-reg').value.trim()||null,
    prix_achat:parseFloat(document.getElementById('cfc-prix').value)||null,source_ajout:'import'})
  await sb.from('courses').update({statut:'archive',date_achat:new Date().toISOString()}).eq('id',id)
  document.getElementById('ov-cave-from-course').classList.remove('open')
  toast('Bouteille ajoutée à la cave !','success')
}

export async function deleteCourse(id) {
  await sb.from('courses').delete().eq('id',id)
  toast('Supprimé de la liste')
}

// ── PREFS ──
export function loadPrefsUI() {
  if(prefs.regions)document.getElementById('p-regions').value=prefs.regions
  if(prefs.style)document.getElementById('p-style').value=prefs.style
  if(prefs.budget_max)document.getElementById('p-budget').value=`${prefs.budget_min||0}-${prefs.budget_max}€`
  if(prefs.pref_bio)document.getElementById('p-bio').checked=true
  if(prefs.pref_sulfites)document.getElementById('p-sulfites').checked=true
}

export async function savePrefs() {
  const data={user_id:currentUser.id,regions:document.getElementById('p-regions').value,
    style:document.getElementById('p-style').value,
    pref_bio:document.getElementById('p-bio').checked,
    pref_sulfites:document.getElementById('p-sulfites').checked,
    updated_at:new Date().toISOString()}
  await sb.from('preferences').upsert(data)
  setState('prefs',{...prefs,...data})
  toast('Préférences enregistrées !','success')
}

// ── PIN ──
export function pinKey(k) {
  if(pinBlockedUntil&&Date.now()<pinBlockedUntil){
    const s=Math.ceil((pinBlockedUntil-Date.now())/1000)
    document.getElementById('pin-err').textContent=`Bloqué. Réessayez dans ${s}s`; return
  }
  if(k==='del'){setState('pinBuffer',pinBuffer.slice(0,-1));updatePinDots('');document.getElementById('pin-err').textContent='';return}
  if(pinBuffer.length>=4)return
  setState('pinBuffer',pinBuffer+k)
  updatePinDots('')
  if(pinBuffer.length===4){
    setTimeout(()=>{
      const stored=localStorage.getItem('cave_pin')
      if(hashPin(pinBuffer)===stored){
        setState('pinAttempts',0);setState('pinBuffer','');updatePinDots('');launchApp()
      } else {
        setState('pinAttempts',pinAttempts+1)
        if(pinAttempts>=3){setState('pinBlockedUntil',Date.now()+30000);setState('pinAttempts',0);document.getElementById('pin-err').textContent='Trop de tentatives — bloqué 30 secondes'}
        else{document.getElementById('pin-err').textContent='Code incorrect'}
        updatePinDots('error')
        setTimeout(()=>{setState('pinBuffer','');updatePinDots('')},600)
      }
    },200)
  }
}

export function updatePinDots(mode) {
  for(let i=0;i<4;i++){
    const d=document.getElementById('pd'+i)
    d.className='pin-dot'+(pinBuffer.length>i?' filled':'')+(mode==='error'?' error':'')
  }
}

export function openPinSetup() {
  const has=!!localStorage.getItem('cave_pin')
  document.getElementById('pin-setup-title').textContent=has?'Modifier le PIN':'Créer un code PIN'
  document.getElementById('pin-new').value='';document.getElementById('pin-confirm').value=''
  document.getElementById('pin-setup-error').textContent=''
  document.getElementById('pin-remove-btn').style.display=has?'block':'none'
  document.getElementById('ov-pin-setup').classList.add('open')
}

export function savePinSetup() {
  const np=document.getElementById('pin-new').value
  const cp=document.getElementById('pin-confirm').value
  if(!/^\d{4}$/.test(np)){document.getElementById('pin-setup-error').textContent='PIN doit contenir 4 chiffres';return}
  if(np!==cp){document.getElementById('pin-setup-error').textContent='Les codes ne correspondent pas';return}
  localStorage.setItem('cave_pin',hashPin(np))
  document.getElementById('ov-pin-setup').classList.remove('open')
  updatePinStatus();toast('PIN configuré !','success')
}

export function removePinSetup() {
  localStorage.removeItem('cave_pin')
  document.getElementById('ov-pin-setup').classList.remove('open')
  updatePinStatus();toast('PIN supprimé')
}

export function updatePinStatus() {
  const has=!!localStorage.getItem('cave_pin')
  document.getElementById('pin-status-lbl').textContent=has?'Configuré — actif':'Non configuré'
  document.getElementById('pin-action-btn').textContent=has?'Modifier':'Configurer'
}

// ── SCAN ──
export function handlePhoto(e) {
  const file=e.target.files[0]; if(!file)return
  const reader=new FileReader()
  reader.onload=ev=>{
    setState('scanImgData',ev.target.result)
    const b64=ev.target.result.split(',')[1]
    const mime=file.type||'image/jpeg'
    document.getElementById('scan-preview').innerHTML=`<img src="${ev.target.result}" style="width:100%;max-height:180px;object-fit:contain;border-radius:var(--radius);margin-bottom:.5rem">`
    document.getElementById('scan-main').style.display='none'
    document.getElementById('scan-loading').style.display='block'
    analyzeLabel(b64,mime)
  }
  reader.readAsDataURL(file)
  e.target.value=''
}

const scanMsgs=['Identification du vin...','Lecture du millésime...','Recherche appellation...','Détection cépage...']
let scanInterval

async function analyzeLabel(b64,mime) {
  let i=0; scanInterval=setInterval(()=>{document.getElementById('scan-sub').textContent=scanMsgs[i++%scanMsgs.length]},1200)
  try {
    const{data:{session}}=await sb.auth.getSession()
    const resp=await fetch('/api/claude',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${session?.access_token}`},
      body:JSON.stringify({messages:[{role:'user',content:[
        {type:'image',source:{type:'base64',media_type:mime,data:b64}},
        {type:'text',text:'Analyse cette étiquette. Réponds UNIQUEMENT en JSON sans markdown:\n{"nom":"string","domaine":"string|null","millesime":"number|null","region":"string|null","cepage":"string|null","couleur":"rouge|blanc|rosé|bulle","apogee_debut":"number|null","apogee_fin":"number|null","conf_nom":"haute|moyenne|basse","conf_millesime":"haute|moyenne|basse","conf_region":"haute|moyenne|basse"}'}
      ]}]})
    })
    clearInterval(scanInterval)
    const data=await resp.json()
    const txt=data.content.map(c=>c.text||'').join('').replace(/```json|```/g,'').trim()
    fillScanForm(JSON.parse(txt))
  } catch {
    clearInterval(scanInterval)
    toast('Erreur d\'analyse — vérifiez votre connexion','error')
    resetScan()
  }
}

export function fillScanForm(w) {
  document.getElementById('sc-nom').value=w.nom||''
  document.getElementById('sc-dom').value=w.domaine||''
  document.getElementById('sc-mil').value=w.millesime||''
  document.getElementById('sc-reg').value=w.region||''
  document.getElementById('sc-cep').value=w.cepage||''
  document.getElementById('sc-ad').value=w.apogee_debut||''
  document.getElementById('sc-af').value=w.apogee_fin||''
  document.getElementById('sc-qty').value=1
  if(scanImgData)document.getElementById('scan-thumb').src=scanImgData
  setState('selColScan',w.couleur||'rouge')
  document.querySelectorAll('[id^="sco-"]').forEach(o=>o.classList.remove('sel'))
  const t=document.getElementById('sco-'+selColScan); if(t)t.classList.add('sel')
  const cm={'haute':'conf-high','moyenne':'conf-med','basse':'conf-low'}
  const cl={'haute':'sûr','moyenne':'probable','basse':'à vérifier'}
  ;[['sc-cn',w.conf_nom],['sc-cm',w.conf_millesime],['sc-cr',w.conf_region]].forEach(([id,c])=>{
    const el=document.getElementById(id); if(el&&c){el.className='conf '+(cm[c]||'');el.textContent=cl[c]||c;el.style.display='inline'}
  })
  document.getElementById('scan-loading').style.display='none'
  document.getElementById('scan-result').style.display='block'
}

export function selScanCol(el,c) {
  setState('selColScan',c)
  document.querySelectorAll('[id^="sco-"]').forEach(o=>o.classList.remove('sel'))
  el.classList.add('sel')
}

export async function saveScan() {
  const nom=document.getElementById('sc-nom').value.trim()
  if(!nom){toast('Le nom est requis','error');return}
  const ad=parseInt(document.getElementById('sc-ad').value)||null
  const af=parseInt(document.getElementById('sc-af').value)||null
  if(ad&&af&&ad>=af){toast('Apogée début doit être antérieur à la fin','error');return}
  await sb.from('bouteilles').insert({user_id:currentUser.id,nom,
    domaine:document.getElementById('sc-dom').value.trim()||null,
    millesime:parseInt(document.getElementById('sc-mil').value)||null,
    quantite:parseInt(document.getElementById('sc-qty').value)||1,
    region:document.getElementById('sc-reg').value.trim()||null,
    cepage:document.getElementById('sc-cep').value.trim()||null,
    couleur:selColScan,
    prix_achat:parseFloat(document.getElementById('sc-prix').value)||null,
    note:parseInt(document.getElementById('sc-note').value)||null,
    apogee_debut:ad,apogee_fin:af,source_ajout:'scan'})
  toast('Bouteille ajoutée !','success')
  resetScan()
  showSection('cave',document.querySelector('.nav-btn'))
}

export function resetScan() {
  setState('scanImgData',null)
  document.getElementById('scan-main').style.display='block'
  document.getElementById('scan-loading').style.display='none'
  document.getElementById('scan-result').style.display='none'
  document.getElementById('scan-preview').innerHTML=''
}

// ── EXPORT/IMPORT ──
export async function exportJSON() {
  const[bRes,cRes,pRes,hRes]=await Promise.all([
    sb.from('bouteilles').select('*'),
    sb.from('courses').select('*'),
    sb.from('preferences').select('*').single(),
    sb.from('historique').select('*')
  ])
  const data={version:'2.0',exported_at:new Date().toISOString(),
    cave:bRes.data||[],courses:cRes.data||[],
    preferences:pRes.data||{},historique:hRes.data||[]}
  const a=document.createElement('a')
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}))
  a.download=`ma-cave-${new Date().toISOString().slice(0,10)}.json`
  a.click()
  toast('Export téléchargé !','success')
}

export async function importJSON(e) {
  const file=e.target.files[0]; if(!file)return
  let data
  try{data=JSON.parse(await file.text())}catch{toast('Fichier invalide','error');return}
  if(!data.cave||!Array.isArray(data.cave)){toast('Format invalide','error');return}
  if(!confirm(`Importer ${data.cave.length} bouteilles ? Fusion avec votre cave.`))return
  const toInsert=data.cave.map(({id,user_id,...b})=>({...b,user_id:currentUser.id,source_ajout:'import'}))
  await sb.from('bouteilles').insert(toInsert)
  toast(`Import réussi — ${data.cave.length} bouteilles !`,'success')
  e.target.value=''
}

// ── DASHBOARD ──
export function buildDashboard() {
  const el=document.getElementById('dashboard-body')
  if(!bottles.length){el.innerHTML='<div class="empty-state"><i class="ti ti-chart-bar"></i><p>Ajoutez des bouteilles<br>pour voir vos statistiques</p></div>';return}
  const now=new Date().getFullYear()
  const total=bottles.reduce((s,b)=>s+(parseInt(b.quantite)||1),0)
  const val=bottles.reduce((s,b)=>s+((parseInt(b.quantite)||1)*(parseFloat(b.prix_achat)||0)),0)
  const byCouleur={rouge:0,blanc:0,rosé:0,bulle:0}
  bottles.forEach(b=>{byCouleur[b.couleur||'rouge']=(byCouleur[b.couleur||'rouge']||0)+(parseInt(b.quantite)||1)})
  const byRegion={}
  bottles.forEach(b=>{if(b.region){const r=b.region.split(',')[0].trim();byRegion[r]=(byRegion[r]||0)+(parseInt(b.quantite)||1)}})
  const topR=Object.entries(byRegion).sort((a,b)=>b[1]-a[1]).slice(0,5)
  const maxR=topR[0]?.[1]||1
  const totalC=Object.values(byCouleur).reduce((s,v)=>s+v,0)||1
  const circ=2*Math.PI*28; let off=0
  const cColors={rouge:'#9B3A50',blanc:'#C4932A',rosé:'#D4537E',bulle:'#3B6D11'}
  const cLabels={rouge:'Rouge',blanc:'Blanc',rosé:'Rosé',bulle:'Bulles'}
  const segs=Object.entries(byCouleur).filter(([,v])=>v>0).map(([c,v])=>{const s={c,v,pct:(v/totalC)*100,off};off+=s.pct;return s})
  const donut=`<svg width="70" height="70" viewBox="0 0 70 70">
    <circle cx="35" cy="35" r="28" fill="none" stroke="var(--bg3)" stroke-width="12"/>
    ${segs.map(s=>`<circle cx="35" cy="35" r="28" fill="none" stroke="${cColors[s.c]}" stroke-width="12" stroke-dasharray="${(s.pct/100*circ).toFixed(1)} ${circ.toFixed(1)}" stroke-dashoffset="${(-(s.off/100*circ)+circ/4).toFixed(1)}"/>`).join('')}
    <text x="35" y="39" text-anchor="middle" font-size="13" font-weight="600" fill="var(--text)">${total}</text>
  </svg>`
  const apogeeItems=bottles.filter(b=>b.apogee_debut&&b.apogee_fin).map(b=>{
    const s=getApogeeStatus(b.apogee_debut,b.apogee_fin); return{...b,s,si:statusInfo(s)}
  }).sort((a,b)=>({urgent:0,soon:1,now:2,wait:3,past:4})[a.s]-({urgent:0,soon:1,now:2,wait:3,past:4})[b.s])
  el.innerHTML=`
    <div class="stats-grid">
      <div class="stat-dash"><div class="stat-dash-n">${total}</div><div class="stat-dash-l">bouteilles</div></div>
      <div class="stat-dash"><div class="stat-dash-n">${bottles.length}</div><div class="stat-dash-l">références</div></div>
      <div class="stat-dash"><div class="stat-dash-n">${Math.round(val)}€</div><div class="stat-dash-l">valeur</div></div>
      <div class="stat-dash"><div class="stat-dash-n">${total?Math.round(val/total):0}€</div><div class="stat-dash-l">prix moyen</div></div>
    </div>
    <div class="chart-row">
      <div class="chart-box"><div class="chart-title">Couleurs</div><div class="donut-wrap">${donut}<div class="donut-legend">${Object.entries(byCouleur).filter(([,v])=>v>0).map(([c,v])=>`<div class="legend-item"><div class="legend-dot" style="background:${cColors[c]}"></div>${cLabels[c]} (${v})</div>`).join('')}</div></div></div>
      <div class="chart-box"><div class="chart-title">Top régions</div>${topR.map(([r,v])=>`<div class="bar-item-h"><div class="bar-label-h">${r.length>6?r.slice(0,5)+'…':r}</div><div class="bar-track" style="flex:1"><div class="bar-fill bar-now" style="width:${Math.round(v/maxR*100)}%"></div></div><div class="bar-val-h">${v}</div></div>`).join('')||'<div style="font-size:12px;color:var(--text3)">Ajoutez des régions</div>'}</div>
    </div>
    ${apogeeItems.length?`<div class="section-title">À boire en priorité</div>
    <div style="background:var(--bg2);border-radius:var(--radius-lg);padding:.75rem 1rem;margin-bottom:1.25rem;border:1px solid var(--border)">
      ${apogeeItems.slice(0,6).map(b=>`<div class="priority-item"><span class="priority-name">${b.nom}${b.millesime?' '+b.millesime:''}</span><span class="apogee-badge ${b.si.cls}">${b.si.label}</span></div>`).join('')}
    </div>`:''}
    <button class="claude-btn" onclick="window.askClaude('manque')"><i class="ti ti-sparkles"></i>Analyse complète par Claude ↗</button>`
}

// ── CLAUDE ──
export function askClaude(type) {
  const cave=bottles.slice(0,8).map(b=>`${b.nom} ${b.millesime||''} (${b.couleur}, x${b.quantite||1})`).join(', ')
  const pt=prefs.regions?`Régions favorites: ${prefs.regions}. Budget: ${prefs.budget_min||0}-${prefs.budget_max||100}€. Style: ${prefs.style||'non défini'}. ${prefs.pref_bio?'Préfère bio.':''}`  :''
  const msgs={
    accord:`Cave: ${cave||'(vide)'}. ${pt} Quel vin pour mon repas ce soir ? Inclus température, carafe, verre. Priorité aux vins de ma cave.`,
    courses:`Cave: ${cave||'(vide)'}. ${pt} Propose 5 bouteilles à commander avec prix et où trouver à Marseille/PACA.`,
    suggest:`Cave: ${cave||'(vide)'}. ${pt} Propose 3 vins à découvrir hors de mes habitudes avec profil santé et où trouver à Marseille.`,
    actus:`Actus vins du moment: bonnes affaires, millésimes à saisir, domaines en vogue à Marseille/PACA. ${pt}`,
    manque:`Cave: ${cave||'(vide)'}. ${pt} Analyse et dis-moi ce qui manque pour une cave équilibrée.`
  }
  navigator.clipboard?.writeText(msgs[type]).then(()=>toast('Question copiée — collez dans Claude !'))
  toast('Question copiée !')
}

// ── OFFLINE ──
window.addEventListener('online',()=>document.getElementById('offline-bar').classList.remove('show'))
window.addEventListener('offline',()=>document.getElementById('offline-bar').classList.add('show'))
if(!navigator.onLine)document.getElementById('offline-bar').classList.add('show')

// ── PWA ──
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          toast('Mise à jour disponible — rechargez la page', '')
        }
      })
    })
  })
}

// ── INIT ──
sb.auth.onAuthStateChange(async(event,session)=>{
  if(event==='SIGNED_IN'&&session){
    setState('currentUser',session.user)
    await loadUserData()
    showApp()
  } else if(event==='SIGNED_OUT'){
    setState('currentUser',null)
    setState('bottles',[]);setState('courses',[]);setState('prefs',{})
    showAuth()
  }
})

setTimeout(async()=>{
  document.getElementById('splash').classList.add('hide')
  setTimeout(async()=>{
    document.getElementById('splash').style.display='none'
    const{data:{session}}=await sb.auth.getSession()
    if(session){
      setState('currentUser',session.user)
      await loadUserData()
      showApp()
    } else {
      showAuth()
    }
  },400)
},1800)

// ── EXPOSE GLOBALS ──
Object.assign(window,{
  switchAuthTab,showForgot,doLogin,doSignup,doForgot,doLogout,
  obNext,finishOnboarding,showOnboarding:showOnboardingScreen,
  showSection,setFilter,selCol,changeQty,confirmMotif,
  openAdd,openEdit,closeAdd,saveBottle,askDelete,confirmDelete,
  switchCourseTab,openCourses,saveCourse,toggleCourse,selCfcCol,
  confirmCaveFromCourse,deleteCourse,savePrefs,
  pinKey,openPinSetup,savePinSetup,removePinSetup,
  handlePhoto,selScanCol,saveScan,resetScan,
  exportJSON,importJSON,buildDashboard,askClaude
})
