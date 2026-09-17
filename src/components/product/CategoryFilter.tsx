import { useGetCategoriesQuery } from "@/api/productsApi";
import { ms, mvs } from "@/lib/scaling-units";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";

type CategoryFilterProps = {
  selected: string | null;
  onSelect: (slug: string | null) => void;
};

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  const { data: categories } = useGetCategoriesQuery();

  const chips: { slug: string | null; name: string }[] = [
    { slug: null, name: "All" },
    ...(categories ?? []).map((c) => ({ slug: c.slug, name: c.name })),
  ];

  return (
    <FlatList
      horizontal
      data={chips}
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.slug ?? "all"}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => {
        const isActive = item.slug === selected;
        return (
          <Pressable
            onPress={() => onSelect(item.slug)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {item.name}
            </Text>
          </Pressable>
        );
      }}
    />
  );
};

export default CategoryFilter;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: ms(12),
    gap: ms(8),
    paddingVertical: mvs(8),
    marginBottom: ms(8),
  },
  chip: {
    paddingHorizontal: ms(14),
    paddingVertical: mvs(8),
    borderRadius: ms(16),
    backgroundColor: "#EEF0F3",
    height: mvs(32),
  },
  chipActive: {
    backgroundColor: "#1F6FEB",
  },
  chipText: {
    fontSize: ms(14),
    color: "#3C4257",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
