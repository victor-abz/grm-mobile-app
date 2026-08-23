# Error Handling Documentation

This document provides comprehensive information about error handling for the Issues API, including all HTTP status codes, their meanings, and expected response formats.

## Overview

The API uses standard HTTP status codes to indicate success or failure of requests. Each endpoint may return different error responses depending on the nature of the issue encountered.

## Error Status Codes

### 400 Bad Request

**Description:** Invalid query parameters or request body validation failed.

**When it occurs:**

- Query parameters are malformed or invalid
- Required fields are missing in request body
- Field values don't meet validation constraints (e.g., rating must be between 1-5)

**Response Format:**

```json
{
  "message": "Validation failed.",
  "errors": {
    "field_name": ["Error message for this field"]
  }
}
```

**Example:**

```json
{
  "message": "Validation failed.",
  "errors": {
    "rating": ["Ensure this value is less than or equal to 5."],
    "status": ["Invalid pk \"999\" - object does not exist."]
  }
}
```

---

### 401 Unauthorized

**Description:** Invalid or missing authentication token.

**When it occurs:**

- No authentication token provided in request headers
- Token has expired
- Token is malformed or invalid

**Response Format:**

```json
{
  "detail": "Invalid token."
}
```

---

### 403 Forbidden

**Description:** User lacks permission to perform the requested action.

**When it occurs:**

- User is not the reporter or assignee of the issue (for protected endpoints)
- User doesn't have permission to modify specific fields (e.g., status, appeal_status)
- Access control checks failed

**Response Format:**

```json
{
  "detail": "You do not have permission to perform this action."
}
```

---

### 404 Not Found

**Description:** The requested resource does not exist.

**When it occurs:**

- Issue ID doesn't exist in the system
- Resource was deleted or never created

**Response Format:**

```json
{
  "detail": "Not found."
}
```

---

### 500 Internal Server Error

**Description:** Unexpected server error occurred during request processing.

**When it occurs:**

- Database connection issues
- File upload failures
- Unexpected exceptions in business logic
- System resource exhaustion

**Response Format:**

```json
{
  "detail": "An error occurred while [action] the [resource]."
}
```

**Examples:**

```json
{
  "detail": "An error occurred while retrieving the issue."
},
{
  "detail": "An error occurred during file upload."
},
{
  "detail": "An error occurred while creating the comment."
},
{
  "detail": "An error occurred while retrieving issue attachments."
},
{
  "detail": "An error occurred while updating the issue."
}
```

---

## Endpoint-Specific Error Handling

### Authentication Endpoints

| Endpoint | Status Code | Condition | Response |
|----------|-------------|-----------|----------|
| `/login/` | 401 | Invalid credentials | `{"detail": "Invalid token."}` |
| `/password-reset/` | 400 | Invalid email format | Validation errors |

### Issue Endpoints

| Endpoint | Status Code | Condition | Response |
|----------|-------------|-----------|----------|
| `/issues/{id}/` (GET) | 401 | Missing/invalid token | `{"detail": "Invalid token."}` |
| | 403 | User not reporter/assignee | `{"detail": "You do not have permission..."}` |
| | 404 | Issue doesn't exist | `{"detail": "Not found."}` |
| | 500 | Server error | `{"detail": "An error occurred while retrieving the issue."}` |
| `/issues/{id}/update/` (PATCH) | 401 | Missing/invalid token | `{"detail": "Invalid token."}` |
| | 403 | User lacks field permission | `{"detail": "You do not have permission..."}` |
| | 404 | Issue doesn't exist | `{"detail": "Not found."}` |
| | 500 | Server error | `{"detail": "An error occurred while updating the issue."}` |

### Attachment Endpoints

| Endpoint | Status Code | Condition | Response |
|----------|-------------|-----------|----------|
| `/issues/{id}/add-attachment` (POST) | 401 | Missing/invalid token | `{"detail": "Invalid token."}` |
| | 403 | User not reporter/assignee | `{"detail": "You do not have permission..."}` |
| | 404 | Issue doesn't exist | `{"detail": "Not found."}` |
| | 500 | Server error | `{"detail": "An error occurred during file upload."}` |

### Comment Endpoints

| Endpoint | Status Code | Condition | Response |
|----------|-------------|-----------|----------|
| `/issues/{id}/add-comment` (POST) | 401 | Missing/invalid token | `{"detail": "Invalid token."}` |
| | 403 | User not reporter/assignee | `{"detail": "You do not have permission..."}` |
| | 404 | Issue doesn't exist | `{"detail": "Not found."}` |
| | 500 | Server error | `{"detail": "An error occurred while creating the comment."}` |

### List Endpoints (GET)

| Endpoint | Status Code | Condition | Response |
|----------|-------------|-----------|----------|
| `/issues/reporter/` | 401 | Missing/invalid token | `{"detail": "Invalid token."}` |
| | 500 | Server error | Generic 500 response |

---

## Best Practices for Error Handling

### Client-Side Recommendations

1. **Always check HTTP status codes** before processing responses
2. **Handle 401 errors** by redirecting to login or refreshing the token
3. **Display user-friendly messages** for 403 and 404 errors
4. **Log 500 errors** with full details for debugging
5. **Validate request data** before sending to avoid 400 errors

### Error Response Structure

All error responses follow this structure:

```json
{
  "detail": "Human-readable error message",
  "errors": {
    // Optional field-specific validation errors
  }
}
```

### Retry Logic

- **401 Unauthorized:** Do not retry (requires new authentication)
- **403 Forbidden:** Do not retry (permission issue persists)
- **404 Not Found:** Do not retry (resource doesn't exist)
- **500 Internal Server Error:** Implement exponential backoff retry

---

## Validation Error Details

When validation fails, the response includes specific field errors:

```json
{
  "message": "Validation failed.",
  "errors": {
    "field_name": [
      "Error message for this field"
    ]
  }
}
```

**Common validation rules:**

- `rating`: Must be integer between 1 and 5
- `status`: Must be valid issue status ID
- `appeal_status`: Must be boolean
- `email`: Must be valid email format
- All string fields: Cannot be empty (minLength: 1)

---

## Security Considerations

- **401 responses** should never include sensitive information
- **403 responses** indicate access control failures without revealing why
- **500 responses** should not leak stack traces or internal details
- All error messages are sanitized to prevent information disclosure

---

## Support

For issues that don't match these documented errors, please contact the API support team with:

- The endpoint that failed
- The HTTP status code received
- The full response body (if available)
- Any relevant request parameters
