# Authentication Module Documentation

This document describes the authentication system used by the GRM API.

## Overview

The GRM API uses token-based authentication for all requests. All authenticated endpoints require a valid access token in the request headers.

## Authentication Flow

### 1. Register

To create a new account, send a POST request to the register endpoint:

```
POST /authentication/register/
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "securePassword",
  "confirm_password": "securePassword",
  "phone_number": "323243..."
}
// ... other registration fields
```

### 2. Validate Code (Facilitator Credentials)

For facilitators, validate credentials with a code:

```
POST /authentication/facilitator-credentials/update/
Content-Type: application/json

{
  "code": "verificationCode",
  // ... other fields
}
```

### 3. Login

To authenticate, send a POST request to the login endpoint with your credentials:

```
POST /authentication/login/
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "securePassword"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "user-123",
  "username": "user@example.com",
  "message": "Success message"
}
```

### 4. Fetch Facilitator Profile

Retrieve the current facilitator profile:

```
GET /authentication/facilitator-profile/
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**

```json
{
  "id": 1,
  "user": {
    "id": 1,
    "name": "John Doe"
  },
  "administrative_region": {
    "id": 2,
    "name": "ALIBORI",
    "administrative_level": 5,
    "parent": 5
  },
  "unique_region": true,
  "village_secretary": false,
  "created_date": "Profile creation timestamp",
  "updated_date": "Profile last update timestamp"
}
```

## Request Headers

All authenticated requests must include the access token:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

## Token Storage

Tokens should be stored securely in your client application. Consider using:

- **Secure storage** (e.g., Keychain on iOS, Keystore on Android) for production
- **Encrypted local storage** for development environments
- **Memory only** for short-lived sessions

## Error Responses

### 400 Bad Request - Validation Failed

```json
{
  "error": "Error message describing the validation issue",
  "details": {
    "description": ["Field-specific validation errors"]
  }
}
```

### 401 Unauthorized

```json
{
  "detail": "Invalid token"
}
```

### 403 Forbidden

```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 500 Internal Server Error

```json
{
  "message": "An error occurred while registering the citizen."
}
```

## Session Management

- Handle 401 errors by redirecting to login

## Security Best Practices

1. Never store tokens in localStorage without encryption
2. Use HTTPS for all API requests
3. Implement proper error handling for authentication failures
4. Clear tokens on logout

## Service Integration

The `authService.js` module provides helper functions for common authentication operations:

```javascript
// Register new user
await authService.register({ email, password });

// Validate facilitator code
await authService.validateCode({ code });

// Login
const result = await authService.fetchAuthCredentials({ email, password });

// Fetch facilitator profile
const profile = await authService.fetchFacilitatorProfile();

// Check if token is valid
const tokenStatus = await authService.checkToken();

// Refresh access token
await authService.refreshToken();

// Logout (removes session from storage)
await authService.logout();
```

## Related Documentation

- [API Overview](./api.md) - Complete API reference
- [Error Handling](./errors.md) - Error codes and responses
