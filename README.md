# Installation
- Have node js >=18
- Install packages using `yarn`
- Run the project as `yarn start`

# Configuration URL

URLs for CouchDB Database
`src/utils/databaseManager.js`

URL for Web App
`src/services/API.js`

# Development 
- `export NODE_OPTIONS=--openssl-legacy-provider`
- `expo start`
# Build the App
Build the app for android
- `eas build -p android --profile preview`

- `eas build:run -p android --latest`

# Update Version

## 2025.03.06 Updating Project expo 43 to expo 47

1. Make sure that the Git repository you are going to clone is with expo 43
- `git clone -b deploy https://github.com/Corasec/grm-mobile.git`
- `cd grm-mobile`
- `yarn install`
- `npx expo install expo@~47.0.0`
- `npx expo install --fix`
- `yarn add react@18.0.0 react-dom@18.0.0 react-native@0.68.2`
- `npx expo install --fix`

2. For reasons of incompatibility, we have changed the method of using the code field by deleting the “react-native-code-input” library and installing the “react-native-confirmation-code-field@^7.3.1” library.
- `yarn remove react-native-code-input`
- `yarn add react-native-confirmation-code-field@^7.3.1`

3. We had changed the following file as follows: [SignUp.js](https://github.com/Corasec/grm-mobile/blob/update_project_expo_43_to_expo_47/src/screens/Auth/SignUp/SignUp.js)

4. We had also installed the “react-i18next” library for translation management.
- `yarn add react-i18next@^12.2.0`

5. Cleaning and reinstalling dependencies
- `rm -rf node_modules`
- `rm -rf package-lock.json`
- `yarn cache clean`
- `rm -rf yarn.lock`
- `yarn install`

6. Start the project (Make sure the old Expo application on your laptop is uninstalled before running this command)
- `expo start -c`