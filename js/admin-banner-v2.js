import {supabase} from '/espace-client/auth.js';
import {checkAdminAccess} from '/js/admin-access-v2.js';
const mount=document.getElementById('admin-access-v2');
let version=0;
function hide(){if(mount){mount.hidden=true;mount.replaceChildren();}}
async function render(){
 if(!mount)return;const attempt=++version;hide();
 try{
  await checkAdminAccess();if(attempt!==version)return;
  const link=document.createElement('a');link.href='/espace-client/admin-v2.html';link.className='v2-admin-banner-link';
  link.innerHTML='<span class="v2-admin-banner-icon" aria-hidden="true">⚙</span><span class="v2-admin-banner-copy"><strong>Espace administration</strong><span>Pilotage des contenus Khypnos</span></span><span class="v2-admin-banner-tag">Admin</span><span class="v2-admin-banner-arrow" aria-hidden="true">›</span>';
  mount.append(link);mount.hidden=false;
 }catch{if(attempt===version)hide();} // Failure closed: no banner and no impact on student dashboard.
}
// A sign-out immediately removes the link. Every actual admin action is also authorized server-side.
supabase.auth.onAuthStateChange?.((event)=>{if(event==='SIGNED_OUT'){version++;hide();}});
await render();
