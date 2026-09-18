import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { productsApi } from "../api/productsApi";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import favoritesReducer from "./favoritesSlice";
import reminderReducer from "./remindersSlice";

const persistedFavoritesReducer = persistReducer(
  { key: "favorites", version: 1, storage: AsyncStorage },
  favoritesReducer,
);

const persistedRemindersReducer = persistReducer(
  { key: "reminders", version: 1, storage: AsyncStorage },
  reminderReducer,
);

export const store = configureStore({
  reducer: {
    [productsApi.reducerPath]: productsApi.reducer,
    favorites: persistedFavoritesReducer,
    reminder: persistedRemindersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(productsApi.middleware),
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
