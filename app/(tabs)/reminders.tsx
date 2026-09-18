import { ms, mvs } from "@/lib/scaling-units";
import {
  cancelReminder,
  getScheduled,
} from "@/notifications/notificationService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { remindersActions, selectReminders } from "@/store/remindersSlice";
import { COLORS } from "@/theme";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatFireTime(fireAtMs: number): string {
  return new Date(fireAtMs).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function RemindersScreen() {
  const dispatch = useAppDispatch();
  const reminders = useAppSelector(selectReminders);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getScheduled().then((scheduled) => {
        if (cancelled) return;
        const liveIds = new Set(scheduled.map((n) => n.identifier));
        const stale = reminders.filter((r) => !liveIds.has(r.notificationId));
        stale.forEach((r) =>
          dispatch(remindersActions.removed(r.notificationId)),
        );
      });
      return () => {
        cancelled = true;
      };
    }, [reminders, dispatch]),
  );

  const handleCancel = async (notificationId: string) => {
    await cancelReminder(notificationId);
    dispatch(remindersActions.removed(notificationId));
  };

  if (reminders.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No reminders set.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.notificationId}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/products/${item.productId}`)}
          >
            <View style={styles.rowText}>
              <Text style={styles.title} numberOfLines={1}>
                {item.productTitle}
              </Text>
              <Text style={styles.time}>
                {formatFireTime(item.scheduledAt)}
              </Text>
            </View>
            <Pressable
              onPress={() => handleCancel(item.notificationId)}
              hitSlop={12}
            >
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: ms(24),
  },
  emptyText: { fontSize: ms(14), color: COLORS.charcoal },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ms(16),
    paddingVertical: mvs(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark_white,
  },
  rowText: { flex: 1, marginRight: ms(12), gap: ms(2) },
  title: { fontSize: ms(14), fontWeight: "600", color: COLORS.charcoal },
  time: { fontSize: ms(12), color: "#8A8F98" },
  cancel: { fontSize: ms(13), fontWeight: "700", color: COLORS.deep_red },
});
