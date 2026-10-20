export function recentPublication(value,now=new Date()) {
 const published=new Date(value);if(!value||!Number.isFinite(published.getTime())||published>now)return false;
 const end=new Date(published);end.setUTCDate(1);end.setUTCMonth(end.getUTCMonth()+1);
 const days=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).getUTCDate();
 end.setUTCDate(Math.min(published.getUTCDate(),days));
 return now<end;
}
