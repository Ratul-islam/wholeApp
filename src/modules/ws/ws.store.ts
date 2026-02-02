const wsMap = new Map<string, Set<any>>();

export function wsAdd(userId: string, socket: any) {
  if (!wsMap.has(userId)) wsMap.set(userId, new Set());
  wsMap.get(userId)!.add(socket);
}

export function wsRemove(userId: string, socket: any) {
  const set = wsMap.get(userId);
  if (!set) return;
  set.delete(socket);
  if (set.size === 0) wsMap.delete(userId);
}

export function wsBroadcast(userId: string, payload: any) {
  const set = wsMap.get(userId);
  if (!set) return;

  const msg = JSON.stringify(payload);
  for (const s of set) {
    try {
      if (s?.readyState === s.OPEN) s.send(msg);
    } catch {}
  }
}
