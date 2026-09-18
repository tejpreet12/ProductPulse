import { COLORS } from "@/theme";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const REMAINDER_CHANNEL_ID = "reminders";

export async function ensureAndroidChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(REMAINDER_CHANNEL_ID, {
    name: "Product reminders",
    importance: Notifications.AndroidImportance.MAX,
    lightColor: COLORS.red,
  });
}

export async function requestNotificationPermission(): Promise<
  "granted" | "denied"
> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return "granted";

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted ? "granted" : "denied";
}

export type ScheduleReminderInput = {
  productId: number;
  title: string;
  fireAt: Date;
};

export async function scheduleProductRemainder(
  notificationInput: ScheduleReminderInput,
): Promise<string> {
  await ensureAndroidChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Product Remainder",
      body: notificationInput.title,
      data: {
        route: `/products/${notificationInput.productId}`,
        productId: notificationInput.productId,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notificationInput.fireAt,
      channelId: REMAINDER_CHANNEL_ID,
    },
  });
}

export async function cancelReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function getScheduled(): Promise<
  Notifications.NotificationRequest[]
> {
  return Notifications.getAllScheduledNotificationsAsync();
}
