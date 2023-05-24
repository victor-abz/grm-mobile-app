# Database Format

# Change Log

### 2022-03-17

*   Changed administrative\_level\_\_id to administrative\_level in the category and issue documents to provide the ability to route to different administrative levels.

### 2022-03-03

*   added administrative\_level\_\_id to the category inside the issue document to support an accurate routing to the facilitator

### 2022-02-14

*   Se agrego el atributo open\_status en el issue\_status document para llevar control de cuando un issue esta abierto.
*   Se agrego el atributo rejected\_status en el issue\_status document para llevar control de cuando un issue esta abierto.

### 2022-02-09

*   Se agrego administrative\_level\_id al issue\_category para cada tipo de redirección.
*   Se agrego el campo logs al issue document para guardar las acciones que suceden sobre el issue
*   Se agrego el resolution accepted flag y el process rating al issue document
*   Se agrego el escalate\_flag para el proceso de escalar

### 2022-02-05

*   Se agrego el campo "initial\_status" al documento "issue\_status" para llevar control de si el issue no ha sido aceptado.

### 2022-01-24

*   Added to "issue":
    *   citizen\_type: for step 2 of the issue uptake update
    *   citizen\_age\_group: for step 2 of the issue uptake update
*   Created "issue\_age\_group" Document to control of different age group categories for the step 2 dropdown of the issue uptake.
*   Created "citizen\_group\_1" and "citizen\_group\_2" Documents to control of different groups categories to which a beneficiary can belong to for the step 2 dropdown of the issue uptake.
*   Created "ongoing\_issue" which can be True or False, and it maps clicking on the radio button on step 3 with the label "current event or multiple occurrences"
*   Created “assigned\_appeal\_department” on “issue\_category” to manage the routing rule of an appeal
*   Created “assigned\_escalation\_department” on “issue\_category” to manage the routing rule of an appeal
*   Added “administrative\_level” parameter to the “assigned\_department“ and “assigned\_appeal\_department” to manage the administrative level to where the issue is routed.

  

# Examples

  

## "Issue" Document

  

```json
{
  "internal_code": "gbv-01",
  "tracking_code": "Tree254",
  "auto_increment_id": 1,
  "title": "Les eaux usées s'éccoulent sur le côté en raison d'un caniveau de rue bouché",
  "description": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.",
  "attachments": [
    {
      "name": "report.pdf",
      "url": "/attachments/1253a3516c4e88550768d719be04e43d/report.pdf",
      "local_url": "/relative_path/report.pdf",
      "id": "2021-03-24T12:00:00.000Z",
      "uploaded": true,
      "bd_id": "1253a3516c4e88550768d719be04e43d"
    }
  ],
  "status": {
    "name": "Open",
    "id": 1
  },
  "logs": [
    {
      "text": "Issue collected",
      "timestamp": "2021-03-29T09:00:00.000Z",
    },
    {
      "text": "Issue Accepted",
      "timestamp": "2021-03-30T09:00:00.000Z",
    },
  ],
  "ongoing_issue": true,
  "assignee": {
    "id": 123,
    "name": "Fatima G."
  },
  "reporter": {
    "id": 4556,
    "name": "Gatta Dallo"
  },
  "citizen": "Calvin K.",
  "citizen_type" : 0,
  "citizen_age_group": {
    "name": "18-21",
    "id": 1
  },
  "gender": "Male",
  "citizen_group_1": {
    "name": "Venezuelan",
    "id": 1,
  }
  "citizen_group_2": {
    "name": "Venezuelan",
    "id": 1,
  }
  "contact_medium": "contact",
  "category": {
    "id": 1,
    "name": "Environmental",
    "confidentiality_level": "Confidential",
    "assigned_department": 1,
    "administrative_level": "County",
  },
  "issue_type": {
    "id": 1,
    "name": "Complaint"
  },
  "created_date": "2021-03-24T12:00:00.000Z",
  "resolution_days": 5,
  "resolution_date": "2021-03-29T09:00:00.000Z",
  "intake_date": "2021-03-23T00:00:00.000Z",
  "issue_date": "2021-03-29T00:00:00.000Z",
  "comments": [
    {
      "name": "Cece Conde",
      "id": 121,
      "comment": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque",
      "due_at": "2021-03-25T08:05:23.000Z"
    }
  ],
  "contact_information": {
    "type": "email",
    "contact": "cklein@gmail.com"
  },
  "administrative_region": {
    "administrative_id": "5101",
    "name": "CU Coyah"
  },
  "confirmed": false,
  "research_result": "",
  "type": "issue"
  "resolution_accepted": 0,
  "rating": 0,
  "escalate_flag": false,
  "escalation_reasons": [
    {
      "name": "Cece Conde",
      "id": 121,
      "comment": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque",
      "due_at": "2021-03-25T08:05:23.000Z"
    }
  ],
  "reject_reason": ""
}
```

## "adl" Document

```json
{
  "type": "adl",
  "name": "CU Coyah, Coyah",
  "photo": "https://via.placeholder.com/150",
  "location": {
    "lat": 9.6342182,
    "long": -13.6493711
  },
  "representative": {
    "id": 12,
    "name": "Mariama Sylla",
    "email": "m.sylla@anafic.com",
    "phone": "+225 620 653 674",
    "photo": "https://via.placeholder.com/150",
    "is_active": true,
    "last_active": "04-01-2021",
    "password": ""
  },
  "phases": [],
  "administrative_region": "3",
  "department": 1,
  "unique_region": 0,
  "village_secretary" = 1
}
```

## "issue\_age\_group" Document

```json
{
  "name": "18-21",
  "id": 1,
  "type": "issue_age_group"
}
```

## "issue\_citizen\_group\_1"

```json
{
  "name": "Indigenous",
  "id": 1,
  "type": "issue_citizen_group_1"
}
```

## "issue\_citizen\_group\_2"

```json
{
  "name": "Venezuelan",
  "id": 1,
  "type": "issue_citizen_group_2"
}
```

## "administrative\_level" Document

```json
{
  "administrative_id": "1656446326747883",
  "name": "SAVANES",
  "administrative_level": "commune",
  "type": "administrative_level",
  "parent_id": null,
  "latitude": 9.70643,
  "longitude": -13.38465
}
```

## "issue\_category" Document

```json
{
  "name": "Environmental",
  "label": "Environmental",  // same name value (for mobile application dropdown)
  "abbreviation": "M&E",
  "id": 1,
  "value": 1, // same id value (for mobile application dropdown)
  "assigned_department": {
    "name": "Monitoring and Evaluation",
    "id": 1,
    "administrative_level": "Sub-County",
  },
  "assigned_appeal_department": {
    "name": "Monitoring and Evaluation",
    "id": 1,
    // administrative_level can be null or empty and this means the issue will stays on    the administrative level of the Goverment worker or the focal  point
    "administrative_level": "County",
  },
  "assigned_escalation_department": {
    "name": "Monitoring and Evaluation",
    "id": 1,
    "administrative_level": "Sub-County",
  },
  "confidentiality_level": "Confidential",
  "redirection_protocol": 0,
  "type": "issue_category"
}
```

## "issue\_department" Document

```json
{
  "name": "Monitoring and Evaluation",
  "id": 1,
  "head": {
    "id": 123,
    "name": "Fatima G."
  },
  "type": "issue_department"
}
```

## "issue\_status" Document

```json
{
  "name": "Open",
  "id": 1,
  "final_status": false,
  "initial_status": false,
  "rejected_status": false,
  "open_status": true,
  "type": "issue_status"
}
```

## "issue\_type" Document

```json
{
  "name": "Complaint",
  "id": 1,
  "type": "issue_type"
}
```

  

# Glossary

## "Issue" Document

  

*   \_id
*   \_rev
*   \_internal\_code
*   tracking\_code
*   auto\_increment\_id
*   title
*   description
*   attachments
*   status
*   assignee
*   reporter
*   citizen
*   contact\_medium: represented by string
    *   anonymous = Remain anonymous
    *   facilitator = Receive updates from facilitator
    *   contact = Receive updates directly
*   issue\_type
*   created\_date
*   resolution\_days
*   resolution\_date
*   issue\_date
*   comments
*   contact\_information
*   citizen\_type: Represents the type of figure that is submitting an issue, and will be represented by an integer
    *   0 = is a beneficiary who doesn't mind his name being visible by anyone on the system.
    *   1 = is a beneficiary who wants his name to only be visible by the person solving the issue.
    *   2 = is an individual filling on behalf of someone else.
    *   3 = is an organization filling on behalf of someone else.
*   citizen\_age\_group:
*   citizen\_group\_1
*   citizen\_group\_2
*   gender: Options are "Male", "Female", "Other", "Rather not say"
*   administrative\_region
*   confirmed
*   type
*   resolution\_accepted: 0 por default, 1 si fue aceptad0, 2 si no fue aceptado
*   rating: 0 por default, rango de 1 a 5 siendo 1 very unhappy 5 very happy
*   escalate\_flag: false by default when this is set to true then a cronjob will reasign the issue to the level above

  

## "issue\_category" Document

*   redirection\_protocol: 0 (0 to assign to the head of the department, 1 to assign to the one with the fewest assignments in the department)

  

# Lista de status

| **System Actions** | **Label (front-end)** |
| ---| --- |
| Awaiting Acceptance | "In Review" |
| Accepted | "Open" or "Under Investigation" or "Under Assessment" |
| Rejected | Rejected |
| Resolved | Resolved |
| Re-Opened | Re-Opened |
| On Appeal | On Appeal |
| **Milestones / Events** |  |
| Accepted or Rejected | One time |
| Escalated / De-escalated | Multiple times |
| Re-assigned | Multiple Times |
| Resolved | One time |
| Rejection / Acceptance of Resolution | One time |
| Appealed | One time |
| Re-Opened | Multiple Times |