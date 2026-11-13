/** Bound even a request which neglects its AbortSignal; never leave "Envoi…" forever. */
export async function supportRequest<T>(
  request: (signal: AbortSignal)=>Promise<T>,
  outerSignal?: AbortSignal,
  timeoutMs=60000,
): Promise<T> {
  const controller=new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel=()=>{};
  const deadline=new Promise<never>((_resolve,reject)=>{
    cancel=()=>{reject(new DOMException('Envoi interrompu.','AbortError'));controller.abort();};
    if(outerSignal?.aborted){cancel();return;}
    outerSignal?.addEventListener('abort',cancel,{once:true});
    timer=setTimeout(()=>{
      reject(new Error('Le délai d’envoi est dépassé. Votre message et votre image restent conservés : réessayez.'));
      controller.abort();
    },timeoutMs);
  });
  try {
    if(outerSignal?.aborted)return await deadline;
    return await Promise.race([request(controller.signal),deadline]);
  }finally{
    clearTimeout(timer);
    outerSignal?.removeEventListener('abort',cancel);
  }
}

export function reconcileSupportMessages<T extends {id:string;clientId?:string;sender:string}>(
  current: T[],received: T[],
): T[] {
  const confirmed=new Set(received.filter(item=>item.sender==='member').map(item=>item.clientId).filter(Boolean));
  const result=new Map<string,T>();
  // Keep an acknowledged send when an older poll finishes after its POST.
  for(const item of current)if(!item.id.startsWith('local-')||!confirmed.has(item.clientId))result.set(item.id,item);
  for(const item of received)result.set(item.id,item);
  return [...result.values()];
}
