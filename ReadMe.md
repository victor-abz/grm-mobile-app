# GRM Mobile App

## Build and Release Guide

### Prerequisites

- Node.js (v16 or later)
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- For iOS builds:
  - macOS computer
  - Xcode installed
  - Apple Developer account
- For Android builds:
  - Android Studio (for development)
  - Java Development Kit (JDK)

### Initial Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

3. Configure your development environment:
   ```bash
   eas build:configure
   ```

### Building the App

#### Development Builds

Development builds include the Expo development client and are useful for testing:

```bash
# For Android
eas build --platform android --profile development

# For iOS Simulator
eas build --platform ios --profile development

# For iOS Device
eas build --platform ios --profile development --local
```

#### Preview/Staging Builds

Preview builds are internal distribution builds for testing:

```bash
# For Android APK
eas build --platform android --profile preview

# For iOS (Internal Distribution)
eas build --platform ios --profile preview
```

#### Production Builds

Production builds for internal distribution:

```bash
# For Android APK
eas build --platform android --profile production

# For iOS (Internal Distribution)
eas build --platform ios --profile production
```

### OTA Updates

The app is configured to receive over-the-air (OTA) updates from our xavia-ota server at `https://egrm-updates.victor-abz.com`.

#### Creating an Update

1. Make your changes to the app code

2. Export the update bundle:
   ```bash
   expo export
   ```

3. The update bundle will be created in the `dist` directory

4. Upload the bundle to the xavia-ota server for the appropriate channel:
   - development: For development builds
   - staging: For preview builds
   - production: For production builds

#### Update Channels

- Development builds receive updates from the development channel
- Preview builds receive updates from the staging channel
- Production builds receive updates from the production channel

### Installing Builds

#### Android

1. Download the APK file from the EAS build output
2. Transfer the APK to your Android device
3. Open the APK file on your device to install

#### iOS (Internal Distribution)

1. Download the IPA file from the EAS build output
2. Use Apple TestFlight or a mobile device management (MDM) solution to install on devices
3. Alternatively, use platforms like Diawi or Firebase App Distribution to distribute the IPA

### Troubleshooting

- If builds fail, check the EAS build logs for detailed error messages
- For iOS builds, ensure your Apple Developer account has the necessary certificates and provisioning profiles
- For OTA updates not working:
  - Check internet connectivity
  - Verify the update channel matches your build profile
  - Ensure the xavia-ota server is accessible

### Version Management

- App version is managed in app.json
- Build numbers are auto-incremented for production builds
- OTA updates can modify the JS bundle but cannot change native code

### Installation
1. Install packages using `yarn`
1. Run the porject as `expo start`

### Configuration URL

URLs for CouchDB Database
`src/utils/databaseManager.js`

URL for Web App
`src/services/API.js`

### Development 
`expo start`
### Build the App
Build the app for android
`eas build -p android --profile preview `

`eas build:run -p android --latest`
