const wsMap = new Map();
export function wsAdd(userId, socket) {
    if (!wsMap.has(userId))
        wsMap.set(userId, new Set());
    wsMap.get(userId).add(socket);
}
export function wsRemove(userId, socket) {
    const set = wsMap.get(userId);
    if (!set)
        return;
    set.delete(socket);
    if (set.size === 0)
        wsMap.delete(userId);
}
export function wsBroadcast(userId, payload) {
    const set = wsMap.get(userId);
    if (!set)
        return;
    const msg = JSON.stringify(payload);
    for (const s of set) {
        try {
            if (s?.readyState === s.OPEN)
                s.send(msg);
        }
        catch { }
    }
}
