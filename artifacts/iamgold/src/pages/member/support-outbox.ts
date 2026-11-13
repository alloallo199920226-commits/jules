export type SupportPendingSend = {
  body: string;
  file: File | null;
  clientId: string;
  imagePath?: string;
  createdAt: string;
};
type StoredSend = SupportPendingSend & { accountId: string; fileName?: string };
const databaseName = 'iamgold-private-support';
const storeName = 'outbox';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(databaseName,1);
    request.onupgradeneeded=()=>request.result.createObjectStore(storeName,{keyPath:'accountId'});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(new Error('Impossible de conserver votre brouillon sur cet appareil.'));
    request.onblocked=()=>reject(new Error('Fermez les autres onglets du site pour conserver votre brouillon.'));
  });
}

export async function readSupportOutbox(accountId: string): Promise<SupportPendingSend | null> {
  const db=await openDatabase();
  try {
    return await new Promise((resolve,reject)=>{
      const request=db.transaction(storeName).objectStore(storeName).get(accountId);
      request.onsuccess=()=>{
        const stored=request.result as StoredSend | undefined;
        if(!stored)return resolve(null);
        const file=stored.file?new File([stored.file],stored.fileName||'image-support',{
          type:stored.file.type,lastModified:stored.file.lastModified||Date.now(),
        }):null;
        resolve({...stored,file});
      };
      request.onerror=()=>reject(new Error('Impossible de restaurer votre message en attente.'));
    });
  }finally{db.close();}
}

export async function saveSupportOutbox(accountId: string,pending: SupportPendingSend): Promise<void> {
  const db=await openDatabase();
  try {
    await new Promise<void>((resolve,reject)=>{
      const transaction=db.transaction(storeName,'readwrite');
      transaction.objectStore(storeName).put({...pending,accountId,fileName:pending.file?.name});
      transaction.oncomplete=()=>resolve();
      transaction.onerror=transaction.onabort=()=>reject(new Error('Brouillon non enregistré. Libérez de l’espace sur cet appareil avant de réessayer.'));
    });
  }finally{db.close();}
}

/** A late acknowledgement must never delete a newer message being composed. */
export async function removeSupportOutbox(accountId: string,clientId: string): Promise<void> {
  const db=await openDatabase();
  try {
    await new Promise<void>((resolve,reject)=>{
      const transaction=db.transaction(storeName,'readwrite');
      const store=transaction.objectStore(storeName);
      const request=store.get(accountId);
      request.onsuccess=()=>{if(request.result?.clientId===clientId)store.delete(accountId);};
      transaction.oncomplete=()=>resolve();
      transaction.onerror=transaction.onabort=()=>reject(new Error('Impossible de mettre à jour votre brouillon.'));
    });
  }finally{db.close();}
}
