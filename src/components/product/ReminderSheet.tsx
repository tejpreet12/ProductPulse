import { ms, mvs } from "@/lib/scaling-units";
import { COLORS } from "@/theme";
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type ReminderPreset = "1min" | "1hour";

export function presetToDate(preset: ReminderPreset): Date {
  const now = new Date();
  switch (preset) {
    case "1min":
      return new Date(now.getTime() + 60 * 1000);
    case "1hour":
      return new Date(now.getTime() + 60 * 60 * 1000);
  }
}

const PRESETS: { key: ReminderPreset; label: string }[] = [
  { key: "1min", label: "In 1 minute" },
  { key: "1hour", label: "In 1 hour" },
];

type ReminderSheetProps = {
  visible: boolean;
  permissionDenied: boolean;
  onSelect: (preset: ReminderPreset) => void;
  onDismiss: () => void;
};

export function ReminderSheet({
  visible,
  permissionDenied,
  onSelect,
  onDismiss,
}: ReminderSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Set a reminder</Text>

          {permissionDenied ? (
            <View style={styles.deniedBox}>
              <Text style={styles.deniedText}>
                Notifications are turned off for ProductPulse. Enable them to
                get reminders.
              </Text>
              <Pressable
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.deniedLink}>Open settings</Text>
              </Pressable>
            </View>
          ) : (
            PRESETS.map((preset) => (
              <Pressable
                key={preset.key}
                style={styles.option}
                onPress={() => onSelect(preset.key)}
              >
                <Text style={styles.optionText}>{preset.label}</Text>
              </Pressable>
            ))
          )}

          <Pressable
            onPress={onDismiss}
            style={styles.cancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: ms(16),
    borderTopRightRadius: ms(16),
    padding: ms(20),
    gap: ms(12),
  },
  title: {
    fontSize: ms(16),
    fontWeight: "700",
    color: COLORS.charcoal,
    marginBottom: ms(4),
  },
  option: {
    paddingVertical: mvs(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark_white,
  },
  optionText: { fontSize: ms(15), color: COLORS.charcoal },
  deniedBox: { gap: ms(8), paddingVertical: mvs(8) },
  deniedText: { fontSize: ms(14), color: COLORS.charcoal },
  deniedLink: { fontSize: ms(14), color: "#1F6FEB", fontWeight: "700" },
  cancel: { paddingVertical: mvs(14), alignItems: "center" },
  cancelText: { fontSize: ms(15), color: COLORS.deep_red, fontWeight: "600" },
});
