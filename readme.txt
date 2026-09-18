Product Pulse
=============

Android product catalog app built with Expo + Expo Router, TypeScript, Redux
Toolkit / RTK Query, redux-persist, and expo-notifications. Talks to the
DummyJSON API (https://dummyjson.com).

Setup
-----
npm install
npx expo prebuild --platform android

Run it
------
npx expo run:android

Needs an Android emulator or device running, JDK 17, and ANDROID_HOME set.

Typecheck / lint / test
------------------------
npm run typecheck
npm run lint
npm test

Release build
--------------
npx expo prebuild --platform android --clean
npx expo run:android --variant release
adb install -r android/app/build/outputs/apk/release/app-release.apk

Uses the debug keystore that comes with the RN template, so it installs
straight away, no signing setup needed. Tested with Metro stopped and Expo Go
uninstalled to make sure it actually runs standalone.

Deep link testing
------------------
adb shell am start -W -a android.intent.action.VIEW -d "productpulse://products/12" com.tejpreet.productpulse

- Foreground (app already open): opens product 12, back goes to the list
- Background (press Home first): same
- Terminated (adb shell am force-stop com.tejpreet.productpulse first): same
- Bad id (productpulse://products/abc): shows the not-found screen, no crash
- Unknown id (productpulse://products/99999): shows the product detail 404 state
- Bad route (productpulse://nonsense): not-found screen, no crash

Notification testing
----------------------
1. Open a product, tap Set reminder, pick "In 1 minute"
2. Background the app (or force-stop it) and wait about a minute
3. Tap the notification - should open straight to that product, whether the
   app was foregrounded, backgrounded, or fully closed

Project structure
-------------------
app/
  _layout.tsx        redux provider, persistence gate, notification routing
  +not-found.tsx
  +native-intent.tsx
  (tabs)/            Products, Favorites, Reminders
  products/[id].tsx
src/
  api/               RTK Query endpoints + types
  store/             redux slices, persisted store
  notifications/     everything that touches expo-notifications
  components/        ProductCard, CategoryFilter, ReminderSheet, etc
  lib/               validation, formatting, scaling helpers
