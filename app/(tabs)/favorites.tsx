import ProductCard from "@/components/product/ProductCard";
import { ms } from "@/lib/scaling-units";
import { favoritesActions, selectFavorites } from "@/store/favoritesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { COLORS } from "@/theme";
import { router } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FavoritesScreen() {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectFavorites);
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {favorites.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No favorites yet.</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              isFavorite
              onToggleFavorite={() =>
                dispatch(favoritesActions.removed(item.id))
              }
              onPress={() => router.push(`/products/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: ms(24),
  },
  emptyText: {
    fontSize: ms(14),
    color: COLORS.charcoal,
  },
});
