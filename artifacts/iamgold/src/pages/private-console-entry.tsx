import { useEffect, useRef, useState } from 'react';
import NotFound from './not-found';
import { SessionLoading } from '@/session';
import { trackVisibleViewport } from '@/lib/visible-viewport';

/** The address is supplied by the visitor's URL, never embedded in this bundle. */
export default function PrivateConsoleEntry({ path }: { path: string }) {
  const [result,setResult]=useState<'checking'|'open'|'missing'|'error'>('checking');
  const [retry,setRetry]=useState(0);
  const frameRef=useRef<HTMLIFrameElement>(null);
  useEffect(()=>{
    if(result!=='open'||!frameRef.current)return;
    return trackVisibleViewport(frameRef.current);
  },[result]);
  const entry=path.replace(/^\//,'');
  const valid=/^[a-zA-Z0-9@_-]{16,100}$/.test(entry);
  const target=`/api/console/${encodeURIComponent(entry)}`;
  useEffect(()=>{
    const robots=document.createElement('meta');
    robots.name='robots';robots.content='noindex,nofollow,noarchive';
    const referrer=document.createElement('meta');
    referrer.name='referrer';referrer.content='no-referrer';
    document.head.append(robots,referrer);
    return ()=>{robots.remove();referrer.remove();};
  },[]);
  useEffect(()=>{
    const controller=new AbortController();
    setResult(valid?'checking':'missing');
    if(valid)void fetch(target,{
      method:'HEAD',credentials:'same-origin',cache:'no-store',
      referrerPolicy:'no-referrer',signal:controller.signal,
    }).then(response=>{
      if(!controller.signal.aborted)setResult(response.ok?'open':response.status===404?'missing':'error');
    }).catch(()=>{if(!controller.signal.aborted)setResult('error');});
    return ()=>controller.abort();
  },[valid,target,retry]);
  if(!valid||result==='missing')return <NotFound/>;
  if(result==='checking')return <SessionLoading/>;
  if(result==='error')return <main className="min-h-screen grid place-content-center gap-4 p-6" role="alert">
    <p>La page est temporairement indisponible.</p>
    <button type="button" onClick={()=>setRetry(value=>value+1)}>Réessayer</button>
  </main>;
  return <iframe ref={frameRef} title="Administration sécurisée" className="admin-console-frame" src={target} referrerPolicy="no-referrer"/>;
}
