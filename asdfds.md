I'm migrating a Grievance Redress Mechanism (GRM) application from CouchDB to Frappe. I need to create the required DocTypes directly in my Frappe app located at `/Users/victor/egrm/apps/egrm`.

Here's the documentation for the DocType structure:

```

# GRM Frappe DocType Structure and Migration Guide

## Introduction

This document provides a comprehensive specification for migrating the GRM (Grievance Redress Mechanism) system from CouchDB to Frappe. The goal is to create a SaaS-ready system that supports multi-project functionality with appropriate permission controls, allowing users to manage issues across different projects and administrative regions.

## Core Concepts

1. **Multi-Project Support**: The system will allow for multiple GRM projects, each with its own configuration settings, issue types, categories, and user assignments.

2. **Role-Based Permissions**: Users can be assigned to multiple projects with different roles, with permissions that respect project boundaries and administrative hierarchies.

3. **Hierarchical Administration**: Administrative regions will follow a hierarchical structure, with permissions flowing downward through the hierarchy.

4. **Configuration Flexibility**: Each project can have its own set of configuration options including issue types, categories, departments, and statuses.

## DocType Structure

### 1. GRM Project

The core entity that represents a distinct GRM implementation, enabling multi-tenant functionality.

**Fields:**
- `name`: Data (Auto-generated)
- `title`: Data (Project title)
- `description`: Text Editor
- `start_date`: Date
- `end_date`: Date
- `is_active`: Check
- `logo`: Attach Image
- `project_code`: Data (Unique code)
- `default_language`: Link (Language)
- `auto_escalation_days`: Int (Optional)
- `enable_citizen_feedback`: Check

**Functionality Requirements:**
- Ensure project_code uniqueness
- Create default configuration items on project creation (statuses, issue types, departments)
- Track active vs. inactive projects
- Serve as the central linking point for all project-specific configurations

**Permission Structure:**
- GRM Administrator: All permissions
- GRM Project Manager: Read, Write, Create
- System Manager: All permissions

### 2. GRM Issue

The central entity representing a citizen grievance or issue.

**Fields:**
- `name`: Data (Auto-generated)
- `internal_code`: Data (Internal reference)
- `tracking_code`: Data (Citizen-facing code)
- `auto_increment_id`: Int (Sequential ID within project)
- `title`: Data
- `description`: Text Editor
- `status`: Link (GRM Issue Status)
- `assignee`: Link (User)
- `reporter`: Link (User)
- `citizen`: Data (Encrypted for confidentiality)
- `citizen_type`: Select [0=Visible, 1=Confidential, 2=Individual Proxy, 3=Organization Proxy]
- `citizen_age_group`: Link (GRM Issue Age Group)
- `citizen_group_1`: Link (GRM Issue Citizen Group)
- `citizen_group_2`: Link (GRM Issue Citizen Group)
- `gender`: Select [Male, Female, Other, Rather not say]
- `contact_medium`: Select [anonymous, facilitator, contact]
- `category`: Link (GRM Issue Category)
- `issue_type`: Link (GRM Issue Type)
- `created_date`: Datetime
- `resolution_days`: Int
- `resolution_date`: Datetime
- `intake_date`: Date
- `issue_date`: Date
- `administrative_region`: Link (GRM Administrative Region)
- `confirmed`: Check
- `resolution_accepted`: Int [0=Pending, 1=Accepted, 2=Rejected]
- `rating`: Int [0-5]
- `escalate_flag`: Check
- `contact_information`: JSON (Encrypted)
- `project`: Link (GRM Project)
- `is_submittable`: Yes (Draft, Submitted, Cancelled)

**Child Tables:**
1. **GRM Issue Attachment**
   - `attachment`: Attach
   - `local_url`: 
   - `uploaded`: Check (Sync status)
   - `file_name`: Data

2. **GRM Issue Log**
   - `text`: Data (Log entry)
   - `timestamp`: Datetime
   - `user`: Link (User)

3. **GRM Issue Comment**
   - `user`: Link (User)
   - `comment`: Text
   - `due_at`: Datetime (Optional)

4. **GRM Issue Escalation Reason**
   - `user`: Link (User)
   - `comment`: Text
   - `due_at`: Datetime

**Functionality Requirements:**
- Generate internal_code based on project, category, and auto_increment_id
- Generate citizen-facing user friendly tracking_code with a project prefix and random component
- Auto-generate sequential ID per project
- Encrypt sensitive citizen data
- Validate that linked entities (category, status, etc.) belong to the selected project
- Implement status transitions with workflow validation
- Track issue history in logs
- Manage attachments with sync status tracking
- Send notifications on assignment and status changes
- Implement escalation logic based on resolution_days and auto_escalation settings
- Calculate SLA metrics based on issue category and resolution targets

**Permission Structure:**
- Apply custom permissions based on user project assignments, department, and administrative region
- GRM Administrator: All permissions
- GRM Project Manager: All permissions within assigned projects
- GRM Department Head: Read, Write, Submit, Amend within their department and projects
- GRM Field Officer: Read, Write, Create, Submit within their region and assigned issues
- GRM Analyst: Read only for reporting

### 3. GRM Administrative Region

Represents the hierarchical geographic structure.

**Fields:**
- `name`: Data (Auto-generated)
- `administrative_id`: Data (External ID)
- `region_name`: Data
- `administrative_level`: Link (GRM Administrative Level Type)
- `parent_region`: Link (GRM Administrative Region)
- `latitude`: Float
- `longitude`: Float
- `project`: Link (GRM Project)

**Functionality Requirements:**
- Ensure administrative_id uniqueness within a project
- Validate hierarchical structure to prevent circular references
- Support querying parent-child relationships for permission validation
- Enable geographic visualization
- Allow mapping of regions across different administrative levels

**Permission Structure:**
- GRM Administrator: All permissions
- GRM Project Manager: Read, Write, Create within their projects
- Other roles: Read only

### 4. GRM Administrative Level Type

Defines the types of administrative divisions (e.g., Country, Province, District).

**Fields:**
- `name`: Data (Auto-generated)
- `level_name`: Data (e.g., "District", "County")
- `level_order`: Int (Hierarchy position)
- `project`: Link (GRM Project)

**Functionality Requirements:**
- Maintain ordering for hierarchical relationships
- Support project-specific administrative structures

### 5. GRM Issue Category

Categories for classifying issues.

**Fields:**
- `name`: Data (Auto-generated)
- `category_name`: Data
- `label`: Data (Display label)
- `abbreviation`: Data (For codes)
- `assigned_department`: Link (GRM Issue Department)
- `assigned_appeal_department`: Link (GRM Issue Department)
- `assigned_escalation_department`: Link (GRM Issue Department)
- `confidentiality_level`: Select [Confidential, Public]
- `redirection_protocol`: Int [0=Assign to head, 1=Assign to least loaded]
- `administrative_level`: Link (GRM Administrative Level Type)

**Child Tables:**
- **GRM Project Link** (For linking to projects)
  - `project`: Link (GRM Project)

**Functionality Requirements:**
- Link to multiple projects for shared categories
- Support department assignment logic
- Handle escalation paths

### 6. GRM Issue Department

Organizational units responsible for issue resolution.

**Fields:**
- `name`: Data (Auto-generated)
- `department_name`: Data
- `head`: Link (User)

**Child Tables:**
- **GRM Project Link** (For linking to projects)
  - `project`: Link (GRM Project)

**Functionality Requirements:**
- Manage department heads
- Link to multiple projects
- Support workload balancing for issue assignment

### 7. GRM Issue Status

Possible states in the issue lifecycle.

**Fields:**
- `name`: Data (Auto-generated)
- `status_name`: Data
- `final_status`: Check
- `initial_status`: Check
- `rejected_status`: Check
- `open_status`: Check

**Child Tables:**
- **GRM Project Link** (For linking to projects)
  - `project`: Link (GRM Project)

**Functionality Requirements:**
- Support workflow transitions
- Define terminal vs. ongoing states
- Link to workflow actions

### 8. GRM Issue Type

Types of issues (e.g., Complaint, Inquiry).

**Fields:**
- `name`: Data (Auto-generated)
- `type_name`: Data

**Child Tables:**
- **GRM Project Link** (For linking to projects)
  - `project`: Link (GRM Project)

### 9. GRM Issue Age Group

Age classifications for statistical purposes.

**Fields:**
- `name`: Data (Auto-generated)
- `age_group`: Data (e.g., "18-25")

**Child Tables:**
- **GRM Project Link** (For linking to projects)
  - `project`: Link (GRM Project)

### 10. GRM Issue Citizen Group

Demographic classifications.

**Fields:**
- `name`: Data (Auto-generated)
- `group_name`: Data
- `group_type`: Select [1, 2] (Primary or secondary)

**Child Tables:**
- **GRM Project Link** (For linking to projects)
  - `project`: Link (GRM Project)

### 11. GRM User Project Assignment

Links users to projects with specific roles and regions.

**Fields:**
- `name`: Data (Auto-generated)
- `user`: Link (User)
- `project`: Link (GRM Project)
- `role`: Link (Role)
- `department`: Link (GRM Issue Department)
- `administrative_region`: Link (GRM Administrative Region)
- `is_active`: Check

**Functionality Requirements:**
- Manage user assignment to projects
- Define role-based access within projects
- Restrict access based on department and region
- Support user assignment to multiple projects with different roles

**Permission Structure:**
- GRM Administrator: All permissions
- GRM Project Manager: Read for their projects
- System Manager: All permissions

## Permission Model

### User Roles

1. **GRM Administrator**: System-wide access to all projects and configurations.
2. **GRM Project Manager**: Full access to manage a specific project.
3. **GRM Department Head**: Manage issues assigned to their department.
4. **GRM Field Officer**: Create and handle assigned issues.
5. **GRM Analyst**: Read-only access for reporting.

### Permission Framework

The permission system should implement three levels of filtering:

1. **Project-Level Filtering**:
   - Users should only see data from projects they are assigned to via GRM User Project Assignment
   - Configuration entities (categories, departments, etc.) are linked to projects
   - Basic document-level permissions are enforced at the project level

2. **Department-Level Filtering**:
   - Department Heads see only issues in their department
   - Field Officers see issues assigned to them or in their department
   - Issue assignment follows the category's assigned_department

3. **Region-Level Filtering**:
   - Users with region assignments should only see issues in their region or child regions
   - Hierarchical structure allows access to flow downward from parent to child regions
   - Escalation follows the administrative hierarchy

### Implementation Requirements

Create the following components to implement the permission model:

1. **Custom Server Script**:
   - Implement a `has_permission` function for GRM Issue that filters based on:
     - User's project assignments
     - User's role in each project
     - User's department assignment
     - User's administrative region assignment and the region hierarchy
   - The function should check if the user:
     - Is a GRM Administrator (full access)
     - Is a Project Manager for the issue's project (full access to that project)
     - Is a Department Head for the issue's category's department (access within department)
     - Is a Field Officer with region access or direct assignment (limited access)

2. **Custom List View**:
   - Create custom list views that filter issues based on:
     - User's project assignments
     - User's role in each project
     - Assigned issues vs. all accessible issues

3. **Permission Hooks**:
   - Implement Frappe hooks to inject permission logic:
     - `permission_query_conditions` hook for list views
     - `has_permission` hook for document access

4. **User Dashboard**:
   - Create a user dashboard that shows:
     - Projects the user is assigned to
     - Issues assigned directly to the user
     - Issues in the user's department and region
     - Performance metrics relevant to the user's role

## Data Migration Strategy

### Migration Steps

1. **DocType Creation**:
   - Create all the specified DocTypes in Frappe
   - Set up appropriate permissions and naming series

2. **Project Setup**:
   - Create GRM Project records for each implementation
   - Configure project-specific settings

3. **Configuration Migration**:
   - Migrate supporting documents first:
     - Administrative Regions
     - Departments
     - Categories
     - Statuses
     - Issue Types
     - Citizen Groups
     - Age Groups
   - Link all configuration items to appropriate projects

4. **User Migration**:
   - Migrate user accounts to Frappe
   - Create GRM User Project Assignment records
   - Assign appropriate roles

5. **Issue Migration**:
   - Migrate issues with attachments, comments, and logs
   - Preserve relationships to configuration items
   - Calculate derived fields (e.g., internal_code)
   - Handle encryption of sensitive data

### Migration Tool Requirements

Develop a migration utility that:

1. Extracts data from CouchDB in batches
2. Maps CouchDB documents to Frappe DocTypes
3. Handles data transformations and field mappings
4. Preserves document relationships
5. Validates data integrity during migration
6. Logs errors and provides recovery mechanisms
7. Supports incremental migration for testing

## Mobile App Integration

### API Endpoints

Implement the following API endpoints for mobile app integration:

1. **Authentication**:
   - Login/logout endpoints
   - Token management
   - User profile access

2. **Configuration Sync**:
   - Endpoint to retrieve all configuration for a user's assigned projects
   - Versioning to detect configuration changes

3. **Issue Management**:
   - CRUD operations for issues
   - Attachment upload/download
   - Comment and log management
   - Status transitions

4. **Offline Sync**:
   - Sync state tracking
   - Conflict resolution strategies
   - Batch synchronization for efficiency

### Mobile App Modifications

Update the mobile app to:

1. Replace CouchDB with a local SQLite database
2. Update auth service to use Frappe token authentication
3. Implement synchronization service for Frappe REST API
4. Add project selection for multi-project users
5. Update UI to accommodate project-specific configurations
6. Enhance attachment handling for Frappe storage

## Testing Scenarios

1. **User Permission Tests**:
   - Test user access across different projects
   - Verify departmental access restrictions
   - Confirm regional access boundaries
   - Test escalation across administrative levels

2. **Data Migration Tests**:
   - Verify field mapping correctness
   - Check relationship preservation
   - Validate encryption of sensitive data
   - Test attachment migration

3. **Mobile Sync Tests**:
   - Test bidirectional synchronization
   - Verify offline functionality
   - Test conflict resolution
   - Measure sync performance

4. **Workflow Tests**:
   - Test complete issue lifecycle
   - Verify status transitions
   - Test assignment and reassignment
   - Validate notification delivery

## Implementation Guidelines

### DocType Creation

1. Create DocTypes in this order:
   - GRM Project
   - GRM Administrative Level Type
   - GRM Administrative Region
   - GRM Issue Department
   - GRM Issue Status
   - GRM Issue Type
   - GRM Issue Category
   - GRM Issue Age Group
   - GRM Issue Citizen Group
   - GRM User Project Assignment
   - GRM Issue (with child tables)

2. For each DocType:
   - Set appropriate "Is Submittable" flag where needed
   - Configure naming series patterns
   - Set up default filters and sorting
   - Create appropriate indexes for performance

### Permission Setup

1. Create the required roles:
   - GRM Administrator
   - GRM Project Manager
   - GRM Department Head
   - GRM Field Officer
   - GRM Analyst

2. Set up DocType permissions in Role Permission Manager:
   - Configure basic CRUD permissions by role
   - Set document-level permissions
   - Configure field-level permissions for sensitive data

3. Implement custom permission logic:
   - Create server scripts for permission filtering
   - Configure appropriate hooks in hooks.py
   - Test permission scenarios thoroughly

### API Development

1. Use Frappe REST API framework for standard CRUD operations
2. Create custom endpoints for:
   - Configuration synchronization
   - Batch issue synchronization
   - Attachment handling
   - Search and filtering

3. Implement authentication with:
   - Token-based auth for mobile app
   - Appropriate session timeouts
   - Rate limiting for security

### Encryption Implementation

1. Use Frappe's encryption utilities for sensitive data:
   - Citizen personal information
   - Contact details
   - Any other confidential data

2. Implement proper key management
3. Ensure encrypted data can be properly searched and filtered

## Conclusion

This document provides a comprehensive guide for migrating the GRM system from CouchDB to Frappe while enhancing it with multi-project support and improved permission management. The implementation team should follow these specifications to ensure a successful migration, with appropriate adjustments as needed during the development process.

By implementing this architecture, the GRM system will gain:
- The ability to support multiple projects in a SaaS model
- Enhanced permission controls based on projects, departments, and regions
- Improved data security through proper encryption
- Better scalability through Frappe's enterprise-grade backend
- Enhanced synchronization for mobile app users
- Greater configurability for different project needs
- Comprehensive reporting and analytics capabilities

```

## Task

Create the implementation files for all required DocTypes in the correct sequence, starting with child tables and dependencies first. For each DocType, provide the exact files needed to implement it in my Frappe app.

## Requirements

1. Create all files directly in the `/Users/victor/egrm/apps/egrm` directory structure
2. Follow the correct Frappe app structure for DocTypes:
   - JSON definition should go in `/Users/victor/egrm/apps/egrm/egrm/doctype/[doctype_name]/[doctype_name].json`
   - Controller methods should go in `/Users/victor/egrm/apps/egrm/egrm/doctype/[doctype_name]/[doctype_name].py`

3. Process DocTypes in the correct sequence to ensure dependencies are satisfied:
   - Start with child tables (GRM Issue Attachment, GRM Issue Log, etc.)
   - Then create DocTypes without dependencies (GRM Project, GRM Administrative Level Type)
   - Then create DocTypes with simple dependencies
   - Finally create the core GRM Issue DocType with all dependencies

4. Include proper controller methods in the Python files for:
   - Field validation
   - Permission checks
   - Business logic
   - Any required hooks

5. For each DocType, include all required fields and properties exactly as specified in the documentation

## Output Format

For each DocType, provide:

1. Create th exact file in the file path per the structure
2. The complete file content

Process all DocTypes in sequence, ensuring each DocType is fully implemented before moving to the next one.

Do not include explanations or commentary about the implementation