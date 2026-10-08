// "My Music": songs the player picks from their own device. They are stored only in
// this browser (IndexedDB), never uploaded, so the player can use music they own.

const DB = 'angryTurkeys_music';
const STORE = 'songs';

export interface Song { id: string; title: string; blob: Blob }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req ? (req as IDBRequest<T>).result : undefined);
    tx.onerror = () => reject(tx.error);
  }));
}

export async function loadSongs(): Promise<Song[]> {
  try {
    return ((await run<Song[]>('readonly', s => s.getAll())) ?? []).sort((a, b) => a.title.localeCompare(b.title));
  } catch {
    return []; // storage blocked (private mode): the station just starts empty
  }
}

const titleOf = (name: string) => name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ');

export async function addSongs(files: FileList | File[]): Promise<Song[]> {
  const added: Song[] = [];
  for (const f of Array.from(files)) {
    if (!f.type.startsWith('audio/') && !/\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(f.name)) continue;
    const song = { id: `${f.name}-${f.size}`, title: titleOf(f.name), blob: f as Blob };
    try { await run('readwrite', s => s.put(song)); } catch { /* keep it for this session only */ }
    added.push(song);
  }
  return added;
}

export async function clearSongs() {
  try { await run('readwrite', s => s.clear()); } catch { /* ignore */ }
}
