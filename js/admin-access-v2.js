import {supabase} from '/espace-client/auth.js?v=private-512fdc885acff734';
export async function checkAdminAccess(){
 const {data,error}=await supabase.auth.getSession();
 if(error||!data?.session)throw Object.assign(new Error(),{status:401});
 const res=await fetch('https://fbxiynomlxrjasbbcipp.supabase.co/functions/v1/get-admin-access-v2',{
  headers:{Authorization:'Bearer '+data.session.access_token},cache:'no-store',signal:AbortSignal.timeout(20000)
 });
 let body;try{body=await res.json();}catch{body={};}
 if(!res.ok)throw Object.assign(new Error(),{status:res.status,code:body.error??body.code});
 if(body.allowed!==true||body.mode!=='apercu_admin')throw Object.assign(new Error(),{status:403,code:'ACCES_ADMIN_NON_CONFIRME'});
 return {email:body.email??data.session.user?.email??null};
}
