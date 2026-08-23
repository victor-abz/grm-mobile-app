# API Overview Documentation

## Introduction

This document provides an overview of the available API endpoints for managing issues, administrative regions, and related entities. All endpoints return paginated results where applicable.

---

## Authentication Endpoints

### Login

**Endpoint:** `POST /authentication/login/`

**Description:** Authenticate user credentials and return authentication token.

**Request Body:**

```json
{

  "username": "string",

  "password": "string"

}
```

**Response (200):**

```json
{

  "token": "string",

  "user_id": integer,

  "username": "string",

  "message": "string"

}
```

### Register a New Citizen

**Endpoint:** `POST /authentication/register/`

**Description:** Register a new citizen account. Creates both a User and associated Citizen record. No authentication required for this endpoint.

**Request Body:**

```json
{

  "username": "string",

  "first_name": "string",

  "last_name": "string",

  "email": "string",

  "phone_number": "string",

  "password": "string",

  "confirm_password": "string"

}
```

**Response (201):**

```json
{

"message": "Citizen registered successfully.",

"data": {


  "id": integer,

  "username": "string",

  "email": "string",

  "phone_number": "string",

  "first_name": "string",

  "last_name": "string"


  }

}
```

**Response (200):**

```json
{

  "token": "string",

  "user_id": integer,

  "username": "string",

  "message": "string"

}
```

**Response (200):**

```json
{

  "message": "Password reset email sent successfully"

}
```

### Get Facilitator Profile Information

**Endpoint:** `GET /authentication/facilitator-profile/`

**Description:** Retrieve the authenticated user's complete facilitator profile information. Only accessible to users with an associated Facilitator profile.

**Response (200):**

```json
{

  "id": integer,

  "user": {

    "id": integer,

    "name": "string"


  },

  "administrative_region": {

    "id": integer,

    "name": "string",

    "administrative_level": integer,

    "parent": integer


  },

  "unique_region": boolean,

  "village_secretary": boolean,

  "created_date": "datetime",

  "updated_date": "datetime"

}
```

### Update Facilitator Password

**Endpoint:** `POST /authentication/facilitator-credentials/update/`

**Description:** Update the user password after the facilitator's code validation.

**Request Body:**

```json
{

  "username": "string",

  "password": "string",

  "code": "string"

}
```

**Response (204):**

```json
{

  "token": "string",

  "user_id": integer,

  "username": "string",

  "message": "string"

}
```

---

## Issue Management Endpoints

### Create an Issue

**Endpoint:** `POST /issues/create/`

**Description:** Create a new issue.

**Request Body:**

```json
{

  "description": "string",

  "category": integer,

  "issue_type": integer,

  "issue_sub_type": integer,

  "contact_medium": "phone|email|web|in_person|alert|anonymous",

  "contact_method": "email|phone_number|whatsapp|sms",

  "contact_information": "string",

  "tracking_code": "string",

  "intake_date": "datetime",

  "ongoing_issue": boolean,

  "location_description": "string",

  "status": integer,

  "administrative_region": integer,

  "component": integer,

  "sub_component": integer,

  "citizen": {


    "name": "string",

    "age_group": "string",

    "type": "string",

    "group": "string",

    "group_2": "string"


},

  "reporter": integer,

  "assignee": integer

}
```

**Response (201):**

```json
{

  "message": "Issue created successfully.",

  "data": {
    "id": integer,

    "intake_date": "datetime",

    "status": {

      "id": integer,

      "name": "string"

    },

    "appeal_status": boolean,

    "category": {

      "id": integer,

      "name": "string"

    },

    "issue_type": {

      "id": integer,

      "name": "string"

    },

    "administrative_region": {

      "id": integer,

      "name": "string",

      "administrative_level": integer,

      "parent": integer

    },

    "created_date": "datetime",

    "updated_date": "datetime"
}

}
```

### Retrieve a Specific Issue

**Endpoint:** `GET /issues/{id}/`

**Description:** Retrieve detailed information about a specific issue. Only users who are either the reporter or assignee of the issue can access this endpoint.

**Path Parameters:**

- `id` (integer): Unique identifier of the issue to retrieve

**Response (200):**

```json
{

  "id": integer,

  "tracking_code": "string",

  "title": "string",

  "description": "string",

  "appeal_reason": "string",

  "appeal_status": boolean,

  "escalate_flag": boolean,

  "escalation_reason": "string",

  "rating": integer,

  "reject_flag": boolean,

  "reject_reason": "string",

  "research_result": "string",

  "intake_date": "datetime",

  "administrative_region": {


    "id": integer,

    "name": "string"


},

  "reporter": {


    "id": integer,

    "name": "string"


},

  "assignee": {


    "id": integer,

    "name": "string"


},

  "status": {


    "id": integer,

    "name": "string"


},

  "category": {


    "id": integer,

    "name": "string"


},

  "issue_type": {


    "id": integer,

    "name": "string"


},

  "created_date": "datetime",

  "updated_date": "datetime"

}
```

### Update an Issue

**Endpoint:** `PATCH /issues/{id}/update/`

**Description:** Partially update an issue. Only specific fields can be modified. Access control applies based on user role (reporter vs assignee).

**Path Parameters:**

- `id` (integer): Unique identifier of the issue to update

**Request Body:**

```json
{

  "appeal_reason": "string",

  "appeal_status": boolean,

  "escalate_flag": boolean,

  "escalation_reason": "string",

  "rating": integer,

  "reject_flag": boolean,

  "reject_reason": "string",

  "research_result": "string",

  "status": integer

}
```

**Response (200):**

```json
{

  "message": "Issue updated successfully.",

  "data": {


  "id": integer,

  "intake_date": "datetime",

  "status": {

    "id": integer,

    "name": "string"

},

  "appeal_status": boolean,

  "category": {

    "id": integer,

    "name": "string"

},

  "issue_type": {

    "id": integer,

    "name": "string"

},

  "administrative_region": {

    "id": integer,

    "name": "string",

    "administrative_level": integer,

    "parent": integer

},

  "created_date": "datetime",

  "updated_date": "datetime"


}

}
```

### Add a Comment to an Issue

**Endpoint:** `POST /issues/{id}/add-comment/`

**Description:** Create a new comment associated with a specific issue. Only users who are either the reporter or assignee of the issue can add comments.

**Path Parameters:**

- `id` (integer): Unique identifier of the issue to add a comment to

**Request Body:**

```json
{

  "comment": "string"

}
```

**Response (201):**

```json
{

  "comment": "string"

}
```

**Response (201):**

```json
{

  "message": "Comment added successfully.",

  "data": {

    "id": integer,

    "comment": "string",

    "user": {

      "id": integer,

      "name": "string"

  },

    "due_date": "datetime",

    "created_date": "datetime",

    "updated_date": "datetime"

  }

}
```

### List Comments of a Specific Issue

**Endpoint:** `GET /issues/{id}/comments/`

**Description:** Retrieve a paginated list of comments associated with a specific issue. Only users who are either the reporter or assignee of the issue can access this endpoint.

**Path Parameters:**

- `id` (integer): Unique identifier of the issue whose comments you want to retrieve

**Query Parameters:**

- `page` (integer, optional): A page number within the paginated result set

**Response (200):**

```json
{

  "count": integer,

  "next": "string",

  "previous": "string",

  "results": [


{

    "id": integer,

    "comment": "string",

    "user": {

      "id": integer,

      "name": "string"

  },

    "due_date": "datetime",

    "created_date": "datetime",

    "updated_date": "datetime"

}


]

}
```

### Delete a Comment from an Issue

**Endpoint:** `DELETE /issues/delete-comment/{id}/`

**Description:** Delete an existing comment from an issue. Only users who are either the reporter or assignee of the issue can delete comments.

**Path Parameters:**

- `id` (integer): Unique identifier of the comment to delete

**Response (204):**

```json
{

  "message": "Comment deleted successfully"

}
```

### Add an Attachment to an Issue

**Endpoint:** `POST /issues/{id}/add-attachment`

**Description:** Create a new attachment associated with a specific issue. Only users who are either the reporter or assignee of the issue can add attachment.

**Path Parameters:**

- `id` (string): Unique identifier of the issue to add an attachment to

**Request Body:**

```json
{

  "file": "file"

}
```

**Response (201):**

```json
{

  "message": "Attachment uploaded successfully.",

  "data": {

    "id": integer,

    "file": "file",

    "uploaded_by": {

      "id": integer,

      "name": "string"

    },

    "created_date": "datetime",

    "updated_date": "datetime"

  }

}
```

### List Attachments of a Specific Issue

**Endpoint:** `GET /issues/{id}/attachments/`

**Description:** Retrieve a paginated list of attachments associated with a specific issue. Only users who are either the reporter or assignee of the issue can access this endpoint.

**Path Parameters:**

- `id` (integer): Unique identifier of the issue whose attachments you want to retrieve

**Query Parameters:**

- `page` (integer, optional): A page number within the paginated result set

- `created_date` (string, optional): Filter attachments created after this datetime

- `updated_date` (string, optional): Filter attachments updated after this datetime

- `deleted_date` (string, optional): Filter attachments deleted after this datetime

**Response (200):**

```json
{

  "count": integer,

  "next": "string",

  "previous": "string",

  "results": [


    {

      "id": integer,

      "file": "file",

      "uploaded_by": {

        "id": integer,

        "name": "string"

      },

      "created_date": "datetime",

      "updated_date": "datetime"

    }


  ]

}
```

### Delete an Attachment from an Issue

**Endpoint:** `DELETE /issues/delete-attachment/{id}/`

**Description:** Delete an existing attachment from an issue. Only users who are either the reporter or assignee of the issue can delete attachments.

**Path Parameters:**

- `id` (integer): Unique identifier of the attachment to delete

**Response (204):**

```json
{

"message": "Attachment deleted successfully"

}
```

---

## Issue List Endpoints

### List Issues Assigned to Authenticated User

**Endpoint:** `GET /issues/assignee/`

**Description:** Retrieve a paginated list of issues where the authenticated user is the assignee.

**Query Parameters:**

- `page` (integer, default: 1): Page number for pagination

- `page_size` (integer, default: 20, max: 100): Number of results per page

- `created_date` (string, optional): Filter issues created after this datetime

- `updated_date` (string, optional): Filter issues updated after this datetime

- `code` (string, optional): Tracking code of the issue

**Response (200):**

```json
{

  "next": "string",

  "previous": "string",

  "results": [


    {

      "id": integer,

      "description": "string",

      "appeal_reason": "string",

      "appeal_status": boolean,

      "escalate_flag": boolean,

      "escalation_reason": "string",

      "rating": integer,

      "reject_flag": boolean,

      "reject_reason": "string",

      "research_result": "string",

      "tracking_code": "string",

      "intake_date": "datetime",

      "administrative_region": {

        "administrative_id": "string",

        "name": "string"

      },

      "reporter": {

        "id": integer,

        "name": "string"

      },

      "assignee": {

        "id": integer,

        "name": "string"

      },

      "status": {

        "id": integer,

        "name": "string",

        "final_status": boolean,

        "initial_status": boolean,

        "rejected_status": boolean,

        "open_status": boolean

      },

      "category": {

        "id": integer,

        "name": "string"

      },

      "issue_type": {

        "id": integer,

        "name": "string"

      },

      "created_date": "datetime",

      "updated_date": "datetime"

    }


  ]

}
```

### List Issues Reported by Authenticated User

**Endpoint:** `GET /issues/reporter/`

**Description:** Retrieve a paginated list of issues where the authenticated user is the reporter.

**Query Parameters:**

- `page` (integer, default: 1): Page number for pagination

- `page_size` (integer, default: 20, max: 100): Number of results per page

- `created_date` (string, optional): Filter issues created after this datetime

- `updated_date` (string, optional): Filter issues updated after this datetime

- `code` (string, optional): Tracking code of the issue

**Response (200):** Same structure as `/issues/assignee/`

---

## Issue Category Endpoints

### List Issue Categories

**Endpoint:** `GET /issues/issue-categories/`

**Description:** Retrieve a paginated list of all issue categories ordered by name.

**Query Parameters:**

- `page` (integer, default: 1): Page number for pagination

- `page_size` (integer, default: 20, max: 100): Number of items per page

**Response (200):**

```json
{

  "count": integer,

  "next": "string",

  "previous": "string",

  "results": [

    {

      "id": integer,

      "name": "string",

      "abbreviation": "string",

      "assigned_department": {

        "name": "string",

        "id": integer,

        "administrative_level": "string"

      },

      "assigned_appeal_department": {

        "name": "string",

        "id": integer,

        "administrative_level": "string"

      },

      "assigned_escalation_department": {

        "name": "string",

        "id": integer,

        "administrative_level": "string"

      },

      "confidentiality_level": "string",

      "redirection_protocol": "string",

      "label": "string",

      "value": integer,

      "parent_id": integer,

      "created_date": "datetime",

      "updated_date": "datetime"

    }

  ]
}
```

---

## Issue Type Endpoints

### List Issue Types

**Endpoint:** `GET /issues/issue-types/`

**Description:** Retrieve a paginated list of all issue types ordered by name.

**Query Parameters:**

- `page` (integer, default: 1): Page number for pagination

- `page_size` (integer, default: 20, max: 100): Number of items per page

**Response (200):**

```json
{

  "count": integer,

  "next": "string",

  "previous": "string",

  "results": [

  {

    "id": integer,

    "name": "string",

    "created_date": "datetime",

    "updated_date": "datetime"

  }

  ]

}
```

### List Issue Subtypes

**Endpoint:** `GET /issues/issue-subtypes/`

**Description:** Retrieve a paginated list of all issue subtypes ordered by name.

**Query Parameters:**

- `page` (integer, default: 1): Page number for pagination

- `page_size` (integer, default: 20, max: 100): Number of items per page

**Response (200):**

```json
{

  "count": integer,

  "next": "string",

  "previous": "string",

  "results": [


  {

    "id": integer,

    "name": "string",

    "parent": {

      "id": integer,

      "name": "string"

    },

    "created_date": "datetime",

    "updated_date": "datetime"

  }


  ]

}
```

### List Issue Statuses

**Endpoint:** `GET /issues/issue-statuses/`

**Description:** Retrieve a paginated list of all issue statuses ordered by id.

**Query Parameters:**

- `page` (integer, default: 1): Page number for pagination

- `page_size` (integer, default: 20, max: 100): Number of results per page

**Response (200):**

```json
{

  "count": integer,

  "next": "string",

  "previous": "string",

  "results": [

    {

      "id": integer,

      "name": "string",

      "final_status": boolean,

      "initial_status": boolean,

      "rejected_status": boolean,

      "open_status": boolean,

      "created_date": "datetime",

      "updated_date": "datetime"

    }


  ]

}
```

---

## Administrative Region Endpoints

### List All Administrative Regions

**Endpoint:** `GET /issues/regions/`

**Description:** Retrieve a paginated list of all administrative regions ordered by name.

**Query Parameters:**

- `page` (integer, default: 1): Page number for pagination

- `page_size` (integer, default: 20, max: 100): Number of results per page

**Response (200):**

```json
{

  "count": integer,

  "next": "string",

  "previous": "string",

  "results": [


    {

      "id": integer,

      "name": "string",

      "hierarchical_name": "string",

      "administrative_level": integer,

      "parent": integer,

      "created_date": "datetime",

      "updated_date": "datetime"

    }


  ]

}

```

### List Child Administrative Regions

**Endpoint:** `GET /issues/region-children/`

**Description:** Retrieve all administrative regions that are children of the specified parent. If 'parent' is not provided or is null, returns all regions with no parent.

**Query Parameters:**

- `parent` (integer, optional): Parent AdministrativeRegion ID (use null or omit to fetch top-level regions)

**Response (200):**

```json
[

  {

    "id": integer,

    "name": "string",

    "hierarchical_name": "string",

    "administrative_level": integer,

    "parent": integer,

    "created_date": "datetime",

    "updated_date": "datetime"

  }

]
```

---

## Citizen Group Endpoints

### List Citizen Age Groups

**Endpoint:** `GET /issues/citizen-age-groups/`

**Description:** Retrieve a paginated list of all citizen age groups.

**Query Parameters:**

- `page` (integer, default: 1): Page number for pagination

- `page_size` (integer, default: 20, max: 100): Number of items per page

**Response (200):**

```json
{

  "count": integer,

  "next": "string",

  "previous": "string",

  "results": [

    {

      "id": integer,

      "name": "string",

      "created_date": "datetime",

      "updated_date": "datetime"

    }


  ]

}
```

### List Citizen Groups

**Endpoint:** `GET /issues/citizen-groups/`

**Description:** Retrieve a paginated list of all citizen groups.

**Query Parameters:**

- `page` (integer, default: 1): Page number for pagination

- `page_size` (integer, default: 20, max: 100): Number of items per page

**Response (200):**

```json
{

  "count": integer,

  "next": "string",

  "previous": "string",

  "results": [


      {

        "id": integer,

        "name": "string",

        "type": "string",

        "created_date": "datetime",

        "updated_date": "datetime"

      }


  ]

}
```

---

## Component Endpoints

### List Components

**Endpoint:** `GET /issues/components/`

**Description:** Retrieve a paginated list of all components.

**Query Parameters:**

- `page` (integer, default: 1): Page number for pagination

- `page_size` (integer, default: 20, max: 100): Number of items per page

**Response (200):**

```json
{

  "count": integer,

  "next": "string",

  "previous": "string",

  "results": [


      {

        "id": integer,

        "name": "string",

        "description": "string",

        "created_date": "datetime",

        "updated_date": "datetime"

      }


  ]

}
```

### List Subcomponents

**Endpoint:** `GET /issues/subcomponents/`

**Description:** Retrieve a paginated list of all subcomponents.

**Query Parameters:**

- `page` (integer, default: 1): Page number for pagination

- `page_size` (integer, default: 20, max: 100): Number of items per page

**Response (200):**

```json
{

  "count": integer,

  "next": "string",

  "previous": "string",

  "results": [


    {

      "id": integer,

      "name": "string",

      "description": "string",

      "parent": {

        "id": integer,

        "name": "string",

        "description": "string"

      },

      "created_date": "datetime",

      "updated_date": "datetime"

    }


  ]

}

```

### List Subproject Groups

**Endpoint:** `GET /issues/subproject-groups/`

**Description:** Retrieve a paginated list of all subproject groups.

**Query Parameters:**

- `page` (integer, default: 1): Page number for pagination

- `page_size` (integer, default: 20, max: 100): Number of items per page

**Response (200):**

```json
{

  "count": integer,

  "next": "string",

  "previous": "string",

  "results": [


    {

      "id": integer,

      "name": "string",

      "created_date": "datetime",

      "updated_date": "datetime"

    }


  ]

}
```

---

## Facilitator Endpoints

### Get Facilitator Profile Information

**Endpoint:** `GET /authentication/facilitator-profile/`

**Description:** Retrieve the authenticated user's complete facilitator profile information. Only accessible to users with an associated Facilitator profile.

**Response (200):**

```json
{

  "id": integer,

  "user": {


    "id": integer,

    "name": "string"


  },

  "administrative_region": {


    "id": integer,

    "name": "string",

    "administrative_level": integer,

    "parent": integer


  },

  "unique_region": boolean,

  "village_secretary": boolean,

  "created_date": "datetime",

  "updated_date": "datetime"

}
```

---

## Security

All authenticated endpoints require a valid authentication token in the `Authorization` header:

Authorization: Token <token_value>

---

## Notes

- All list endpoints support pagination with `page` and `page_size` query parameters

- Maximum page size is 100 for most endpoints

- Date/time filters use ISO 8601 format (e.g., `2024-08-28T10:30:45Z`)

- Access control applies to issue-specific endpoints - only reporters and assignees can access their issues
