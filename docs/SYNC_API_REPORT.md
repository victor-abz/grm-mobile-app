# GRM Mobile App — Sync API Report

**Date**: 2026-05-27
**Issue**: App syncs successfully but receives 0 records — all screens show empty data

---

## Root Cause

The test user `0782331296@yopmail.com` (Jean Claude HAKIZIMANA) has **no project or region assignments** on the backend. The `pull_changes` endpoint returns empty `changes: {}` with debug messages:

```
Found 0 region assignments for user 0782331296@yopmail.com
User 0782331296@yopmail.com has access to projects: []
User 0782331296@yopmail.com is assigned to regions: []
```

---

## Sync API Endpoints

### 1. `egrm.api.sync.pull_changes` (GET)

Main data sync endpoint. The mobile app calls this on login and periodically to fetch all data.

**Request**:

| Param | Type | Description |
|-------|------|-------------|
| `lastPulledAt` | `number \| null` | `null` for full sync, unix timestamp (ms) for incremental |

**Expected Response**:

```json
{
  "changes": {
    "<table_name>": {
      "created": [{ "id": "frappe-name", ...fields }],
      "updated": [{ "id": "frappe-name", ...fields }],
      "deleted": ["frappe-name-1", "frappe-name-2"]
    }
  },
  "timestamp": 1779832800000
}
```


#### Tables & Fields Required

##### Lookup Data (global — should sync for all authenticated users)

**`grm_projects`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| title | string | yes |
| project_code | string | yes |
| description | string | no |
| start_date | timestamp | no |
| end_date | timestamp | no |
| is_active | boolean | yes |
| logo | string | no |
| default_language | string | no |
| auto_escalation_days | number | no |
| enable_citizen_feedback | boolean | yes |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`grm_issue_categories`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| category_name | string | yes |
| label | string | yes |
| abbreviation | string | yes |
| assigned_department | string | yes |
| assigned_appeal_department | string | no |
| assigned_escalation_department | string | no |
| confidentiality_level | string | yes |
| redirection_protocol | string | yes |
| administrative_level | string | no |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`grm_issue_types`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| type_name | string | yes |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`grm_issue_statuses`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| status_name | string | yes |
| final_status | boolean | yes |
| initial_status | boolean | yes |
| rejected_status | boolean | yes |
| open_status | boolean | yes |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`grm_issue_departments`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| department_name | string | yes |
| head | string | no |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`grm_issue_age_groups`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| age_group | string | yes |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`grm_issue_citizen_groups`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| group_name | string | yes |
| group_type | string | yes |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`grm_administrative_regions`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| region_name | string | yes |
| administrative_level | string | yes |
| parent_region | string | no |
| location | string | no |
| project | string | yes |
| path | string | no |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`grm_administrative_level_types`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| level_name | string | yes |
| level_order | number | yes |
| project | string | yes |
| creation | timestamp | yes |
| modified | timestamp | yes |

##### User-Specific Data (scoped to user's project/region assignments)

**`grm_issues`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| project | string | yes |
| issue_date | timestamp | yes |
| intake_date | timestamp | yes |
| category | string | yes |
| issue_type | string | yes |
| status | string | yes |
| tracking_code | string | no |
| description | string | yes |
| issue_location | string | no |
| citizen_type | string | yes |
| citizen | string | no |
| gender | string | no |
| contact_medium | string | yes |
| contact_info_type | string | no |
| contact_information | string | no |
| citizen_age_group | string | no |
| citizen_group_1 | string | no |
| citizen_group_2 | string | no |
| reporter | string | yes |
| assignee | string | no |
| administrative_region | string | yes |
| resolution_days | number | no |
| resolution_date | timestamp | no |
| resolution_accepted | string | no |
| rating | number | no |
| escalate_flag | boolean | no |
| confirmed | boolean | no |
| amended_from | string | no |
| accepted_date | timestamp | no |
| reject_reason | string | no |
| rejected_date | timestamp | no |
| rejected_by | string | no |
| escalated_date | timestamp | no |
| escalated_by | string | no |
| escalation_reason | string | no |
| resolution_text | string | no |
| resolved_by | string | no |
| rated_date | timestamp | no |
| appeal_submitted | boolean | no |
| appeal_date | timestamp | no |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`grm_issue_comments`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| grm_issue | string | yes |
| user | string | yes |
| comment | string | yes |
| activity_type | string | no |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`grm_issue_logs`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| grm_issue | string | yes |
| text | string | yes |
| user | string | yes |
| timestamp | timestamp | yes |
| action_taken | string | no |
| action_taken_date | timestamp | no |
| action_taken_by | string | no |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`grm_issue_attachments`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| grm_issue | string | yes |
| attachment | string | yes |
| file_name | string | no |
| local_url | string | no |
| server_url | string | no |
| uploaded | boolean | yes |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`grm_issue_escalation_reasons`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| grm_issue | string | yes |
| user | string | yes |
| comment | string | yes |
| due_at | timestamp | yes |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`grm_project_links`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| project | string | yes |
| parent | string | yes |
| parenttype | string | yes |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`users`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| username | string | yes |
| email | string | yes |
| full_name | string | yes |
| creation | timestamp | yes |
| modified | timestamp | yes |

**`user_context`**

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| user_id | string | yes |
| context_data | string (JSON) | yes |
| creation | timestamp | yes |
| modified | timestamp | yes |

---

### 2. `egrm.api.sync.push_changes` (POST)

Pushes locally-created/updated records to the server.

**Request body**:

```json
{
  "changes": {
    "grm_issues": {
      "created": [{ "id": "...", ...issue_fields }],
      "updated": [{ "id": "...", ...issue_fields }],
      "deleted": []
    },
    "grm_issue_logs": {
      "created": [{ "id": "...", ...log_fields }],
      "updated": [],
      "deleted": []
    },
    "grm_issue_comments": {
      "created": [{ "id": "...", ...comment_fields }],
      "updated": [],
      "deleted": []
    },
    "grm_issue_attachments": {
      "created": [{ "id": "...", ...attachment_fields_with_file_data }],
      "updated": [],
      "deleted": []
    }
  },
  "lastPulledAt": 1779832800000
}
```

Only these 4 tables are pushed (all others are read-only lookup data).

---

### 3. `egrm.api.issue.upload_attachment` (POST)

Uploads file attachments for issues.

---

## What Needs to Be Fixed

1. **Assign the test user** `0782331296@yopmail.com` to at least one GRM Project and one Administrative Region on the Frappe backend
2. **Lookup data should be global**: Categories, types, statuses, departments, age groups, citizen groups, and admin level types are configuration data — they should sync for any authenticated user regardless of project assignment. Currently, `pull_changes` returns `changes: {}` (completely empty) when the user has no project access
3. Once fixed, the mobile app will populate all forms and report screens automatically — no client-side changes needed
