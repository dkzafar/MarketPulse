import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const RECONNECT_DELAY_MS = 5000;

export function useLivePrices() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type !== "price_update" || !Array.isArray(msg.data)) return;

          queryClient.setQueryData(
            ["/api/market-data"],
            (old: any[] | undefined) => {
              if (!old) return msg.data;
              const updates = new Map<string, any>(
                msg.data.map((d: any) => [d.symbol, d])
              );
              return old.map((item) => updates.get(item.symbol) ?? item);
            }
          );
        } catch {
          // malformed message; ignore
        }
      };

      ws.onclose = () => {
        if (!unmountedRef.current) {
          setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      wsRef.current?.close();
    };
  }, [queryClient]);
}
