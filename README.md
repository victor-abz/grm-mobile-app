# grm-mobile

An Android application built with React Native for managing data and interacting of GRM project.
This mobile app provides offline and online mode.

## 💻 Technologies Used

  * **React Native**
  * **Expo**
  * **Node.js**

-----

## 🚀 Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have the following installed on your machine:

  * **Node.js:** Version 18 or higher is required.
  * **Yarn:** A package manager for Node.js to install packages 
    
### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/Corasec/grm-mobile.git
    cd grm-mobile
    ```

2.  Install the project dependencies:

    ```bash
    yarn install
    ```

3.  Run the application on an Android emulator or a connected device:

    ```bash
    yarn android
    ```

    If you see the `CommandError` about the development build not being installed, this is expected. The `yarn android` command will handle the installation automatically.

### Configuration

You need to configure the database and API endpoints before running the app.

  * **CouchDB URL:** Update the database URL in `src/db/databaseManager.js`.
  * **Web App URL:** Update the API URL in `src/services/API.js`.

-----

## 🛠️ Development

When adding new features or functionalities, follow these best practices for a clean and scalable codebase.

  * **Scaffolding:** Use the following consistent folder structure to maintain a clear and organized project architecture.

URLs for CouchDB Database
`src/db/databaseManager.js`

```
src/
├── components/          # Shared, reusable UI components
├── db/                  # Database management, e.g., databaseManager.js
├── migrations/          # Database schema migrations
│   └── v1/
│       └── <schema_name>.ts # Define schemas here (e.g., export interface schema { ... })
├── repositories/        # Data access layer
│   ├── local/           # Local repositories for SQLite
│   │   ├── BaseLocalRepository.js
│   │   └── ...
│   └── remote/          # Remote repositories for API calls
│       ├── BaseRemoteRepository.js
│       └── ...
├── router/              # Navigation and route configuration
│   ├── public.js
│   └── private.js
├── screens/             # Top-level screen components
│   └── ScreenName/
│       ├── containers/
│       │   ├── Content.js
│       │   └── ContentStyle.js
│       ├── Screen.js    # The main screen component (e.g., <SafeAreaView><Content /></SafeAreaView>)
│       └── ScreenStyles.js
├── services/            # Business logic and shared functionality
│   └── shared/
│       └── ...
├── store/               # State management setup
├── translations/        # Internationalization files
└── utils/               # Helper functions and utilities
```

Versión de la Aplicación: Para facilitar el reporte y la depuración de errores, asegúrate de que cada pantalla muestre la versión de la aplicación y de la base de datos en el siguiente formato: v <versión de la app> - <versión de la DB>.
### Common Development Tasks

  * **Clean and reinstall dependencies:** If you encounter dependency issues, run the following commands in order:

    ```bash
    rm -rf node_modules package-lock.json yarn.lock
    yarn cache clean
    yarn install
    ```

  * **Prebuild the project:** Use this command to ensure native dependencies are properly linked.

    ```bash
    npx expo prebuild --clean
    ```

-----
## 🤝 Support

To facilitate bug reporting and debugging, ensure that each screen displays the app version and database version in the following format:
       
`v <app version> - <DB version>`

-----

## 📦 Building the App

Follow these steps to generate a release APK file for Android.

1.  Ensure the project runs correctly in the development environment (`yarn android`).
2.  Clean the project's dependencies:
    ```bash
    rm -rf package-lock.json yarn.lock
    yarn install
    npx expo prebuild --clean
    ```
3.  Navigate to the Android directory and clean the Gradle build:
    ```bash
    cd android
    ./gradlew clean
    ```
4.  Build the release APK:
    ```bash
    ./gradlew assembleRelease
    ```
5.  The final `app-release.apk` file will be located in the `android/app/build/outputs/apk/release` folder.

-----

## 📜 Version Updates

This section details the steps taken for major project updates. It serves as a historical record and a guide for future upgrades.


### 2025.03.06 Updating Project expo 43 to expo 47

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



### Convert React Native Expo 47 to React Native Eject

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
You need to add the following script into your `package.json`
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


### 2025.03.07 Updating Project React Native EJect with Expo 47 to React Native EJect with Expo 51

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

2. Configuring gradle files in `android` to adapt to SDK expo 51. 
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




3. Modify `metro.config.ts` file like this
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

4. Cleaning dependencies
- `rm -rf node_modules`
- `rm -rf package-lock.json`
- `yarn cache clean`
- `rm -rf android/.gradle/caches/`
- `rm -rf yarn.lock`

5. Installing dependencies
- `yarn install`

6. Execute this command to build dependencies
- `npx expo prebuild --clean`
- Change your `android/build.gradle` file like recommanded in step 2

7. Start the project 
- `yarn android`

If you receive this message : `CommandError: No development build (com.setcobj.grmapp) for this project is installed. Please make and install a development build on the device first.`, this is not an execution abort error, but just a reminder that an application (your current application) is not installed on your laptop. In our case, with the `yarn android` command, the application will be installed within a few seconds of the message being displayed.

