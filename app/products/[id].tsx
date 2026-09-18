import { useGetProductByIdQuery } from "@/api/productsApi";
import { ProductListItem } from "@/api/types";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { Rating } from "@/components/ui/Rating";
import { ms, mvs } from "@/lib/scaling-units";
import { parseProductId } from "@/lib/validation";
import {
  presetToDate,
  ReminderPreset,
  ReminderSheet,
} from "@/components/product/ReminderSheet";
import {
  cancelReminder,
  requestNotificationPermission,
  scheduleProductRemainder,
} from "@/notifications/notificationService";
import {
  remindersActions,
  selectReminderForProduct,
} from "@/store/remindersSlice";
import {
  favoritesActions,
  selectIsFavorite,
  toFavoriteRecord,
} from "@/store/favoritesSlice";
import { useAppSelector } from "@/store/hooks";
import { COLORS } from "@/theme";
import { skipToken } from "@reduxjs/toolkit/query";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import { useState } from "react";

const STOCK_COLORS: Record<ProductListItem["availabilityStatus"], string> = {
  "In Stock": COLORS.green,
  "Low Stock": COLORS.yellow,
  "Out of Stock": COLORS.deep_red,
};

export default function ProductDetailScreen() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseProductId(id);

  const existingReminder = useAppSelector(
    selectReminderForProduct(productId ?? -1),
  );

  const { width } = useWindowDimensions();
  const isFavorite = useAppSelector(selectIsFavorite(productId ?? -1));
  const dispatch = useDispatch();
  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetProductByIdQuery(Number(productId) ?? skipToken);

  if (id === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (productId === null) {
    return <Center text="That product link doesn't look right." />;
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    const status = "status" in error ? error.status : undefined;
    if (status === 404) return <Center text="We couldn't find that product." />;
    return <Center text="Something went wrong." onRetry={refetch} />;
  }

  if (!product) return null;

  const handleSelectPreset = async (preset: ReminderPreset) => {
    const fireAt = presetToDate(preset);

    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      setPermissionDenied(true);
      return;
    }

    const notificationId = await scheduleProductRemainder({
      productId,
      title: product.title,
      fireAt,
    });

    dispatch(
      remindersActions.added({
        notificationId,
        productId,
        productTitle: product.title,
        route: `/products/${productId}`,
        scheduledAt: fireAt.getTime(),
        createdAt: Date.now(),
      }),
    );
    setSheetVisible(false);
  };

  const handleReminderPress = async () => {
    if (existingReminder) {
      await cancelReminder(existingReminder.notificationId);
      dispatch(remindersActions.removed(existingReminder.notificationId));
      return;
    }
    setPermissionDenied(false);
    setSheetVisible(true);
  };
  return (
    <ScrollView>
      <Stack.Screen options={{ title: product.title ?? "Product" }} />

      <FlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri) => `${uri}`}
        data={product.images}
        renderItem={({ item }) => {
          return (
            <Image
              source={{ uri: item }}
              resizeMode="contain"
              height={mvs(300)}
              width={width}
            />
          );
        }}
      />

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{product.title}</Text>
        </View>
        <FavoriteButton
          isFavorite={isFavorite}
          onToggle={() =>
            dispatch(favoritesActions.toggled(toFavoriteRecord(product)))
          }
        />

        <View style={styles.priceRow}>
          <Text style={styles.price}>{product.price}</Text>
        </View>

        <Rating value={product.rating} />

        <Text
          style={[
            styles.stock,
            { color: STOCK_COLORS[product.availabilityStatus] },
          ]}
        >
          {product.availabilityStatus} ({product.stock} left)
        </Text>

        <Text style={styles.description}>{product.description}</Text>

        <Pressable style={styles.reminderButton} onPress={handleReminderPress}>
          <Text style={styles.reminderButtonText}>
            {existingReminder ? "Cancel reminder" : "Set reminder"}
          </Text>
        </Pressable>
      </View>

      <ReminderSheet
        visible={sheetVisible}
        permissionDenied={permissionDenied}
        onSelect={handleSelectPreset}
        onDismiss={() => setSheetVisible(false)}
      />
    </ScrollView>
  );
}

function Center({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{text}</Text>
      {onRetry && (
        <Text style={styles.retry} onPress={() => onRetry()}>
          Retry
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: ms(24),
    gap: ms(8),
  },
  errorText: { fontSize: ms(15), color: COLORS.charcoal, textAlign: "center" },
  retry: { color: COLORS.red, fontWeight: "600", marginTop: ms(8) },
  body: { padding: ms(16), gap: ms(8) },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: ms(8),
  },
  title: {
    flex: 1,
    fontSize: ms(18),
    fontWeight: "700",
    color: COLORS.charcoal,
  },
  priceRow: { flexDirection: "row", alignItems: "center", gap: ms(8) },
  price: { fontSize: ms(18), fontWeight: "700", color: COLORS.charcoal },
  originalPrice: {
    fontSize: ms(14),
    color: "#8A8F98",
    textDecorationLine: "line-through",
  },
  category: { fontSize: ms(13), color: "#8A8F98", textTransform: "capitalize" },
  stock: { fontSize: ms(13), fontWeight: "600" },
  description: {
    fontSize: ms(14),
    color: COLORS.charcoal,
    lineHeight: ms(20),
    marginTop: ms(8),
  },
  reminderButton: {
    marginTop: ms(12),
    paddingVertical: mvs(12),
    borderRadius: ms(10),
    backgroundColor: "#1F6FEB",
    alignItems: "center",
  },
  reminderButtonText: {
    color: COLORS.white,
    fontSize: ms(14),
    fontWeight: "700",
  },
});
