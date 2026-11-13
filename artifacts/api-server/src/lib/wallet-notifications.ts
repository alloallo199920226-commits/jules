import { pool } from "@workspace/db";

const channel = "iamgold_wallet_changed";
type Subscriber = { changed: () => void; disconnected: () => void };
const subscribers = new Map<string, Set<Subscriber>>();
let listening: Promise<void> | undefined;
let idleTimer: ReturnType<typeof setTimeout> | undefined;
let stop = () => {};

/** PostgreSQL delivers NOTIFY only after commit, including across server instances. */
function ensureListener() {
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = undefined; }
  if (!listening) {
    listening = (async () => {
      const client = await pool.connect();
      let released = false;
      const disconnect = () => {
        if (released) return;
        released = true;
        listening = undefined;
        const active = [...subscribers.values()].flatMap(set => [...set]);
        subscribers.clear();
        client.release(true);
        for (const subscriber of active) subscriber.disconnected();
      };
      stop = disconnect;
      client.on("error", disconnect);
      client.on("end", disconnect);
      client.on("notification", message => {
        if (message.channel !== channel || !message.payload) return;
        for (const subscriber of subscribers.get(message.payload) ?? []) subscriber.changed();
      });
      try { await client.query(`LISTEN ${channel}`); }
      catch (error) { disconnect(); throw error; }
    })().catch(error => { listening = undefined; throw error; });
  }
  return listening;
}

export async function subscribeWalletChanges(accountId: string, subscriber: Subscriber) {
  await ensureListener();
  let group = subscribers.get(accountId);
  if (!group) { group = new Set(); subscribers.set(accountId, group); }
  group.add(subscriber);
  return () => {
    group.delete(subscriber);
    if (!group.size && subscribers.get(accountId) === group) subscribers.delete(accountId);
    if (!subscribers.size) {
      idleTimer = setTimeout(() => { if (!subscribers.size) stop(); }, 1000);
      idleTimer.unref();
    }
  };
}
