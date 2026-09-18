import { useCallback, useEffect, useRef } from "react";
import { router, type Href } from "expo-router";
import * as Notifications from "expo-notifications";
import { extractRoute } from "@/lib/validation";

export function useNotificationRouting(): void {
  const handled = useRef<string | null>(null);
  const lastResponse = Notifications.useLastNotificationResponse();

  const handle = useCallback((response: Notifications.NotificationResponse) => {
    const requestId = response.notification.request.identifier;
    if (handled.current === requestId) return;
    handled.current = requestId;

    const route = extractRoute(response.notification.request.content.data);
    if (route) router.push(route as Href);
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [handle]);

  useEffect(() => {
    if (lastResponse) handle(lastResponse);
  }, [lastResponse, handle]);
}
