import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { COMMON_SIZES } from "@/lib/constants";
import { ms } from "@/lib/scaling-units";
import { COLORS } from "@/theme";

type Props = {
  value: number;
};

const STAR_SIZE = COMMON_SIZES["3xl"];

export function Rating({ value }: Props) {
  return (
    <View style={styles.row}>
      <Ionicons name="star" size={STAR_SIZE} color={COLORS.star} />
      <Text style={styles.value}>
        {value ? value.toFixed(1) : "No Rating available for the same"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(4),
  },
  value: {
    fontSize: ms(12),
    color: COLORS.charcoal,
  },
});
