I want to change this current app inside `/Users/victor/Documents/dev/grm-mobile-app`  to be calling the frappe API as its backend. the mobile app should keep it's offline first capability. meaning apart from initial installation, it should work locally, and then once user gets internet it syncs data with frappe automatically. we should modify the app to work with frappe.  

I want you to 
1. Start with making the app able to login to frappe instance url: http://egrm.localhost/ 
2. We should use frappe standard API, use @https://github.com/The-Commit-Company/frappe-js-sdk for interacting with frappe backend.
3. the auth needs to be persistent for app users, so that it get refreshed regularly such as on twitter or tiktok.  consider. for persistent login, can we make this:
- User login with basic: email/phone and Password
- then we generate their user token that is going to be securely stored and then used in all communications. check this guide: 
- then once user logout, we clear the token from storage. until they login and process continue
@https://docs.frappe.io/framework/user/en/guides/integration/how_to_set_up_token_based_auth 

To setup the app to support frappe-js-sdk you shall take example of @/Users/victor/Documents/dev/doppio_mobile/App.js simple app I made on side that uses the library. You will start with setting up the providers the AuthProvider similar to @/Users/victor/Documents/dev/doppio_mobile/src/provider/auth.js and FrappeProvider @/Users/victor/Documents/dev/doppio_mobile/src/provider/backend.js this should wrapp our app and the used in our current app. 

Note if you need to install any new app, it should be compatible with our current version of expo 47.0.0.

Before you close any task ensure there are no eslint errors in the file you modified.