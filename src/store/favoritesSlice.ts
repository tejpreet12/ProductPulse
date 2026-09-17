import { ProductListItem } from "@/api/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./index";

export type FavoriteRecord = Pick<
  ProductListItem,
  | "id"
  | "title"
  | "thumbnail"
  | "price"
  | "rating"
  | "category"
  | "availabilityStatus"
> & { addedAt: number };

export function toFavoriteRecord(product: ProductListItem): FavoriteRecord {
  const { id, title, thumbnail, price, rating, category, availabilityStatus } =
    product;
  return {
    id,
    title,
    thumbnail,
    price,
    rating,
    category,
    availabilityStatus,
    addedAt: Date.now(),
  };
}

type FavoritesState = {
  items: FavoriteRecord[];
};

const initialState: FavoritesState = { items: [] };

const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    toggled: (state, action: PayloadAction<FavoriteRecord>) => {
      const exists = state.items.some((item) => item.id === action.payload.id);
      state.items = exists
        ? state.items.filter((item) => item.id !== action.payload.id)
        : [...state.items, action.payload];
    },
    removed: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});
export const favoritesActions = favoritesSlice.actions;
export default favoritesSlice.reducer;

export const selectFavorites = (state: RootState) => state.favorites.items;

export const selectIsFavorite = (id: number) => (state: RootState) =>
  state.favorites.items.some((item) => item.id === id);
