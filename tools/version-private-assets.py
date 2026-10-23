#!/usr/bin/env python3
"""Version the private area's local JS/CSS references consistently. Standard library only."""
import argparse,hashlib,json,posixpath,re,sys
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit,parse_qsl,urlencode
PATTERNS=[re.compile(r'''(?:src|href)\s*=\s*["'](?P<url>[^"']+)["']'''),re.compile(r'''(?:from\s*|import\s*\(\s*|import\s+)["'](?P<url>[^"']+)["']'''),re.compile(r'''@import\s+(?:url\(\s*)?["'](?P<url>[^"']+)["']''')]
SUFFIXES=('.js','.mjs','.css')
def local_url(page,url):
 u=urlsplit(url)
 if u.scheme or u.netloc or not u.path.endswith(SUFFIXES):return None
 if any(c in url for c in ('${','{{','}}')):return None
 p=posixpath.normpath(u.path.lstrip('/') if u.path.startswith('/') else posixpath.join(posixpath.dirname(page),u.path))
 if p.startswith('../') or p=='..':raise ValueError('Reference hors du site : '+page)
 return p

def matches(text):
 seen=set()
 for pattern in PATTERNS:
  for m in pattern.finditer(text):
   span=m.span('url')
   if span not in seen:seen.add(span);yield span,m.group('url')

def change_url(url,version):
 u=urlsplit(url);q=[(k,v) for k,v in parse_qsl(u.query,keep_blank_values=True) if k!='v']
 if version is not None:q.append(('v',version))
 return urlunsplit((u.scheme,u.netloc,u.path,urlencode(q),u.fragment))

def rewrite(name,text,version):
 edits=[(span,change_url(u,version)) for span,u in matches(text) if local_url(name,u)]
 for (start,end),value in sorted(edits,reverse=True):text=text[:start]+value+text[end:]
 return text

def collect(root):
 root=Path(root);initial=[p.relative_to(root).as_posix() for p in sorted((root/'espace-client').glob('*.html')) if '_old' not in p.stem.lower() and 'backup' not in p.stem.lower()]
 initial += [n for n in ['login.html','reset-password.html'] if (root/n).is_file()]
 if not initial:raise ValueError('Aucune page espace-client trouvee')
 pending=set(initial);texts={};edges={}
 while pending:
  name=pending.pop()
  if name in texts:continue
  p=root/name
  if not p.is_file():raise ValueError('Dependance absente : '+name)
  text=p.read_text(encoding='utf-8');texts[name]=text;edges[name]=sorted({n for _,u in matches(text) if (n:=local_url(name,u))})
  pending.update(edges[name])
  if len(texts)>500:raise ValueError('Trop de dependances : verifier la configuration')
 return texts,edges

def prepare(root):
 texts,edges=collect(root);h=hashlib.sha256()
 for name,text in sorted(texts.items()):h.update(name.encode()+b'\0'+rewrite(name,text,None).encode()+b'\0')
 version='private-'+h.hexdigest()[:16];updates={name:rewrite(name,text,version) for name,text in texts.items()};changed=[n for n in sorted(texts) if texts[n]!=updates[n]]
 manifest={'schema':1,'version':version,'pages':sorted(n for n in texts if n.endswith('.html')),'assets':sorted(n for n in texts if n.endswith(SUFFIXES)),'dependencies':edges}
 return version,updates,changed,manifest

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);ap.add_argument('--check',action='store_true');ap.add_argument('--dry-run',action='store_true');a=ap.parse_args()
 try:
  version,updates,changed,manifest=prepare(a.root)
  if not a.check and not a.dry_run:
   for name in changed:(a.root/name).write_text(updates[name],encoding='utf-8')
   (a.root/'private-assets-version.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  print(version+' : '+str(len(changed))+' fichier(s) a actualiser' if a.check or a.dry_run else version+' : '+str(len(changed))+' fichier(s) actualise(s)')
  return 1 if a.check and changed else 0
 except (OSError,ValueError) as e:print(str(e),file=sys.stderr);return 2
if __name__=='__main__':sys.exit(main())
