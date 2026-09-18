import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./index";

export type ReminderRecord = {
  notificationId: string;
  productId: number;
  productTitle: string;
  route: string;
  scheduledAt: number;
  createdAt: number;
};

type ReminderState = {
  items: ReminderRecord[];
};

const initialState: ReminderState = { items: [] };

const reminderSlice = createSlice({
  name: "reminder",
  initialState,
  reducers: {
    added: (state, action: PayloadAction<ReminderRecord>) => {
      state.items = [
        ...state.items.filter((r) => r.productId !== action.payload.productId),
        action.payload,
      ];
    },
    removed: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (r) => r.notificationId !== action.payload,
      );
    },
    reconciled: (state, action: PayloadAction<ReminderRecord[]>) => {
      state.items = action.payload;
    },
  },
});

export const remindersActions = reminderSlice.actions;
export default reminderSlice.reducer;

export const selectReminders = (state: RootState) =>
  [...state.reminder.items].sort((a, b) => a.scheduledAt - b.scheduledAt);

export const selectReminderForProduct =
  (productId: number) => (state: RootState) =>
    state.reminder.items.find((r) => r.productId === productId);
