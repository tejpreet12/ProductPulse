import {
  useGetProductsInfiniteQuery,
  useSearchProductsInfiniteQuery,
} from "@/api/productsApi";
import CategoryFilter from "@/components/product/CategoryFilter";
import ProductCard from "@/components/product/ProductCard";
import SearchBar from "@/components/ui/SearchBar";
import { ms, mvs } from "@/lib/scaling-units";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { COLORS } from "@/theme";
import { skipToken } from "@reduxjs/toolkit/query";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProductsScreen() {
  const [isFavorite, setIsFavorite] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const debouncedQuery = useDebouncedValue(query.trim(), 400);
  const isSearching = debouncedQuery.length > 0;

  const byCategory = useGetProductsInfiniteQuery(
    isSearching ? skipToken : (category ?? undefined),
  );
  const bySearch = useSearchProductsInfiniteQuery(
    isSearching ? debouncedQuery : skipToken,
  );

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = isSearching ? bySearch : byCategory;

  const products = data ? data.pages.flatMap((page) => page.products) : [];
  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search products here..."
      />
      <CategoryFilter selected={category} onSelect={setCategory} />

      {isLoading ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <Text style={styles.center}>Something went wrong.</Text>
      ) : products.length === 0 ? (
        <Text style={styles.center}>No products found.</Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              isFavorite={false}
              onToggleFavorite={() => {
                // TODO : dispatch favorites.toggled once favoritesSlice exists.
              }}
              onPress={() => router.push(`/products/${item.id}`)}
            />
          )}
          onEndReachedThreshold={0.5}
          onEndReached={() =>
            hasNextPage && !isFetchingNextPage && fetchNextPage()
          }
          refreshing={isFetching && !isFetchingNextPage}
          onRefresh={refetch}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={styles.footer} />
            ) : null
          }
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
  footer: {
    paddingVertical: mvs(16),
  },
  center: {
    textAlign: "center",
    padding: ms(24),
  },
});
