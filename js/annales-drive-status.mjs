/** Pure status calculation: an unverified or ambiguous Drive source is never green. */
function validSource(s) {
  return !!s && typeof s.id === 'string' && s.id.length > 0 &&
    typeof s.modifiedTime === 'string' && Number.isFinite(Date.parse(s.modifiedTime));
}
function sameSource(a,b) {
  return validSource(a) && validSource(b) && a.id === b.id &&
    Date.parse(a.modifiedTime) === Date.parse(b.modifiedTime);
}
/** `published` may be an explicitly assumed initial snapshot, not a claimed publication date. */
export function driveStatus({source, published, preview, hasPublishedPdf, error}) {
  if (error === 'SOURCE_ABSENTE' || error === 'DOSSIER_ABSENT')
    return {code:'missing',label:'Fichier absent',description:'Fichier Word attendu introuvable dans le dossier Drive de cette année.',tone:'unknown'};
  if (error || !validSource(source)) return {code:'unknown',label:'À vérifier',description:'Vérification du fichier Drive impossible.',tone:'unknown'};
  if (!hasPublishedPdf) {
    if (preview?.publishable && sameSource(source,preview.source)) return {code:'ready',label:'À publier',description:'Aperçu prêt à publier.',tone:'ready'};
    return {code:'new',label:'À générer',description:'Aucun PDF publié : à générer et publier.',tone:'changed'};
  }
  if (!validSource(published?.source)) return {code:'unknown',label:'À vérifier',description:'Référence de publication inconnue.',tone:'unknown'};
  if (sameSource(source,published.source)) return {code:'current',label:'À jour',description:'Le fichier Drive correspond à la référence retenue.',tone:'current'};
  if (preview?.publishable && sameSource(source,preview.source)) return {code:'ready',label:'À publier',description:'Aperçu prêt à publier.',tone:'ready'};
  return {code:'changed',label:'Modifié',description:'Fichier modifié : à régénérer et republier.',tone:'changed'};
}
export function itemsToGenerate(items,limit=6) {
  if (!Array.isArray(items) || !Number.isInteger(limit) || limit < 1) return [];
  return items.filter(x=>['changed','new'].includes(x.status?.code)).slice(0,limit).map(x=>({year:x.year,track:x.track}));
}
