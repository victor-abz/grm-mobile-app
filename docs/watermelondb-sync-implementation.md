# WatermelonDB Sync Implementation Plan - Data Synchronization Focus

## Overview
This document provides a comprehensive implementation plan for WatermelonDB-standard sync system focused purely on data synchronization between the GRM mobile app and Frappe backend. The implementation follows the official WatermelonDB sync protocol to ensure reliable offline-first functionality with proper user permissions.

## Backend Modifications (Frappe)

### 1. Replace Current Sync API (`/Users/victor/egrm/apps/egrm/egrm/api/sync.py`)

**Task**: Completely rewrite sync.py to implement WatermelonDB sync protocol

**Simplified Sync Approach**:
- **No schema versioning complexity** - rely on field alignment for compatibility
- Use existing Frappe creation/modified timestamps for change tracking
- Handle sync errors gracefully with proper logging
- Focus on data synchronization rather than schema validation

**Requirements**:
- Implement pullChanges as GET endpoint with query parameters per WatermelonDB spec
- Implement pushChanges as POST endpoint that returns void on success
- Use Frappe's `creation` and `modified` timestamp fields for change tracking
- Implement proper Frappe authentication patterns with existing user session
- Add comprehensive error handling using Frappe's standard error response format
- Ensure atomic operations using Frappe's transaction management
- Add conflict detection using Frappe's document versioning system

**Implementation Details**:

#### pullChanges Endpoint
```python
@frappe.whitelist()
def pull_changes(last_pulled_at=None):
    """
    WatermelonDB standard pullChanges endpoint - GET with query parameters
    
    URL: /api/method/egrm.api.sync.pull_changes?lastPulledAt=<timestamp>
    Method: GET
    
    Returns:
    {
        "changes": {
            "grm_issues": {
                "created": [raw_record, ...],
                "updated": [raw_record, ...],
                "deleted": ["id1", "id2", ...]
            },
            "grm_issue_categories": {
                "created": [...],
                "updated": [...], 
                "deleted": [...]
            }
            // ... other tables
        },
        "timestamp": "2024-01-01T00:00:00.000Z"
    }
    """
    
    # Get query parameters - simplified approach
    last_pulled_at = frappe.request.args.get('lastPulledAt')
    
    # Validate and parse timestamp
    if last_pulled_at:
        try:
            last_sync_time = frappe.utils.get_datetime(last_pulled_at)
        except Exception as e:
            frappe.throw(f"Invalid lastPulledAt timestamp: {last_pulled_at}")
    else:
        # First sync - get all data from beginning
        last_sync_time = frappe.utils.datetime.datetime.min
    
    try:
        # Get all changes since last sync
        changes = get_changes_since(last_sync_time)
        current_timestamp = frappe.utils.now()
        
        return {
            "changes": changes,
            "timestamp": current_timestamp
        }
        
    except Exception as e:
        frappe.log_error(f"Pull changes failed: {str(e)}")
        frappe.throw("Sync failed. Please try again.")

def get_changes_since(last_sync_time):
    """Get all changes since last sync time with user permissions"""
    
    # Define all sync tables
    SYNC_TABLES = [
        'GRM Issue',
        'GRM Issue Category', 
        'GRM Issue Type',
        'GRM Issue Status',
        'GRM Administrative Region',
        'GRM Issue Age Group',
        'GRM Issue Citizen Group',
        'GRM Issue Department',
        'GRM Project',
        "GRM Project Link",
    ]
    
    changes = {}
    
    for doctype in SYNC_TABLES:
        try:
            # Get created records (creation > last_sync_time)
            created_records = frappe.get_list(
                doctype,
                filters={'creation': ['>', last_sync_time]},
                fields=['*'],
                ignore_permissions=False  # Respect user permissions
            )
            
            # Get updated records (modified > last_sync_time AND creation <= last_sync_time)
            updated_records = frappe.get_list(
                doctype,
                filters=[
                    ['modified', '>', last_sync_time],
                    ['creation', '<=', last_sync_time]
                ],
                fields=['*'],
                ignore_permissions=False
            )
            
            # Get deleted records from Frappe's deleted documents table
            deleted_ids = get_deleted_records(doctype, last_sync_time)
            
            # Convert to WatermelonDB format
            table_name = doctype_to_table_name(doctype)
            changes[table_name] = {
                'created': [frappe_to_watermelon_raw(rec) for rec in created_records],
                'updated': [frappe_to_watermelon_raw(rec) for rec in updated_records],
                'deleted': deleted_ids
            }
            
        except Exception as e:
            frappe.log_error(f"Error getting changes for {doctype}: {str(e)}")
            # Continue with other tables even if one fails
            continue
    
    return changes

def doctype_to_table_name(doctype):
    """Convert Frappe DocType name to WatermelonDB table name"""
    mapping = {
        'GRM Issue': 'grm_issues',
        'GRM Issue Category': 'grm_issue_categories',
        'GRM Issue Type': 'grm_issue_types',
        'GRM Issue Status': 'grm_issue_statuses',
        'GRM Administrative Region': 'grm_administrative_regions',
        'GRM Issue Age Group': 'grm_issue_age_groups',
        'GRM Issue Citizen Group': 'grm_issue_citizen_groups',
        'GRM Issue Department': 'grm_issue_departments',
        'GRM Project': 'grm_projects',
    }
    return mapping.get(doctype, doctype.lower().replace(' ', '_'))
```

#### pushChanges Endpoint
```python
@frappe.whitelist()
def push_changes():
    """
    WatermelonDB standard pushChanges endpoint
    
    Method: POST
    Body: {
        "changes": {...},
        "lastPulledAt": "timestamp"
    }
    
    Returns: void (204 No Content) on success, HTTP error on failure
    """
    
    # Get JSON data from request body
    data = 
    changes = data.get('changes', {})
    last_pulled_at = data.get('lastPulledAt')
    
    # Process changes in transaction
    try:
        # Use Frappe's database transaction
        frappe.db.begin()
        
        for table_name, table_changes in changes.items():
            process_table_changes(table_name, table_changes)
        
        frappe.db.commit()
        
        # Return void - no response data needed per WatermelonDB spec
        frappe.response.http_status_code = 204
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Push changes failed: {str(e)}")
        frappe.throw("Failed to save changes. Please try again.")

def process_table_changes(table_name, table_changes):
    """Process changes for a specific table"""
    
    # Convert table name back to DocType
    doctype = table_name_to_doctype(table_name)
    if not doctype:
        frappe.log_error(f"Unknown table name: {table_name}")
        return
    
    # Process created records
    for raw_record in table_changes.get('created', []):
        try:
            create_record(doctype, raw_record)
        except Exception as e:
            frappe.log_error(f"Failed to create {doctype} record: {str(e)}")
            raise
    
    # Process updated records  
    for raw_record in table_changes.get('updated', []):
        try:
            update_record(doctype, raw_record)
        except Exception as e:
            frappe.log_error(f"Failed to update {doctype} record: {str(e)}")
            raise
    
    # Process deleted records
    for record_id in table_changes.get('deleted', []):
        try:
            delete_record(doctype, record_id)
        except Exception as e:
            frappe.log_error(f"Failed to delete {doctype} record {record_id}: {str(e)}")
            # Don't raise for delete failures - record might already be deleted

def table_name_to_doctype(table_name):
    """Convert WatermelonDB table name to Frappe DocType"""
    mapping = {
        'grm_issues': 'GRM Issue',
        'grm_issue_categories': 'GRM Issue Category',
        'grm_issue_types': 'GRM Issue Type',
        'grm_issue_statuses': 'GRM Issue Status',
        'grm_administrative_regions': 'GRM Administrative Region',
        'grm_issue_age_groups': 'GRM Issue Age Group',
        'grm_issue_citizen_groups': 'GRM Issue Citizen Group',
        'grm_issue_departments': 'GRM Issue Department',
        'grm_projects': 'GRM Project',
    }
    return mapping.get(table_name)

def create_record(doctype, raw_record):
    """Create new record from WatermelonDB data"""
    frappe_data = watermelon_to_frappe_data(raw_record)
    
    # Create new document
    doc = frappe.new_doc(doctype)
    
    # Set the name to WatermelonDB ID for consistency
    doc.name = raw_record.get('id')
    
    # Set all fields
    for field, value in frappe_data.items():
        if hasattr(doc, field) and field not in ['name', 'creation', 'modified']:
            setattr(doc, field, value)
    
    # Mark as sync operation to bypass some validations if needed
    doc._from_sync = True
    
    # Insert the document
    doc.insert(ignore_permissions=False)  # Respect permissions
    
def update_record(doctype, raw_record):
    """Update existing record with WatermelonDB data"""
    record_id = raw_record.get('id')
    if not record_id:
        raise ValueError("Missing record ID for update")
    
    # Check if record exists and user has permission
    if not frappe.db.exists(doctype, record_id):
        raise ValueError(f"Record {record_id} not found or no permission")
    
    frappe_data = watermelon_to_frappe_data(raw_record)
    
    # Get existing document
    doc = frappe.get_doc(doctype, record_id)
    
    # Update fields
    for field, value in frappe_data.items():
        if hasattr(doc, field) and field not in ['name', 'creation']:
            setattr(doc, field, value)
    
    # Mark as sync operation
    doc._from_sync = True
    
    # Save the document
    doc.save(ignore_permissions=False)

def delete_record(doctype, record_id):
    """Delete record (soft delete)"""
    if not frappe.db.exists(doctype, record_id):
        # Record already deleted or doesn't exist
        return
    
    try:
        doc = frappe.get_doc(doctype, record_id)
        doc._from_sync = True
        doc.delete()
    except frappe.PermissionError:
        frappe.log_error(f"No permission to delete {doctype} {record_id}")
        # Don't raise - just log the issue
```

**Senior Programming Patterns**:
- Use Frappe's built-in repository pattern via DocType classes
- Implement Frappe's transaction pattern for atomic operations
- Apply Frappe's permission strategy for different user types
- Use Frappe's field mapping adapter for WatermelonDB-to-Frappe conversion

**KISS/DRY/YAGNI Compliance**:
- Leverage Frappe's existing endpoint patterns
- Reuse Frappe's built-in permission checking functions
- Don't implement custom features until needed
- Focus on core sync functionality using Frappe standards

**Documentation Requirements**:
- Follow WatermelonDB sync backend documentation exactly
- Use Frappe API development patterns from official docs
- Document all field mappings between WatermelonDB and Frappe schemas
- Include Frappe-standard error handling specifications

**Field Verification Requirements**:
- **MANDATORY:** Check actual GRM Issue doctype definition in Frappe before mapping
- **MANDATORY:** Verify all lookup table field names exist in Frappe
- **MANDATORY:** Validate that `creation` and `modified` fields exist in all doctypes
- **MANDATORY:** Confirm Frappe user permission field structure

### 2. Update GRM Issue DocType (`/Users/victor/egrm/apps/egrm/egrm/egrm/doctype/grm_issue/grm_issue.py`)

**Task**: Make GRM Issue fully sync-compatible

**CRITICAL FIXES:**
- **WRONG:** Custom ID handling with external ID attributes
- **CORRECT:** Use Frappe's native naming series or allow custom names via naming_series
- **WRONG:** Complex field mapping dictionaries
- **CORRECT:** Direct field assignment using Frappe's built-in field validation

**Requirements**:
- Implement Frappe's standard naming series for WatermelonDB-generated IDs
- Use Frappe's native field validation and transformation patterns
- Add sync-specific validation using Frappe's validation hooks
- Handle create and update operations using Frappe's standard patterns
- Implement conflict resolution using Frappe's version control system
- Add proper error handling using Frappe's exception patterns

**Implementation Details**:

#### ID Handling Strategy
```python
def autoname(self):
    """Use WatermelonDB ID if provided, otherwise use Frappe naming series"""
    # Check if coming from sync with custom ID
    if hasattr(self, '_watermelon_id') and self._watermelon_id:
        # Use WatermelonDB-generated ID directly
        self.name = self._watermelon_id
    else:
        # Use Frappe's standard naming series
        from frappe.model.naming import make_autoname
        self.name = make_autoname(self.naming_series)
        
def validate(self):
    """Frappe standard validation with sync compatibility"""
    # Run existing validation logic
    super().validate()
    
    # Additional sync-specific validation
    if self.is_sync_operation():
        self.validate_sync_data()
        
def is_sync_operation(self):
    """Check if this operation is coming from sync"""
    return hasattr(self, '_from_sync') and self._from_sync
```

#### Field Alignment Strategy (ELIMINATE MAPPING COMPLEXITY)
**CRITICAL**: Verify WatermelonDB fields match Frappe exactly, fix mismatches:
**NOTE** ENsure you reset the migration to version 1, assumin g we are starting from scratch, all apps will reset. then the schema will be with corrected data.

**Step 1 - Field Verification (CRITICAL MISMATCHES IDENTIFIED)**:

**CONFIRMED FIELD MISMATCHES:**
Based on actual Frappe GRM Issue doctype (`grm_issue.json`) and WatermelonDB schema (`schema.js`):

| WatermelonDB Field | Frappe Field | Status | Action Required |
|-------------------|--------------|--------|-----------------|
| `project_id` | `project` | ❌ MISMATCH | Update schema to `project` |
| `category_id` | `category` | ❌ MISMATCH | Update schema to `category` |
| `issue_type_id` | `issue_type` | ❌ MISMATCH | Update schema to `issue_type` |
| `status_id` | `status` | ❌ MISMATCH | Update schema to `status` |
| `citizen_age_group_id` | `citizen_age_group` | ❌ MISMATCH | Update schema to `citizen_age_group` |
| `citizen_group_1_id` | `citizen_group_1` | ❌ MISMATCH | Update schema to `citizen_group_1` |
| `citizen_group_2_id` | `citizen_group_2` | ❌ MISMATCH | Update schema to `citizen_group_2` |
| `reporter_id` | `reporter` | ❌ MISMATCH | Update schema to `reporter` |
| `assignee_id` | `assignee` | ❌ MISMATCH | Update schema to `assignee` |
| `administrative_region_id` | `administrative_region` | ❌ MISMATCH | Update schema to `administrative_region` |
| `amended_from_id` | `amended_from` | ❌ MISMATCH | Update schema to `amended_from` |

**Field Verification Function**:
```python
def verify_field_alignment():
    """Verify WatermelonDB schema matches Frappe doctype fields"""
    
    # Actual Frappe GRM Issue fields (from grm_issue.json)
    frappe_fields = [
        'project', 'issue_date', 'intake_date', 'category', 'issue_type', 'status',
        'tracking_code', 'description', 'issue_location', 'citizen_type', 'citizen',
        'gender', 'contact_medium', 'contact_info_type',
        'contact_information', 'citizen_age_group',
        'citizen_group_1', 'citizen_group_2', 'reporter', 'assignee', 
        'administrative_region', 'resolution_days', 'resolution_date',
        'resolution_accepted', 'rating', 'escalate_flag', 'confirmed',
        'amended_from', 'accepted_date', 'reject_reason', 'rejected_date',
        'rejected_by', 'escalated_date', 'escalated_by', 'escalation_reason',
        'resolution_text', 'resolved_by', 'rated_date', 'appeal_submitted',
        'appeal_date',
        # Standard Frappe timestamp fields (CRITICAL FOR SYNC)
        'creation', 'modified'
    ]
    
    # Current WatermelonDB fields (from schema.js) - THESE ARE WRONG
    watermelon_fields = [
        'project_id', 'category_id', 'issue_type_id', 'status_id',
        'citizen_age_group_id', 'citizen_group_1_id', 'citizen_group_2_id',
        'reporter_id', 'assignee_id', 'administrative_region_id', 'amended_from_id'
    ]
    
    # ALL of these WatermelonDB fields need to be updated to remove '_id' suffix
    mismatches = []
    for wm_field in watermelon_fields:
        expected_frappe_field = wm_field.replace('_id', '')
        if expected_frappe_field in frappe_fields:
            mismatches.append({
                'watermelon_current': wm_field,
                'frappe_correct': expected_frappe_field,
                'action': f'Change {wm_field} to {expected_frappe_field}'
            })
    
    return mismatches
```

**Step 2 - Fix Mismatched Fields (COMPLETE SCHEMA UPDATE)**:

**CRITICAL DATABASE MIGRATION REQUIRED**
All these fields must be updated in WatermelonDB schema with proper migration:
**NOTE** Ensure you reset the migration to version 1, assumin g we are starting from scratch, all apps will reset. then the schema will be with corrected data.
```javascript
// Required changes to src/database/schema.js - grm_issues table
// BEFORE (CURRENT - WRONG):
{ name: 'project_id', type: 'string', isIndexed: true },
{ name: 'category_id', type: 'string', isIndexed: true },
{ name: 'issue_type_id', type: 'string', isIndexed: true },
{ name: 'status_id', type: 'string', isIndexed: true },
{ name: 'citizen_age_group_id', type: 'string', isOptional: true, isIndexed: true },
{ name: 'citizen_group_1_id', type: 'string', isOptional: true, isIndexed: true },
{ name: 'citizen_group_2_id', type: 'string', isOptional: true, isIndexed: true },
{ name: 'reporter_id', type: 'string', isIndexed: true },
{ name: 'assignee_id', type: 'string', isOptional: true, isIndexed: true },
{ name: 'administrative_region_id', type: 'string', isIndexed: true },
{ name: 'amended_from_id', type: 'string', isOptional: true, isIndexed: true },
{ name: 'rejected_by', type: 'string', isOptional: true, isIndexed: true },
{ name: 'escalated_by', type: 'string', isOptional: true, isIndexed: true },
{ name: 'resolved_by', type: 'string', isOptional: true, isIndexed: true },

// AFTER (CORRECT - MATCHES FRAPPE):
{ name: 'project', type: 'string', isIndexed: true },
{ name: 'category', type: 'string', isIndexed: true },
{ name: 'issue_type', type: 'string', isIndexed: true },
{ name: 'status', type: 'string', isIndexed: true },
{ name: 'citizen_age_group', type: 'string', isOptional: true, isIndexed: true },
{ name: 'citizen_group_1', type: 'string', isOptional: true, isIndexed: true },
{ name: 'citizen_group_2', type: 'string', isOptional: true, isIndexed: true },
{ name: 'reporter', type: 'string', isIndexed: true },
{ name: 'assignee', type: 'string', isOptional: true, isIndexed: true },
{ name: 'administrative_region', type: 'string', isIndexed: true },
{ name: 'amended_from', type: 'string', isOptional: true, isIndexed: true },
{ name: 'rejected_by', type: 'string', isOptional: true, isIndexed: true },
{ name: 'escalated_by', type: 'string', isOptional: true, isIndexed: true },
{ name: 'resolved_by', type: 'string', isOptional: true, isIndexed: true },

// ADD STANDARD FRAPPE TIMESTAMP FIELDS (CRITICAL FOR SYNC):
{ name: 'creation', type: 'number' },      // Frappe creation timestamp
{ name: 'modified', type: 'number' },     // Frappe modified timestamp

// Keep existing WatermelonDB timestamps for app functionality:
{ name: 'created_at', type: 'number' },   // WatermelonDB timestamp
{ name: 'updated_at', type: 'number' },   // WatermelonDB timestamp
```

**Database Migration Steps**:
1. Make schema version 1
2. Create the first migration to rename all mismatched fields
3. Update all existing data to use new field names
4. Update model classes to use new field names

**Step 3 - Update All App References (CRITICAL)**:

**MANDATORY**: Update ALL app code that references the old field names:

**Files that MUST be updated**:
- `src/database/models/` - All model getter/setter methods
- `src/screens/` - All screen components that access these fields
- `src/components/` - All components that display or manipulate these fields
- `src/services/DataManager.js` - All data access methods
- `src/services/watermelonManager.js` - All database operations
- `src/hooks/` - Any custom hooks that access these fields
- `src/utils/` - Any utility functions that process these fields

**Field Reference Updates Required**:
```javascript
// Search and replace throughout app codebase:
'project_id' → 'project'
'category_id' → 'category'
'issue_type_id' → 'issue_type'
'status_id' → 'status'
'citizen_age_group_id' → 'citizen_age_group'
'citizen_group_1_id' → 'citizen_group_1'
'citizen_group_2_id' → 'citizen_group_2'
'reporter_id' → 'reporter'
'assignee_id' → 'assignee'
'administrative_region_id' → 'administrative_region'
'amended_from_id' → 'amended_from'
```

**Model Class Updates**:
```javascript
// Update src/database/models/GrmIssue.js
// Change from:
@field('project_id') projectId
@field('category_id') categoryId

// To:
@field('project') project
@field('category') category
```

**Component Updates**:
```javascript
// Update all screen and component files:
// Change from:
issue.projectId
issue.categoryId

// To:
issue.project
issue.category
```

**Step 4 - Update Lookup Table References**:

**CRITICAL**: Also update references in lookup tables and related models:

```javascript
// Update grm_issue_categories table references:
{ name: 'assigned_department_id', type: 'string', isIndexed: true },
// Should become:
{ name: 'assigned_department', type: 'string', isIndexed: true },

// Update grm_administrative_regions table references:
{ name: 'administrative_level_id', type: 'string', isIndexed: true },
{ name: 'parent_region_id', type: 'string', isOptional: true, isIndexed: true },
{ name: 'project_id', type: 'string', isIndexed: true },
// Should become:
{ name: 'administrative_level', type: 'string', isIndexed: true },
{ name: 'parent_region', type: 'string', isOptional: true, isIndexed: true },
{ name: 'project', type: 'string', isIndexed: true },
```

**Step 5 - Direct Field Assignment (No Mapping)**:
```python
def sync_watermelon_data(self, watermelon_record):
    """Direct field assignment - no mapping needed after alignment"""
    
    for field_name, value in watermelon_record.items():
        if field_name.startswith('_'):  # Skip WatermelonDB internal fields
            continue
        if hasattr(self, field_name):  # Direct assignment since fields match
            setattr(self, field_name, value)
```

**Documentation Requirements**:
- **MANDATORY:** Inspect actual GRM Issue doctype fields in running Frappe instance
- **MANDATORY:** Verify field types, constraints, and naming patterns in Frappe
- **MANDATORY:** Validate that no fields are hallucinated or assumed

### 4. Direct Data Sync (No Transformation Layer Needed)

**Task**: Eliminate transformation complexity through field alignment

**Requirements**:
- Use WatermelonDB's standard raw record format directly
- Handle only essential WatermelonDB metadata fields (_status, _changed)
- Convert only timestamp formats between milliseconds and datetime
- Rely on Frappe's built-in field validation
- Use WatermelonDB's native sync protocol without custom transformations

**Implementation Details**:

#### Minimal Data Conversion (Timestamps Only)
```python
def frappe_to_watermelon_raw(frappe_doc):
    """Convert Frappe document to WatermelonDB raw format - MINIMAL TRANSFORMATION"""
    raw_record = {
        'id': frappe_doc.name,  # Use Frappe name as WatermelonDB ID
        '_status': 'synced',    # WatermelonDB sync status
        '_changed': '',         # WatermelonDB change tracking
    }
    
    # Direct field copy - no transformation needed after schema alignment
    for field in frappe_doc.meta.fields:
        field_name = field.fieldname
        value = getattr(frappe_doc, field_name, None)
        
        # Only convert timestamps - everything else copies directly
        if field.fieldtype in ['Datetime', 'Date'] and value:
            raw_record[field_name] = int(frappe.utils.get_timestamp(value) * 1000)
        else:
            raw_record[field_name] = value
    
    # Add standard timestamps for WatermelonDB and sync tracking
    raw_record['created_at'] = int(frappe.utils.get_timestamp(frappe_doc.creation) * 1000)
    raw_record['updated_at'] = int(frappe.utils.get_timestamp(frappe_doc.modified) * 1000)
    raw_record['creation'] = int(frappe.utils.get_timestamp(frappe_doc.creation) * 1000)
    raw_record['modified'] = int(frappe.utils.get_timestamp(frappe_doc.modified) * 1000)
    
    return raw_record

def watermelon_to_frappe_data(raw_record):
    """Convert WatermelonDB raw record to Frappe data - MINIMAL TRANSFORMATION"""
    frappe_data = {}
    
    # Direct field copy - no complex transformation needed
    for key, value in raw_record.items():
        if key.startswith('_'):  # Skip WatermelonDB internal fields
            continue
            
        # Only convert timestamp fields back to datetime
        if key in ['creation', 'modified', 'issue_date', 'intake_date', 'resolution_date', 'accepted_date', 'rejected_date', 'escalated_date', 'rated_date', 'appeal_date']:
            if value and isinstance(value, (int, float)):
                frappe_data[key] = frappe.utils.get_datetime(value / 1000)
        else:
            # Direct assignment - fields already aligned
            frappe_data[key] = value
    
    return frappe_data
```

**Why This Works:**
- Field names are identical after schema alignment
- Only timestamps need conversion between formats
- WatermelonDB handles its own metadata fields
- Frappe handles its own validation and business logic
- No complex mapping dictionaries or field transformations needed


## Mobile App Modifications

### 6. Create WatermelonDB Sync Manager (`/Users/victor/Documents/dev/grm-mobile-app/src/services/WatermelonSyncManager.js`)

**Task**: Implement official WatermelonDB sync following exact protocol


**Requirements**:
- Implement WatermelonDB's synchronize() function exactly as documented
- Use WatermelonDB's built-in error handling and logging
- Integrate with existing app authentication system
- Add minimal status tracking for UI updates only
- Implement proper network request patterns matching app standards
- Add basic conflict resolution using WatermelonDB defaults
- Use WatermelonDB's standard sync queue management

**Implementation Details**:

```javascript
import { synchronize } from '@nozbe/watermelondb/sync';

class WatermelonSyncManager {
    constructor(database, frappeCall) {
        this.database = database;
        this.frappeCall = frappeCall; // Use Frappe SDK call instance from FrappeProvider
        this.syncInProgress = false;
        this.lastSyncTimestamp = null;
        this.syncListeners = [];
    }

    async sync() {
        if (this.syncInProgress) {
            throw new Error('Sync already in progress');
        }

        this.syncInProgress = true;
        this.notifyListeners({ phase: 'starting' });

        try {
            // Use WatermelonDB's standard synchronize function - simplified
            await synchronize({
                database: this.database,
                pullChanges: this.pullChanges.bind(this),
                pushChanges: this.pushChanges.bind(this),
                // Use current schema version but don't validate compatibility
                migrationsEnabledAtVersion: this.database.schema.version,
            });

            this.lastSyncTimestamp = new Date().toISOString();
            this.notifyListeners({ 
                phase: 'completed',
                lastSync: this.lastSyncTimestamp 
            });
        } catch (error) {
            this.notifyListeners({ 
                phase: 'error', 
                error: error.message 
            });
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    async pullChanges({ lastPulledAt }) {
        // Use GET request with query parameters per WatermelonDB spec
        try {
            const params = {
                lastPulledAt: lastPulledAt || '',
            };
            
            // Use GET request with query parameters per WatermelonDB spec
            const response = await this.frappeCall.get('egrm.api.sync.pull_changes', params);

            return {
                changes: response.message.changes,
                timestamp: response.message.timestamp,
            };
        } catch (error) {
            console.error('Pull changes failed:', error);
            throw new Error(`Pull failed: ${error.message}`);
        }
    }

    async pushChanges({ changes, lastPulledAt }) {
        // Use Frappe SDK for API calls instead of fetch
        try {
            await this.frappeCall.post('egrm.api.sync.push_changes', {
                changes,
                lastPulledAt,
            });
            
            // No return value expected from pushChanges per WatermelonDB spec
        } catch (error) {
            console.error('Push changes failed:', error);
            throw new Error(`Push failed: ${error.message}`);
        }
    }

    // Simple listener management for UI updates
    addSyncListener(listener) {
        this.syncListeners.push(listener);
    }

    removeSyncListener(listener) {
        const index = this.syncListeners.indexOf(listener);
        if (index > -1) {
            this.syncListeners.splice(index, 1);
        }
    }

    notifyListeners(status) {
        this.syncListeners.forEach(listener => {
            try {
                listener(status);
            } catch (error) {
                console.error('Error notifying sync listener:', error);
            }
        });
    }
}

export default WatermelonSyncManager;
```

**Documentation Requirements**:
- **MANDATORY:** Follow WatermelonDB sync frontend documentation exactly
- **MANDATORY:** Use existing app authentication patterns from AuthProvider

### 7. Update WatermelonManager (`/Users/victor/Documents/dev/grm-mobile-app/src/database/watermelonManager.js`)

**Task**: Make WatermelonManager sync-compatible

**Requirements**:
- Remove all custom sync methods (bulkUpsertIssues, bulkUpsertLookupData, etc.)
- Implement WatermelonDB-standard data operations only
- Add sync metadata handling for all operations
- Implement proper data transformation for sync protocol
- Add validation for all data operations
- Ensure compatibility with WatermelonDB sync requirements
- Add comprehensive error handling

**Implementation Details**:

```javascript
class WatermelonManager {
    constructor() {
        this.database = null;
        this.isInitialized = false;
        this._initializeDatabase();
    }

    // Remove these methods - they conflict with WatermelonDB sync:
    // - bulkUpsertIssues
    // - bulkUpsertLookupData
    // - syncLookupData
    // - All custom sync-related methods

    // Keep only standard data operations:
    async getIssues(filters = {}) {
        // Standard WatermelonDB query operations only
    }

    async createIssue(issueData) {
        // Standard WatermelonDB create operations only
        // Let sync handle backend communication
    }

    // ... other standard CRUD operations
}
```

**Documentation Requirements**:
- Check current WatermelonManager implementation
- Identify all custom sync methods to remove
- Verify standard WatermelonDB operation patterns
- Document data operation changes

### 8. Replace DataManager Sync Logic (`/Users/victor/Documents/dev/grm-mobile-app/src/services/DataManager.js`)

**Task**: Integrate with new WatermelonDB sync system

**Requirements**:
- Remove all custom sync implementations (syncLookupData, performSync, etc.)
- Replace with WatermelonSyncManager calls for all sync operations
- Update sync status reporting to use WatermelonDB sync status
- Maintain existing non-sync functionality (search, filters, etc.)
- Add proper error handling and user feedback
- Implement sync trigger management

**Implementation Details**:

```javascript
import WatermelonSyncManager from './WatermelonSyncManager';

class DataManager {
    constructor() {
        // ... existing initialization
        this.syncManager = null;
    }

    async initialize(credentials = null) {
        // ... existing initialization
        
        // Initialize sync manager using Frappe SDK
        if (credentials && this.call) {
            this.syncManager = new WatermelonSyncManager(
                watermelonManager.getDatabase(),
                this.call  // Pass Frappe SDK call instance from FrappeProvider
            );
        }
    }

    // Remove these methods - replace with sync manager:
    // - syncLookupData
    // - performSync
    // - getInitialUserData
    // - All custom sync methods

    // Replace with:
    async performSync() {
        if (!this.syncManager) {
            throw new Error('Sync manager not initialized');
        }
        return await this.syncManager.sync();
    }

    getSyncStatus() {
        return this.syncManager ? this.syncManager.getSyncStatus() : { isActive: false };
    }

    // Keep all non-sync methods unchanged:
    // - getIssues, getIssue, createIssue, etc.
    // - All lookup data methods
    // - Search, filters, statistics
}
```

### 9. Update SyncAttachments Screen

**Task**: Create sync management UI

**Task**: Create comprehensive sync management UI

**Requirements**:
- Replace current sync logic with WatermelonSyncManager calls
- Add real-time sync status display with progress indicators
- Implement manual sync triggers with user feedback
- Add sync history and statistics display
- Implement conflict resolution UI for user intervention
- Add sync diagnostics and error reporting
- Show pending changes and sync queue status
- Add network status monitoring and offline indicators

**Implementation Details**:

```javascript
function SyncAttachments({ navigation }) {
    const { dataManager } = useContext(DataContext);
    const [syncStatus, setSyncStatus] = useState({
        isActive: false,
        phase: 'idle',
        error: null,
        lastSync: null,
    });

    useEffect(() => {
        const handleSyncStatus = (status) => {
            setSyncStatus(prev => ({ ...prev, ...status }));
        };

        if (dataManager.syncManager) {
            dataManager.syncManager.addSyncListener(handleSyncStatus);
        }

        return () => {
            if (dataManager.syncManager) {
                dataManager.syncManager.removeSyncListener(handleSyncStatus);
            }
        };
    }, [dataManager]);

    const handleManualSync = async () => {
        try {
            setSyncStatus(prev => ({ ...prev, error: null }));
            await dataManager.performSync();
        } catch (error) {
            // Handle sync error
            console.error('Manual sync failed:', error);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Sync Status Display */}
            <Card style={{ margin: 16, padding: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                    Sync Status
                </Text>
                <Text>Status: {syncStatus.phase}</Text>
                <Text>Progress: {syncStatus.progress}%</Text>
                {syncStatus.lastSync && (
                    <Text>Last Sync: {new Date(syncStatus.lastSync).toLocaleString()}</Text>
                )}
                {syncStatus.error && (
                    <Text style={{ color: 'red' }}>Error: {syncStatus.error}</Text>
                )}
            </Card>

            {/* Manual Sync Button */}
            <CustomGreenButton
                title={syncStatus.isActive ? 'Syncing...' : 'Sync Now'}
                onPress={handleManualSync}
                disabled={syncStatus.isActive}
                loading={syncStatus.isActive}
            />

            {/* Progress Indicator */}
            {syncStatus.isActive && (
                <ProgressBar 
                    progress={syncStatus.progress / 100} 
                    style={{ margin: 16 }}
                />
            )}
        </View>
    );
}
```

### 10. Create Sync Provider

**Task**: Centralized sync state management

**Requirements**:
- Provide sync status to all app components
- Handle sync events and notifications
- Manage automatic sync scheduling
- Provide manual sync controls and triggers
- Handle sync errors and user notifications
- Manage sync queue and pending operations

### 11. Update Database Schema

**Task**: Ensure schema is sync-ready with existing fields

**Requirements**:
- Use existing created_at and updated_at columns for sync timestamps
- Add minimal sync metadata columns (_status, _changed) only if needed
- Ensure proper indexing for sync operations
- Add foreign key constraints for data integrity
- Validate column naming matches backend expectations
- Add proper data types for all sync fields

### 12. Add Offline Operations Queue

**Task**: Manage offline operations for sync

**Requirements**:
- Queue all offline operations for later sync
- Implement operation prioritization and conflict handling
- Add operation validation before queuing
- Implement queue persistence across app restarts
- Add operation retry logic with backoff strategies

## Critical Testing Requirements

### Pre-Implementation Validation
- **MANDATORY:** Validate user permissions work correctly with sync
- **MANDATORY:** Test offline-to-online sync scenarios thoroughly

### Sync Testing Protocol
```javascript
// Test sync compatibility before full implementation
async function validateSyncCompatibility() {
    // 1. Test field alignment
    const testRecord = await frappe.get_doc("GRM Issue", "test-id");
    const requiredFields = ['project', 'category', 'status', 'reporter'];
    
    for (const field of requiredFields) {
        if (!(field in testRecord)) {
            throw new Error(`Critical field '${field}' missing from Frappe data`);
        }
    }
    
    // 2. Test timestamp conversion
    const timestamp = Date.now();
    const converted = frappe.utils.get_datetime(timestamp / 1000);
    const backConverted = frappe.utils.get_timestamp(converted) * 1000;
    
    if (Math.abs(timestamp - backConverted) > 1000) {
        throw new Error("Timestamp conversion accuracy issue");
    }
    
    // 3. Test permissions
    const userRecords = await frappe.get_list("GRM Issue", {
        filters: { "modified": [">", "2024-01-01"] },
        ignore_permissions: false
    });
    
    console.log(`User can access ${userRecords.length} records`);
}
```

## Implementation Guidelines

### WatermelonDB Sync Protocol Compliance
- **Follow official WatermelonDB sync documentation exactly**
- **Implement pullChanges returning {changes, timestamp} format**
- **Implement pushChanges accepting changes object with created/updated/deleted**
- **Use proper WatermelonDB change format with raw record data**
- **Handle sync timestamps correctly for incremental sync using existing creation/modified fields**
- **Implement proper error handling as per WatermelonDB specifications**

### Leverage Existing Infrastructure
- **Use existing Frappe creation and modified timestamps for change tracking**
- **Build upon existing get_user_data endpoint by adding date filtering**
- **Leverage existing permission system and user assignments**
- **Utilize existing role-based access control already implemented**
- **Reuse existing error handling patterns**

### Senior Programming Patterns
- **Use repository pattern for data access abstraction**
- **Implement observer pattern for sync status notifications**
- **Apply command pattern for queued operations**
- **Use strategy pattern for different sync strategies**
- **Implement factory pattern for sync operation creation**
- **Implement Frappe's transaction pattern for atomic operations**
- **Use WatermelonDB's observer pattern for reactive queries**

### KISS, DRY, YAGNI Principles
- **Keep sync logic simple and focused on data transfer**
- **Avoid complex conflict resolution until proven necessary**
- **Reuse existing validation and business logic**
- **Don't over-engineer the sync system**
- **Focus on core sync functionality first**

### Documentation Requirements
- **Check WatermelonDB sync documentation before implementing each method**
- **Follow Frappe API best practices for backend endpoints**
- **Use TypeScript/JSDoc for all new sync-related functions**
- **Document sync data flow and error handling strategies**

### Field Verification Requirements
- **Check actual Frappe doctype fields before mapping**

## Implementation Tasks Checklist

### Backend Tasks
- [ ] **Task 1.1**: Implement pullChanges endpoint in sync.py
- [ ] **Task 1.2**: Implement pushChanges endpoint in sync.py
- [ ] **Task 1.3**: Add data transformation layer
- [ ] **Task 1.4**: Update GRM Issue doctype for sync compatibility
- [ ] **Task 1.5**: Enhance permission system for sync operations

### Mobile App Tasks
- [ ] **Task 2.1**: Create WatermelonSyncManager class
- [ ] **Task 2.2**: Update WatermelonManager to remove custom sync methods
- [ ] **Task 2.3**: Update DataManager to use new sync system
- [ ] **Task 2.4**: Update database schema for sync compatibility
- [ ] **Task 2.5**: Create SyncProvider for state management
- [ ] **Task 2.6**: Update SyncAttachments screen with new UI *(Not Implemented)*
- [ ] **Task 2.7**: Add offline operations queue

### Integration Tasks (Manual by User)
- [ ] **Task 3.1**: Test sync with different user permission levels
- [ ] **Task 3.2**: Validate data integrity across sync operations
- [ ] **Task 3.3**: Test offline-to-online sync scenarios

All implementations must strictly follow the official WatermelonDB sync documentation and protocol specifications while leveraging existing Frappe infrastructure.