import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ProductListItem } from "@/api/types";
import { COLORS } from "@/theme";
import { ms, mvs } from "@/lib/scaling-units";
import { COMMON_SIZES } from "@/lib/constants";
import { Rating } from "../ui/Rating";
import FavoriteButton from "../ui/FavoriteButton";

type ProductCardProps = {
  product: ProductListItem;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
};

const STOCK_COLORS: Record<ProductListItem["availabilityStatus"], string> = {
  "In Stock": COLORS.green,
  "Low Stock": COLORS.yellow,
  "Out of Stock": COLORS.deep_red,
};

const ProductCard = ({
  product,
  isFavorite,
  onToggleFavorite,
  onPress,
}: ProductCardProps) => {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image source={{ uri: product.thumbnail }} resizeMode="cover" height={mvs(100)} width={ms(100)} />

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{product.price}</Text>
        </View>

        <View style={styles.metaRow}>
          <Rating value={product.rating} />
          <Text style={styles.category}>{product.category}</Text>
        </View>

        <Text
          style={[
            styles.stock,
            { color: STOCK_COLORS[product.availabilityStatus] },
          ]}
        >
          {product.availabilityStatus}
        </Text>
      </View>

      <View style={styles.favoriteSlot}>
        <FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
      </View>
    </Pressable>
  );
};

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: ms(12),
    marginHorizontal: ms(12),
    marginVertical: mvs(6),
    borderRadius: ms(12),
    backgroundColor: COLORS.white,
    boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.12)",
  },
  thumbnail: {
    width: ms(72),
    height: mvs(72),
    borderRadius: ms(8),
    backgroundColor: COLORS.light_white,
  },
  body: {
    flex: 1,
    marginLeft: ms(12),
    justifyContent: "center",
    gap: ms(4),
  },
  title: {
    fontSize: ms(14),
    fontWeight: "600",
    color: COLORS.charcoal,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
  },
  price: {
    fontSize: ms(14),
    fontWeight: "700",
    color: "#1A1D29",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
  },
  rating: {
    fontSize: ms(12),
    color: "#3C4257",
  },
  category: {
    fontSize: ms(12),
    color: "#8A8F98",
    textTransform: "capitalize",
  },
  stock: {
    fontSize: ms(12),
    fontWeight: "600",
  },
  favoriteSlot: {
    justifyContent: "flex-start",
    paddingLeft: ms(4),
  },
});
