### Installation
- Have node js >=18
- Install packages using `yarn`
- Run the project as `yarn start`

### Configuration URL

URLs for CouchDB Database
`src/utils/databaseManager.js`

URL for Web App
`src/services/API.js`

### Development 
`export NODE_OPTIONS=--openssl-legacy-provider`
`expo start`
### Build the App
Build the app for android
`eas build -p android --profile preview`

`eas build:run -p android --latest`
