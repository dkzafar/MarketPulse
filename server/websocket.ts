import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

const BROADCAST_INTERVAL_MS = 15000;
const MAX_ASSETS_PER_BROADCAST = 50;

export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
    ws.on("error", () => clients.delete(ws));
  });

  setInterval(async () => {
    if (clients.size === 0) return;

    try {
      const response = await fetch("http://localhost:5000/api/market-data");
      if (!response.ok) return;

      const data: any[] = await response.json();
      const payload = data
        .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
        .slice(0, MAX_ASSETS_PER_BROADCAST);

      const message = JSON.stringify({
        type: "price_update",
        data: payload,
        timestamp: Date.now(),
      });

      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    } catch {
      // market-data fetch failed; skip this tick
    }
  }, BROADCAST_INTERVAL_MS);

  return wss;
}
