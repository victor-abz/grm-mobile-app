# Installation
- Have node js >=18
- Install packages using `yarn`
<!-- - Run the project as `yarn start` -->
- `yarn android`


# Configuration URL

URLs for CouchDB Database
`src/utils/databaseManager.js`

URL for Web App
`src/services/API.js`

# Development 
<!-- - `export NODE_OPTIONS=--openssl-legacy-provider` -->
<!-- - `expo start` -->
- `rm -rf package-lock.json`
- `rm -rf yarn.lock`
- `yarn install`
- `yarn android`


# Build the App
Build the app for android (Make sure the project runs correctly)
<!-- - `eas build -p android --profile preview`
- `eas build:run -p android --latest` -->
- `cd android`
- `.\gradlew clean`
- `.\gradlew assembleRelease`
- You'll find the release app `app-release.apk` file on the `android\app\build\outputs\apk\release` folder



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



## Convert React Native Expo 47 to React Native Eject

1. Make sure you keep a version of the current project to come back to in case of ejection problems.

2. Eject your project
- `expo eject`

For versions less than or equal to expo 47, you probably encounter a problem related to the `boost_1_76_0.tar.gz` file when executing the `yarn android` command, you need to follow the steps below to solve this problem (Good luck).

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



## 2025.03.07 Updating Project React Native EJect with Expo 47 to React Native EJect with Expo 51

1. Make sure that the Git repository you are going to clone is with React Native EJect with Expo 47 And have a node version of at least 18. Execute the following commands : 
- `git clone -b update_react_native_expo_47_to_react_native_eject https://github.com/Corasec/grm-mobile.git`
- `cd grm-mobile`
- `rm -rf patches/expo-modules-core+1.1.1.patch`. This is to delete the configuration linked to Expo version 47 or lower
- `yarn install`
- `yarn add expo@^51.0.0`
- `npx expo install --fix`
- `yarn add react-native@0.74.5`
- `yarn add react-dom@18.2.0`
- `yarn add react@18.2.0 react-dom@18.2.0 react-native@0.74.5`
- `npx expo install --fix`
- `yarn add pouchdb@^7.3.0 pouchdb-adapter-asyncstorage@https://github.com/e3tools/pouchdb-adapter-asyncstorage pouchdb-authentication@^1.1.3 pouchdb-find@^7.3.0 pouchdb-react-native@https://github.com/e3tools/pouchdb-react-native pouchdb-upsert@^2.2.0`
- `yarn add react-native-gradle-plugin react-native-svg-transformer@^1.3.0 metro`

2. Configuring gradle fihciers in `android` to adapt to SDK expo 51. 
- Modify your `android/gradle/wrapper/gradle-wrapper.properties` file like this : 
```
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.8-all.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```
- Change your `android/build.gradle` file like this : 

```
buildscript {
    ext {
        buildToolsVersion = findProperty('android.buildToolsVersion') ?: '31.0.0'
        minSdkVersion = Integer.parseInt(findProperty('android.minSdkVersion') ?: '21')
        compileSdkVersion = Integer.parseInt(findProperty('android.compileSdkVersion') ?: '31')
        targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '31')
        if (findProperty('android.kotlinVersion')) {
            kotlinVersion = findProperty('android.kotlinVersion')
        }
        frescoVersion = findProperty('expo.frescoVersion') ?: '2.5.0'

        if (System.properties['os.arch'] == 'aarch64') {
            // For M1 Users we need to use the NDK 24 which added support for aarch64
            ndkVersion = '24.0.8215888'
        } else {
            // Otherwise we default to the side-by-side NDK version from AGP.
            ndkVersion = '21.4.7075529'
        }
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath('com.android.tools.build:gradle:7.2.1')
        classpath('com.facebook.react:react-native-gradle-plugin')
        classpath('de.undercouch:gradle-download-task:5.0.1')
        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
    }
}
```
to 
```
buildscript {
    ext {
        buildToolsVersion = findProperty('android.buildToolsVersion') ?: '34.0.0'
        minSdkVersion = Integer.parseInt(findProperty('android.minSdkVersion') ?: '23')
        compileSdkVersion = Integer.parseInt(findProperty('android.compileSdkVersion') ?: '34')
        targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '34')
        kotlinVersion = findProperty('android.kotlinVersion') ?: '1.9.23'
        
        frescoVersion = findProperty('expo.frescoVersion') ?: '2.5.0'

        if (System.properties['os.arch'] == 'aarch64') {
            // For M1 Users we need to use the NDK 24 which added support for aarch64
            ndkVersion = '24.0.8215888'
        } else {
            // Otherwise we default to the side-by-side NDK version from AGP.
            ndkVersion = '21.4.7075529'
        }
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath('com.android.tools.build:gradle')
        classpath('com.facebook.react:react-native-gradle-plugin')
        classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
        classpath('de.undercouch:gradle-download-task:5.0.1')

        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
    }
}
```




3. Modify `metro.config.js` file like this
```
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
  };

  return config;
})();
```

4. Cleaning and reinstalling dependencies
- `rm -rf node_modules`
- `rm -rf package-lock.json`
- `yarn cache clean`
- `rm -rf android/.gradle/caches/`
- `rm -rf yarn.lock`
- `yarn install`

5. Execute this command to build dependencies
- `npx expo prebuild --clean`

6. Start the project 
- `yarn android`
If you receive this message : `CommandError: No development build (com.setcobj.grmapp) for this project is installed. Please make and install a development build on the device first.`, this is not an execution abort error, but just a reminder that an application (your current application) is not installed on your laptop. In our case, with the `yarn android` command, the application will be installed within a few seconds of the message being displayed.