// Reuses dashboard.css. No password handling, local grants or new training plan.
const APP_RECEIVER = 'https://khypnos-qcm.vercel.app/receive-session'
const RENEWABLE = new Set(['quiz_med', 'quiz_rfe'])
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
export const planLabel = label => label === 'quiz_med' ? 'Quiz fondamental' : label === 'quiz_rfe' ? 'Quiz RFE' : String(label ?? '')
export function entitlementText(entitlement, serverNow) {
  const end = entitlement.expires_at === null ? null : Date.parse(entitlement.expires_at)
  if (entitlement.status === 'inactive') return 'Accès désactivé'
  if (entitlement.status !== 'active' || (end !== null && (!Number.isFinite(end) || end <= serverNow))) return 'Accès expiré'
  if (end === null) return 'Accès permanent'
  const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(end)
  const days = Math.ceil((end - serverNow) / 86400000)
  return `Valable jusqu’au ${date} (heure de Paris) · ${days <= 1 ? 'moins de 24 h restantes' : `${days} jours restants`}`
}
export function receiverURL(session) {
  if (!session?.access_token || !session?.refresh_token) throw Error('Session requise')
  const url = new URL(APP_RECEIVER)
  const hash = new URLSearchParams({ access_token: session.access_token, refresh_token: session.refresh_token })
  url.hash = hash.toString()
  return url.href
}
export function mountQcmAccess(target, payload, { readSession, navigate = url => window.location.assign(url), now = Date.now } = {}) {
  const card = document.createElement('section')
  card.className = 'qcm-access-card'
  card.setAttribute('aria-labelledby', 'qac-title')
  const body = document.createElement('div'); body.className = 'qac-left'
  const icon = document.createElement('div'); icon.className = 'qac-icon'; icon.setAttribute('aria-hidden','true'); icon.textContent = '📝'
  const title = document.createElement('h2'); title.id = 'qac-title'; title.textContent = 'Accès QCM'
  const intro = document.createElement('p'); intro.textContent = 'Retrouve tes quiz et les formules disponibles dans l’application.'
  const install = document.createElement('a')
  install.className = 'qac-install'
  install.href = 'https://khypnos-qcm.vercel.app/installer-app'
  install.target = '_blank'
  install.rel = 'noopener noreferrer'
  install.setAttribute('aria-label', 'Installer l’application (nouvel onglet)')
  install.textContent = 'Installer l’application'
  body.append(icon,title,intro)
  const serverNow = Number.isFinite(Date.parse(payload.referenceTime)) ? Date.parse(payload.referenceTime) : now()
  const subscription = !!payload.qcmSubscriptionActive
  const entitlements = Array.isArray(payload.quizEntitlements) ? payload.quizEntitlements : []
  const errors = document.createElement('p'); errors.setAttribute('role','alert'); errors.hidden = true
  const action = (label) => {
    const link = document.createElement('a'); link.className = 'btn-qcm'
    // Do not leave access/refresh tokens in the DOM or send them as query params.
    link.href = 'https://khypnos-qcm.vercel.app/menu'; link.textContent = label
    link.addEventListener('click', async event => {
      event.preventDefault()
      if (link.getAttribute('aria-disabled') === 'true') return
      link.setAttribute('aria-disabled','true'); errors.hidden = true
      try {
        const session = await readSession()
        if (!session) { navigate('/login.html'); return }
        navigate(receiverURL(session))
      } catch { errors.hidden = false; errors.textContent = 'Connexion à l’application impossible. Réessaie dans un instant.' }
      finally { link.removeAttribute('aria-disabled') }
    })
    return link
  }
  if (subscription) {
    const info = document.createElement('p')
    info.textContent = payload.qcmSubscriptionExpiresAt
      ? `Inclus dans ta formation · ${entitlementText({status:'active',expires_at:payload.qcmSubscriptionExpiresAt},serverNow)}`
      : 'Accès inclus dans ta formation'
    body.append(info)
  } else if (entitlements.length) {
    const list = document.createElement('ul')
    for (const entitlement of entitlements) {
      const item = document.createElement('li')
      const label = document.createElement('strong'); label.textContent = entitlement.label
      const status = entitlementText(entitlement, serverNow)
      item.append(label,document.createTextNode(` — ${status} `))
      if (RENEWABLE.has(entitlement.product_type) && status === 'Accès expiré') item.append(action('Renouveler'))
      list.append(item)
    }
    body.append(list)
  }
  body.append(errors)
  const actions = document.createElement('div')
  actions.className = 'qac-actions'
  actions.setAttribute('role', 'group')
  actions.setAttribute('aria-label', 'Application QCM')
  actions.append(action('Ouvrir l’application QCM'), install)
  card.append(body,actions)
  target.replaceChildren(card)
  return card
}

// Read-only legacy tables, no SQL migration/RPC and no purchase creation.
export function quizPortalStatus(purchases, profile, now = Date.now()) {
  const category=profile?.category || (profile?.user_type === 'infirmier' ? 'iade' : 'medecin')
  const history=(purchases || []).filter(p=>p.category === 'medecin' || (p.category == null && category === 'medecin'))
  const products=[['Quiz','quiz_med','Quiz fondamental'],['Quiz Recommandations SFAR','quiz_rfe','Quiz RFE']]
  const quizEntitlements=products.flatMap(([batch_id,product_type,label])=>{
    const rows=history.filter(p=>p.batch_id===batch_id)
    if(!rows.length)return []
    const active=rows.filter(p=>p.is_active && (p.expires_at === null || Date.parse(p.expires_at)>now))
    const permanent=active.some(p=>p.expires_at === null)
    const enabled=rows.filter(p=>p.is_active)
    const dates=(active.length?active:enabled.length?enabled:rows).map(p=>Date.parse(p.expires_at)).filter(Number.isFinite)
    return [{batch_id,product_type,label,status:active.length?'active':rows.some(p=>p.is_active)?'expired':'inactive',
      expires_at:permanent?null:dates.length?new Date(Math.max(...dates)).toISOString():null}]
  })
  const qcmSubscriptionActive=profile?.subscription_status === 'active' && (!profile.subscription_expires_at || Date.parse(profile.subscription_expires_at)>now)
  return {quizEntitlements,referenceTime:new Date(now).toISOString(),qcmSubscriptionActive,qcmSubscriptionExpiresAt:profile?.subscription_expires_at || null}
}
export async function readQuizPortalStatus(client, userId) {
  const bounded = request => typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' && typeof request.abortSignal === 'function' ? request.abortSignal(AbortSignal.timeout(8000)) : request
  const [purchases,profile]=await Promise.all([
    bounded(client.from('user_purchases').select('batch_id,category,is_active,expires_at').eq('user_id',userId).in('batch_id',['Quiz','Quiz Recommandations SFAR'])),
    bounded(client.from('profiles').select('category,user_type,subscription_status,subscription_expires_at').eq('id',userId).maybeSingle()),
  ])
  if(purchases.error || profile.error)throw Error('Échéances indisponibles')
  return quizPortalStatus(purchases.data,profile.data)
}
