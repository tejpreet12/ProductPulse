import { COMMON_SIZES } from "@/lib/constants";
import { ms, mvs } from "@/lib/scaling-units";
import { COLORS } from "@/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

const SearchBar = ({ value, onChangeText, placeholder }: SearchBarProps) => {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={12}>
          <MaterialIcons
            name="delete"
            size={COMMON_SIZES["6xl"]}
            color="#8A8F98"
          />
        </Pressable>
      )}
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: ms(12),
    marginTop: ms(12),
    paddingHorizontal: ms(12),
    height: mvs(44),
    borderRadius: ms(14),
    backgroundColor: COLORS.dark_white,
    borderColor: COLORS.charcoal,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: "0px 3px 10px rgba(0, 0, 0, 0.08)",
  },
  input: {
    flex: 1,
    fontSize: ms(14),
  },
});
