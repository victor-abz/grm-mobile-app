# Installation
- Have node js >=18
- Install packages using `yarn`
<!-- - Run the project as `yarn start` -->
- Modify `node_modules/expo-modules-core/android/build.gradle`
You need to know that every time you update this package or delete the `node_modules` folder, you need to come back and perform this action.

You'll specify the contents of the `downloadBoost` function as follows.
```
def downloadBoost = tasks.create('downloadBoost', Download) {
  dependsOn(createNativeDepsDirectories)
  def srcUrl = REACT_NATIVE_TARGET_VERSION >= 69
    // ? "https://boostorg.jfrog.io/artifactory/main/release/${BOOST_VERSION.replace("_", ".")}/source/boost_${BOOST_VERSION}.tar.gz"
    ? "https://archives.boost.io/release/${BOOST_VERSION.replace("_", ".")}/source/boost_${BOOST_VERSION}.tar.gz"
    : "https://github.com/react-native-community/boost-for-react-native/releases/download/v${BOOST_VERSION.replace("_", ".")}-0/boost_${BOOST_VERSION}.tar.gz"
  src(srcUrl)
  onlyIfNewer(true)
  overwrite(false)
  dest(new File(downloadsDir, "boost_${BOOST_VERSION}.tar.gz"))
}
```
- `yarn android`


# Configuration URL

URLs for CouchDB Database
`src/utils/databaseManager.js`

URL for Web App
`src/services/API.js`

# Development 
- `export NODE_OPTIONS=--openssl-legacy-provider`
<!-- - `expo start` -->
- `rm -rf package-lock.json`
- `rm -rf yarn.lock`
- `yarn install`
- Modify `node_modules/expo-modules-core/android/build.gradle`
You need to know that every time you update this package or delete the `node_modules` folder, you need to come back and perform this action.

You'll specify the contents of the `downloadBoost` function as follows.
```
def downloadBoost = tasks.create('downloadBoost', Download) {
  dependsOn(createNativeDepsDirectories)
  def srcUrl = REACT_NATIVE_TARGET_VERSION >= 69
    // ? "https://boostorg.jfrog.io/artifactory/main/release/${BOOST_VERSION.replace("_", ".")}/source/boost_${BOOST_VERSION}.tar.gz"
    ? "https://archives.boost.io/release/${BOOST_VERSION.replace("_", ".")}/source/boost_${BOOST_VERSION}.tar.gz"
    : "https://github.com/react-native-community/boost-for-react-native/releases/download/v${BOOST_VERSION.replace("_", ".")}-0/boost_${BOOST_VERSION}.tar.gz"
  src(srcUrl)
  onlyIfNewer(true)
  overwrite(false)
  dest(new File(downloadsDir, "boost_${BOOST_VERSION}.tar.gz"))
}
```
- `yarn android`


# Build the App
Build the app for android
- `eas build -p android --profile preview`

- `eas build:run -p android --latest`

# Update Version

## 2025.03.06 Updating Project expo 43 to expo 47

1. Make sure that the Git repository you are going to clone is with expo 43
- `git clone -b deploy https://github.com/Corasec/grm-mobile.git`
- `cd grm-mobile`
- `yarn add react-native@0.68.2`
- `yarn add react-dom@18.0.0`
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

## Convert React Native Expo 47 to React Native Eject

1. Make sure you keep a version of the current project to come back to in case of ejection problems.

2. Eject your project
- `expo eject`

For versions less than or equal to expo 47, you probably encounter a problem related to the “boost_1_76_0.tar.gz” file when executing the `yarn android` command, you need to follow the steps below to solve this problem (Good luck).

[Guide to solving the problem](https://github.com/expo/expo/issues/26302#issuecomment-1881188095)

3. Install `patch-package`
- `yarn add patch-package postinstall-postinstall`

4. Modify `node_modules/expo-modules-core/android/build.gradle`
You need to know that every time you update this package or delete the `node_modules` folder, you need to come back and perform this action.

You'll specify the contents of the `downloadBoost` function as follows.
```
def downloadBoost = tasks.create('downloadBoost', Download) {
  dependsOn(createNativeDepsDirectories)
  def srcUrl = REACT_NATIVE_TARGET_VERSION >= 69
    // ? "https://boostorg.jfrog.io/artifactory/main/release/${BOOST_VERSION.replace("_", ".")}/source/boost_${BOOST_VERSION}.tar.gz"
    ? "https://archives.boost.io/release/${BOOST_VERSION.replace("_", ".")}/source/boost_${BOOST_VERSION}.tar.gz"
    : "https://github.com/react-native-community/boost-for-react-native/releases/download/v${BOOST_VERSION.replace("_", ".")}-0/boost_${BOOST_VERSION}.tar.gz"
  src(srcUrl)
  onlyIfNewer(true)
  overwrite(false)
  dest(new File(downloadsDir, "boost_${BOOST_VERSION}.tar.gz"))
}
```

5. Create patch
You need to run `npx patch-package expo-modules-core` to create the patch which will be applied. This will generate a patch file in the `patches/` folder in your project.

6. Add `postinstall` script to `package.json`
You need to app the following script into your `package.json`
```
"scripts": {
     "postinstall": "patch-package"
}
```

7. Start the project 
- `yarn android`

If you encounter any problems, follow these steps to clean and reinstall packages
- `rm -rf node_modules`
- `rm -rf package-lock.json`
- `yarn cache clean`
- `rm -rf yarn.lock`
- `yarn install`
- `Do step 4`
- `yarn android`