import { COMMON_SIZES } from "@/lib/constants";
import { COLORS } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

type FavoriteButtonProps = {
  isFavorite: boolean;
  onToggle: () => void;
};

const FavoriteButton = ({ isFavorite, onToggle }: FavoriteButtonProps) => {
  return (
    <Pressable onPress={onToggle} hitSlop={12}>
      {isFavorite ? (
        <Ionicons
          name="heart-sharp"
          color={COLORS.red}
          size={COMMON_SIZES["5xl"]}
        />
      ) : (
        <Ionicons
          name="heart-outline"
          color={COLORS.black}
          size={COMMON_SIZES["5xl"]}
        />
      )}
    </Pressable>
  );
};

export default FavoriteButton;

const styles = StyleSheet.create({});
