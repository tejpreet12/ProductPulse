# Product Pulse — Implementation Plan (48-hour assignment)

## Context

`docs/dc84bddd-...pdf` is a final-round React Native technical assignment: build **Product Pulse**, an Android product catalog on `https://dummyjson.com`, using Expo + Expo Router + TypeScript (strict) + Redux Toolkit/RTK Query + AsyncStorage + expo-notifications, ending in an installable standalone APK. Deadline is 48 hours.

Current repo state: a **blank Expo SDK 57 template** — `expo ~57.0.22`, `react-native 0.86.3`, `react 19.2.3`, `typescript ~6.0.3`, a single `App.tsx`, `index.ts`, and `tsconfig.json` with `strict: true`. Nothing from the assignment exists yet.

Two constraints shape this plan:
1. **You have React Native CLI experience but limited Expo experience.** Every Expo-specific API below was verified against the SDK 57 versioned docs (per `AGENTS.md`) so you are not looking things up mid-flow.
2. **The code must be hand-written.** This plan is therefore a *sequenced build spec*: per-file responsibilities, exact API signatures, and the gotchas — not code to paste. You type it. If you want me to write a specific file, ask for that file.

Decisions already made with you: **local gradle release APK**, **Android emulator** for dev, **preset reminder buttons** (no datetime picker dependency).

**Start at Phase 0.** Every command is copy-pasteable, and each phase ends with a concrete "done when" check.

---

## The single most important scheduling decision

`productpulse://` deep links **do not work in Expo Go** (Expo Go owns `exp://`). Notification channels and a real APK also need native code.

So: **install every native dependency in Phase 0, then run `npx expo run:android` exactly once.** After that one native build, everything in Phases 1–7 is JS-only with Fast Refresh. If you install a native module later, you pay another 5–15 minute rebuild. Don't drip-feed dependencies.

---

## Phase 0 — Project skeleton + the one native build (~1.5h)

### 0.1 Install all dependencies in one shot

```sh
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants
npx expo install expo-notifications @react-native-async-storage/async-storage
npm install @reduxjs/toolkit react-redux
```

That is the complete native surface. `expo-status-bar` is already present. Skip `expo-device` (only needed for push, not local notifications). Skip `expo-image` and `@react-native-community/datetimepicker` — not needed, and each costs a rebuild.

### 0.2 Switch the entry point to Expo Router

- `package.json`: change `"main": "index.ts"` → `"main": "expo-router/entry"`.
- **Delete `App.tsx` and `index.ts`.** Expo Router replaces both.
- Add scripts: `"lint": "expo lint"`, `"typecheck": "tsc --noEmit"`.

### 0.3 `app.json`

Add to the `expo` object (keep the existing icon/adaptiveIcon block):

```jsonc
{
  "scheme": "productpulse",
  "plugins": [
    "expo-router",
    ["expo-notifications", { "color": "#1F6FEB", "defaultChannel": "reminders" }]
  ],
  "experiments": { "typedRoutes": true },
  "android": {
    "package": "com.tejpreet.productpulse"
    // ...keep adaptiveIcon and predictiveBackGestureEnabled
  }
}
```

`android.package` is **required** for a local gradle build — prebuild fails without it. The `expo-notifications` plugin auto-adds the `POST_NOTIFICATIONS` permission, so do not hand-edit the manifest.

### 0.4 `tsconfig.json`

```jsonc
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

Run `npx expo customize tsconfig.json` if you'd rather have Expo write the `include` block for typed routes.

### 0.5 Lint

```sh
npx expo lint     # scaffolds eslint.config.js + eslint-config-expo on first run
```

Do this now, not at the end — the submission checklist requires lint to pass, and live editor feedback is free.

### 0.6 Directory skeleton

```
app/
  _layout.tsx            # Redux Provider + SafeAreaProvider + hydration gate + notification routing
  +not-found.tsx         # safe error screen
  +native-intent.tsx     # deep-link validation (never throws)
  (tabs)/
    _layout.tsx          # Products | Favorites | Reminders
    index.tsx
    favorites.tsx
    reminders.tsx
  products/
    [id].tsx
src/
  api/          productsApi.ts, types.ts
  store/        index.ts, hooks.ts, favoritesSlice.ts, remindersSlice.ts, persistenceListener.ts
  storage/      storage.ts
  notifications/ notificationService.ts, useNotificationRouting.ts
  lib/          validation.ts, format.ts, useDebouncedValue.ts
  components/   ProductCard.tsx, SearchBar.tsx, CategoryFilter.tsx, ScreenState.tsx, FavoriteButton.tsx
  theme.ts
```

Note `unstable_settings` uses **`anchor`**, not `initialRouteName` (deprecated in this version). In `app/_layout.tsx`:

```ts
export const unstable_settings = { anchor: '(tabs)' };
```

This is what gives you a working back button when a deep link lands directly on `/products/12`.

### 0.7 The native build

```sh
npx expo prebuild --platform android
npx expo run:android            # debug variant, installs on the running emulator
```

`/android` is already gitignored — leave it that way (Expo's "continuous native generation" model). The README will tell reviewers to run `npx expo prebuild` themselves.

**Phase 0 is done when** a placeholder tab bar renders on the emulator from the native build (not Expo Go).

---

## Phase 1 — Types, store, RTK Query (~2h)

### `src/api/types.ts`

Shapes are confirmed against the live API:

```ts
// GET /products?limit&skip  ->  { products, total, skip, limit }
export interface ProductListItem {
  id: number; title: string; price: number; rating: number;
  stock: number; category: string; thumbnail: string;
  availabilityStatus: string;      // "In Stock" | "Low Stock" | "Out of Stock"
  discountPercentage: number;
}
export interface Product extends ProductListItem {
  description: string; brand?: string; images: string[];
  tags: string[]; warrantyInformation: string; shippingInformation: string;
  returnPolicy: string; sku: string;
}
export interface PaginatedProducts { products: ProductListItem[]; total: number; skip: number; limit: number; }
export interface Category { slug: string; name: string; url: string; }  // GET /products/categories
```

`GET /products/99999` returns **404** with `{ "message": "Product with id '99999' not found" }` — type that as `ApiErrorBody` and read it in the detail screen's not-found branch.

No `any` anywhere. For RTK Query errors, narrow `FetchBaseQueryError | SerializedError` with a helper in `src/lib/validation.ts`.

### `src/api/productsApi.ts`

`createApi` with `fetchBaseQuery({ baseUrl: 'https://dummyjson.com' })`, `reducerPath: 'productsApi'`, `tagTypes: ['Product']`. **Four typed endpoints**, mapping 1:1 to spec bullet 5:

| Endpoint | Args | URL | Notes |
|---|---|---|---|
| `getProducts` | `{ limit; skip; category?: string }` | `/products?limit&skip` or `/products/category/{slug}?limit&skip` | infinite-merge |
| `searchProducts` | `{ q: string; limit; skip }` | `/products/search?q&limit&skip` | infinite-merge |
| `getProductById` | `number` | `/products/{id}` | `providesTags` |
| `getCategories` | `void` | `/products/categories` | `Category[]`, long-lived cache |

**Infinite scroll pattern** (write it once in a shared helper, use it in both paginated endpoints):

```ts
serializeQueryArgs: ({ queryArgs, endpointName }) => `${endpointName}-${queryArgs.category ?? queryArgs.q ?? 'all'}`,
merge: (currentCache, newItems, { arg }) => {
  if (arg.skip === 0) return newItems;                 // pull-to-refresh replaces
  currentCache.products.push(...newItems.products);    // page append
  currentCache.total = newItems.total;
  currentCache.skip  = newItems.skip;
},
forceRefetch: ({ currentArg, previousArg }) => currentArg?.skip !== previousArg?.skip,
```

The `arg.skip === 0` branch is what stops pull-to-refresh from duplicating rows — it is the bug reviewers look for.

Export the generated typed hooks (`useGetProductsQuery`, etc.). Do not hand-write hooks.

### `src/store/index.ts`

`configureStore` with `productsApi.reducer` + `favorites` + `reminders` reducers, `.concat(productsApi.middleware)` and `.prepend(persistenceListener.middleware)`. Export `RootState` / `AppDispatch` inferred from the store. Call `setupListeners(store.dispatch)` for refetch-on-reconnect. `src/store/hooks.ts` exports pre-typed `useAppDispatch` / `useAppSelector`.

---

## Phase 2 — Product list screen (~3h)

`app/(tabs)/index.tsx` — the screen with the most spec bullets attached to it.

**Local state:** `query` (search text), `category` (`string | null`), `skip`.
**Hook selection:** debounce `query` 400ms (`useDebouncedValue`, ~8 lines). If the debounced query is non-empty use `useSearchProductsQuery`, else `useGetProductsQuery` — gate the inactive one with `{ skip: true }` so you never fire both. Reset `skip` to 0 whenever `category` or the debounced query changes.

**`FlatList`** (virtualized, as required):
- `keyExtractor={(item) => String(item.id)}` — stable keys.
- `onEndReachedThreshold={0.5}`, `onEndReached` → only advance `skip` when `!isFetching && products.length < total`. This guard is the "prevent duplicate requests" bullet.
- `refreshing={isFetching && skip === 0}`, `onRefresh` → set `skip = 0` then `refetch()`.
- `ListFooterComponent` → small spinner while `isFetching && skip > 0` (this is your visible "background fetching" state).

**`ScreenState.tsx`** — one reusable component covering four of the required states, so you write them once and reuse on all three list screens:
- `loading` (initial `isLoading`)
- `empty` (`!isLoading && products.length === 0`)
- `error` with a **Retry** button wired to `refetch()`
- inside `error`, branch on `'status' in error && error.status === 'FETCH_ERROR'` → render the **offline-like** copy ("You appear to be offline") instead of the generic message. That single branch satisfies both the "offline-like" and "retry" bullets.

**`ProductCard.tsx`** — image, title (2-line clamp), price + strikethrough original when `discountPercentage > 0`, `★ rating`, category chip, stock status from `availabilityStatus`, and a `FavoriteButton`. `accessibilityRole="button"`, `accessibilityLabel={`${title}, ${price} dollars`}`, hit target ≥ 44×44 on the heart (use `hitSlop`).

**`CategoryFilter.tsx`** — horizontal `FlatList` of chips from `useGetCategoriesQuery`, with a leading "All" chip. Use `Category.name` for the label and `Category.slug` for the request. (The spec asks for a category filter *or* a sort control — the filter alone satisfies it. Only add `?sortBy=price&order=asc` if you finish early.)

Wrap the screen in `useSafeAreaInsets` / `SafeAreaView` from `react-native-safe-area-context` — SDK 57 on Android is edge-to-edge, so content will sit under the status bar otherwise.

---

## Phase 3 — Product detail screen (~1.5h)

`app/products/[id].tsx`.

```ts
const { id } = useLocalSearchParams<{ id: string }>();
const productId = parseProductId(id);            // number | null
const { data, isLoading, error, refetch } =
  useGetProductByIdQuery(productId ?? skipToken); // never fire an invalid request
```

`parseProductId` lives in `src/lib/validation.ts` and is the function your unit tests target:

```ts
export function parseProductId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
```

Render branches: `productId === null` → not-found view; `error.status === 404` → not-found view; loading → spinner; success → content.

Content: image carousel as a horizontal `FlatList` with `pagingEnabled` over `product.images` (no carousel library needed), then description, price/discount, rating, category, stock + `availabilityStatus`, favorite toggle, and a **Set reminder** button. Set the header via `<Stack.Screen options={{ title: product.title }} />`.

---

## Phase 4 — Favorites + persistence (~2h)

### `src/storage/storage.ts`
Thin typed wrapper over AsyncStorage — `getJSON<T>(key, fallback: T): Promise<T>` and `setJSON<T>(key, value): Promise<void>`, both try/catch'd so corrupt JSON can never crash boot. Namespaced keys: `@productpulse/favorites/v1`, `@productpulse/reminders/v1`.

### `src/store/favoritesSlice.ts`
State: `{ items: FavoriteRecord[]; hydrated: boolean }`.
`FavoriteRecord = { id; title; price; thumbnail; category; rating; addedAt: number }` — storing a snapshot (not just the id) means the Favorites screen renders instantly and works with no network.
Reducers: `hydrated(records)`, `toggled(record)`, `removed(id)`. Selectors: `selectFavorites`, `selectIsFavorite(id)`.

### `src/store/persistenceListener.ts`
One `createListenerMiddleware` with two listeners — `matcher: isAnyOf(favorites.actions.toggled, favorites.actions.removed)` → write `state.favorites.items`; same shape for reminders. This is the idiomatic RTK way and keeps storage logic out of both components and reducers (the "keep storage logic separated" bullet).

### Hydration
In `app/_layout.tsx`, a `useEffect` reads both stores, dispatches `hydrated` for each, then flips a local `ready` flag. Render a full-screen spinner until `ready` — this prevents a flash of "no favorites" and prevents the persistence listener from overwriting real data with an empty array on boot.

### `app/(tabs)/favorites.tsx`
`FlatList` reusing `ProductCard`, tap → `/products/{id}`, remove action, empty state via `ScreenState`. **Verify by fully killing the app** (`adb shell am force-stop ...`) and relaunching — that is the literal wording of spec bullet 4.

---

## Phase 5 — Notifications + reminders (~2.5h)

### `src/notifications/notificationService.ts`
All expo-notifications calls live here and nowhere else.

Module scope (runs once on import):
```ts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true,
    shouldPlaySound: true, shouldSetBadge: false,
  }),
});
```
Note the SDK 57 field names — `shouldShowBanner`/`shouldShowList`, **not** the old `shouldShowAlert`.

```ts
export const REMINDER_CHANNEL_ID = 'reminders';

export async function ensureAndroidChannel(): Promise<void>
// Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
//   name: 'Product reminders',
//   importance: Notifications.AndroidImportance.HIGH,
//   vibrationPattern: [0, 250, 250, 250],
//   lightColor: '#1F6FEB',
// })
// Android 8+ requires the channel to exist BEFORE scheduling.

export async function requestNotificationPermission(): Promise<'granted' | 'denied'>
// getPermissionsAsync() first; only call requestPermissionsAsync() if not already granted.

export async function scheduleProductReminder(
  input: { productId: number; title: string; fireAt: Date }
): Promise<string>   // returns the notification identifier

export async function cancelReminder(notificationId: string): Promise<void>
export async function getScheduled(): Promise<Notifications.NotificationRequest[]>
```

`scheduleProductReminder` body:
```ts
await ensureAndroidChannel();
return Notifications.scheduleNotificationAsync({
  content: {
    title: 'Product reminder',
    body: input.title,
    data: { route: `/products/${input.productId}`, productId: input.productId },
  },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: input.fireAt,
    channelId: REMINDER_CHANNEL_ID,
  },
});
```
The `data.route` field is spec bullet 5 on page 2 — store the route, not just the id.

### Permission timing
`requestNotificationPermission()` is called **only** from the Set-reminder press handler. Never on app start — the spec calls this out explicitly and it is easy to get wrong. On denial, show a dismissible explanation with a "Open settings" affordance (`Linking.openSettings()`), which is your **permission-denied** state.

### Reminder UX (preset sheet)
A `Modal` from the detail screen with three options: **In 1 minute** (so a reviewer can actually see it fire), **In 1 hour**, **Tomorrow 9:00 AM**. Compute a `Date`, call the service, dispatch `reminders.added`.

### `src/store/remindersSlice.ts`
`ReminderRecord = { notificationId: string; productId: number; productTitle: string; route: string; scheduledAt: number; createdAt: number }`.
Reducers: `hydrated`, `added`, `removed(notificationId)`.
**Duplicate prevention:** before scheduling, look up an existing reminder for that `productId`; if one exists, cancel it first and replace. One active reminder per product.

### `app/(tabs)/reminders.tsx`
List sorted by `scheduledAt`, each row showing product title + formatted fire time + a **Cancel** button (`cancelReminder` then `removed`). Row tap → `/products/{id}`. Empty state.
On mount, reconcile: `getScheduled()` and drop any stored record whose `notificationId` is no longer scheduled (it already fired or the OS dropped it). Keeps the screen honest.

---

## Phase 6 — Deep links, safe errors, and the verification matrix (~1.5h)

### `app/+native-intent.tsx`
```ts
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const match = /^\/products\/([^/?#]+)/.exec(path);
    if (match && parseProductId(match[1]) === null) return '/unknown-link';
    return path;
  } catch {
    return '/unknown-link';
  }
}
```
Two things to know: **this function must never throw** (the docs say so explicitly), and you **cannot navigate to `+not-found` by name** — you return a path that matches no route (`/unknown-link`) and Expo Router renders `+not-found.tsx` for you.

### `app/+not-found.tsx`
Plain, friendly screen: "We couldn't find that page" + a button to `/`. This is the safe error screen the spec requires for invalid IDs and unknown routes.

### `src/notifications/useNotificationRouting.ts`
Called from `app/_layout.tsx` after hydration:

```ts
const handled = useRef<string | null>(null);

const handle = useCallback((response: Notifications.NotificationResponse) => {
  const requestId = response.notification.request.identifier;
  if (handled.current === requestId) return;        // no duplicate navigation
  handled.current = requestId;
  const route = extractRoute(response.notification.request.content.data);
  if (route) router.push(route);
}, []);

useEffect(() => {
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  Notifications.getLastNotificationResponseAsync().then(r => { if (r) handle(r); });
  return () => sub.remove();                         // required cleanup
}, [handle]);
```

`getLastNotificationResponseAsync()` covers the **terminated** cold-start case; the listener covers **background** and **foreground**. The `handled` ref covers the overlap between them — that dedupe is the "prevent duplicate navigation events" bullet, and `sub.remove()` is the "remove event listeners during cleanup" bullet.

`extractRoute(data: unknown): string | null` goes in `src/lib/validation.ts` and is your second unit-tested function — it must reject non-objects, missing `route`, non-string `route`, and any `route` that isn't `/products/<positive int>`. **Never trust notification payload data**; the spec calls this out.

### Manual verification matrix (do this, and record it in the README)

```sh
adb shell am start -W -a android.intent.action.VIEW -d "productpulse://products/12" com.tejpreet.productpulse
```

| Case | Setup | Expected |
|---|---|---|
| Foreground | app open | navigates to product 12, back returns to list |
| Background | press Home first | same |
| Terminated | `adb shell am force-stop com.tejpreet.productpulse` first | same |
| Invalid id | `productpulse://products/abc` | `+not-found`, no crash |
| Unknown id | `productpulse://products/99999` | detail screen's 404 state |
| Unknown route | `productpulse://nonsense` | `+not-found`, no crash |

Repeat all three app states for a **notification tap** using the "In 1 minute" preset. Confirm back behaviour: from a deep-linked detail screen, Android back goes to the list (this is what `unstable_settings.anchor` buys you), and back from the list exits.

---

## Phase 7 — Polish and gates (~1h)

- `npm run typecheck` → zero errors. Grep the repo for `any` and `as ` casts and remove them.
- `npm run lint` → clean.
- Accessibility sweep: `accessibilityRole` / `accessibilityLabel` on every touchable, `hitSlop` where targets are under 44px, check contrast on the price/rating text.
- Confirm safe-area insets on all four screens (edge-to-edge is on by default in SDK 57).
- Confirm no `console.log` left behind.

---

## Phase 8 — Tests (explicitly lowest priority) (~1h)

```sh
npx expo install jest-expo jest @types/jest @testing-library/react-native --dev
```
`package.json`: `"jest": { "preset": "jest-expo" }`, `"test": "jest"`. Add `"types": ["jest"]` to tsconfig `compilerOptions`.

Write these four, in this order, and stop when time runs out:
1. **`validation.test.ts`** — `parseProductId` and `extractRoute` across valid/invalid/malicious inputs. Pure functions, no mocks, highest value per minute, and directly named by the spec ("unit tests for deep-link and notification route validation").
2. **`ProductCard.test.tsx`** — renders title/price/stock; favorite press dispatches.
3. **`productsList.test.tsx`** — loading → success → error, with `global.fetch` mocked.
4. **`notificationService.test.ts`** — `jest.mock('expo-notifications')`, assert schedule returns and stores the id, and that cancel calls `cancelScheduledNotificationAsync` (the "mocked service boundaries" bullet).

If you only get #1 done, say so in the README's "what remains" section — the spec explicitly asks incomplete submissions to name the gaps.

---

## Phase 9 — Release APK + README (~1h)

```sh
npx expo prebuild --platform android --clean
npx expo run:android --variant release
```

Output: `android/app/build/outputs/apk/release/app-release.apk`. The React Native template signs release with the debug keystore, so no keystore setup is needed and the APK installs directly. The JS bundle is embedded — **verify it runs with Metro stopped and Expo Go uninstalled**, which is spec bullet 6.

Install check: `adb install -r android/app/build/outputs/apk/release/app-release.apk`.

Commit the APK to the repo (or attach it to a GitHub release) — the spec accepts a file or a reviewer-accessible link.

**`README.md` must contain**, as copy-pasteable commands: setup/install, run in dev, typecheck, lint, test, prebuild + release build, `adb install`, the deep-link test commands from the Phase 6 matrix, the notification test steps, a short project-structure tree, and an honest "Known limitations / not finished" section.

---

## Risks, and where the time actually goes

| Risk | Mitigation |
|---|---|
| First `run:android` fails (JDK/SDK/env) | Do it in Phase 0, not Phase 9. If it fails you still have ~14h to fix it. Needs JDK 17 and `ANDROID_HOME` set. |
| Infinite scroll duplicates rows | The `arg.skip === 0` branch in `merge`, plus the `!isFetching` guard on `onEndReached`. |
| Notification fires but doesn't navigate from terminated state | `getLastNotificationResponseAsync()` on mount — the listener alone does not cover cold start. |
| Time overrun | Phase 8 is the designated cut. Then the sort control. Never cut Phase 6 — deep links are ~30% of the spec's page 2. |

## Verification checklist (maps to the assignment's submission bar)

- [ ] `npm run typecheck` passes, zero `any` in `src/` and `app/`
- [ ] `npm run lint` passes
- [ ] List: pagination, pull-to-refresh, search, category filter, loading/empty/error/retry/offline states
- [ ] Detail: `/products/{id}`, images, 404 state, invalid-id state, favorite + reminder actions
- [ ] Favorites survive a force-stop and relaunch
- [ ] Reminders: permission requested only on action, channel created, id stored, list + cancel work
- [ ] Deep links verified in all 3 app states + 3 invalid cases
- [ ] Notification taps verified in all 3 app states
- [ ] Release APK installs and runs with Metro stopped
- [ ] README covers run/test/build/install/deep-link/notification commands
