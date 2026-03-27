const userSockets = new Map();
export function wsAdd(userId, socket) {
    if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket);
    socket.on("close", () => {
        wsRemove(userId, socket);
    });
}
export function wsRemove(userId, socket) {
    const set = userSockets.get(userId);
    if (!set)
        return;
    set.delete(socket);
    if (set.size === 0)
        userSockets.delete(userId);
}
export function wsBroadcastToUser(userId, event) {
    const set = userSockets.get(userId);
    if (!set)
        return;
    const msg = JSON.stringify(event);
    console.log(msg);
    for (const socket of set) {
        if (socket.readyState === socket.OPEN) {
            socket.send(msg);
        }
    }
}
