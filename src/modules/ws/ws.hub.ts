import type { WebSocket } from "ws";

type UserId = string;

const userSockets = new Map<UserId, Set<WebSocket>>();

export function wsAdd(userId: string, socket: WebSocket) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }

  userSockets.get(userId)!.add(socket);

  socket.on("close", () => {
    wsRemove(userId, socket);
  });
}

export function wsRemove(userId: string, socket: WebSocket) {
  const set = userSockets.get(userId);
  if (!set) return;

  set.delete(socket);
  if (set.size === 0) userSockets.delete(userId);
}

export function wsBroadcastToUser(userId: string, event: any) {
  const set = userSockets.get(userId);

  if (!set) return;
  console.log(set)
  const msg = JSON.stringify(event);
  console.log(msg)

  for (const socket of set) {
    if (socket.readyState === socket.OPEN) {
      socket.send(msg);
    }
  }
}
