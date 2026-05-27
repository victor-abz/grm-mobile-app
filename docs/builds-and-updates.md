# Builds & OTA Updates

## Version Management

All version info is controlled from **one file**: `app.config.js` (lines 4-5).

```js
const APP_VERSION = '1.2.0';   // Bump for new releases
const BUILD_NUMBER = 1;         // Increment for same-version rebuilds
```

- `APP_VERSION` sets the app version, runtime version, and OTA compatibility
- `BUILD_NUMBER` is shown in the UI as `v1.2.0 (1)` and maps to Android `versionCode` / iOS `buildNumber`
- The version displays on: onboarding screen, login screen, and profile screen

**Do NOT edit version/runtimeVersion in `app.json`** — they are managed by `app.config.js`.

### When to bump what

| Scenario | Change |
|----------|--------|
| New feature release | Bump `APP_VERSION` (e.g. 1.2.0 → 1.3.0), reset `BUILD_NUMBER` to 1 |
| Bug fix release | Bump patch (e.g. 1.2.0 → 1.2.1), reset `BUILD_NUMBER` to 1 |
| Rebuild same version | Increment `BUILD_NUMBER` (e.g. 1 → 2) |
| JS-only OTA update | No version change needed — just publish the update |

### Runtime version compatibility

OTA updates only apply to builds with the **same `APP_VERSION`**. If you change `APP_VERSION`, you must create a new native build — old builds won't receive the new OTA updates.

---

## Prerequisites

```bash
# Install EAS CLI (one-time)
npm install -g eas-cli

# Login to Expo (one-time)
eas login
```

---

## Building the App

### Preview Build (for testing)

Produces an APK you can install directly on devices or emulators.

```bash
# Android APK
eas build -p android --profile preview

# iOS (internal distribution)
eas build -p ios --profile preview
```

### Production Build

```bash
# Android APK
eas build -p android --profile production

# iOS
eas build -p ios --profile production
```

### Development Build (dev client with hot reload)

```bash
# Android
eas build -p android --profile development

# Install on emulator
eas build:run -p android --latest
```

### After build completes

The CLI prints a download URL. To install on an Android emulator:

```bash
# Download the APK
curl -L -o app.apk <APK_URL_FROM_BUILD>

# Install on connected device/emulator
adb install app.apk
```

---

## OTA Updates

OTA (Over-The-Air) updates push JS bundle changes to installed apps **without requiring a new build**. This works for any code/asset changes that don't modify native modules.

### Publishing an update

```bash
# To the development channel (preview builds receive this)
eas update --channel development --message "Description of changes"

# To the production channel
eas update --channel production --message "Description of changes"
```

### How updates are received

- The app checks for updates **on every launch** (`checkAutomatically: "ON_LOAD"` in config)
- If an update is found, a dialog prompts the user to update now or later
- In dev builds (`__DEV__`), update checking is disabled

### Channel → Branch → Build mapping

| Build Profile | Channel | Who receives updates |
|--------------|---------|---------------------|
| preview | development | Internal testers |
| production | production | End users |
| development | development | Dev client (OTA disabled) |

### Managing branches and channels

```bash
# List updates on a branch
eas update:list --branch development

# Create a new branch (if needed)
eas branch:create <branch-name>

# Map a channel to a branch
eas channel:edit <channel-name> --branch <branch-name>
```

---

## Common Workflows

### 1. Deploy a JS-only fix to testers

```bash
# Make your code changes, then:
eas update --channel development --message "Fix: description of fix"
```

Testers relaunch the app → update dialog appears → they tap "Update Now".

### 2. Release a new version

```bash
# 1. Bump version in app.config.js
#    APP_VERSION = '1.3.0'
#    BUILD_NUMBER = 1

# 2. Build new native app
eas build -p android --profile production

# 3. Publish initial OTA update for this version
eas update --channel production --message "v1.3.0: Initial release"

# 4. Distribute the APK to users
```

### 3. Hotfix an existing release

If the fix is JS-only (no native module changes):

```bash
# Just publish an OTA update — no new build needed
eas update --channel production --message "v1.3.0: Fix login error"
```

If the fix requires native changes:

```bash
# Bump build number in app.config.js
#    BUILD_NUMBER = 2

# Build and distribute new APK
eas build -p android --profile production
```

### 4. Self-hosted OTA (future)

To use a self-hosted OTA server instead of Expo's:

```bash
# Set in .env
EXPO_PUBLIC_UPDATES_URL=https://your-ota-server.com/api/manifest
```

The recommended self-hosted option is [Xavia OTA](https://github.com/nicepkg/xavia) which can be deployed on Coolify as a Docker container.

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `APP_VARIANT` | eas.json per profile | Sets app name suffix (Dev/Preview) |
| `EXPO_PUBLIC_FRAPPE_BASE_URL` | eas.json / .env | Backend API URL |
| `EXPO_PUBLIC_DEFAULT_LANGUAGE` | eas.json / .env | Default language (rw/en/fr) |
| `EXPO_PUBLIC_UPDATES_URL` | .env (optional) | Custom OTA server URL |

---

## Troubleshooting

### Build fails with "Gradle build failed"
- Run `npx expo install --check` to find version mismatches
- Run `npx expo install --fix` to auto-fix compatible versions

### OTA update not received
- Verify the app's runtime version matches the update's runtime version
- OTA is disabled in dev client builds (`__DEV__ === true`)
- Check channel mapping: `eas channel:view <channel-name>`

### "Module not found" crash on launch
- A native module is missing from the build — you need a new native build, not just an OTA update
- Check `app.json` plugins array includes all required native modules

### Version shows wrong number
- Only edit `app.config.js` lines 4-5 for version changes
- `app.json` should NOT have `version` or `runtimeVersion` fields
