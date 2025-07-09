# Tasks: Issue Actions Sync Implementation

## Relevant Files

- `/Users/victor/egrm/apps/egrm/egrm/api/sync.py` - Backend sync logic extended to handle Issue Actions updates (SYNC_TABLES mapping updated, push_changes filter updated, child table validation added, transaction support verified, timestamp handling implemented)
- `/Users/victor/egrm/apps/egrm/egrm/egrm/doctype/grm_issue/grm_issue.json` - Backend DocType definition for GRM Issue
- `/Users/victor/egrm/apps/egrm/egrm/egrm/doctype/grm_issue_log/grm_issue_log.json` - Backend DocType definition for GRM Issue Log
- `/Users/victor/egrm/apps/egrm/egrm/egrm/doctype/grm_issue_comment/grm_issue_comment.json` - Backend DocType definition for GRM Issue Comment
- `test_issue_actions_sync.py` - Test script with sample Issue Actions sync payloads for backend validation
- `src/services/WatermelonSyncManager.js` - Frontend sync manager extended to handle Issue Actions sync (push filter updated for grm_issues updates and child tables)
- `src/hooks/useIssueActions.js` - Frontend hook for Issue Actions (no changes needed, but referenced)
- `src/database/models/grm_issue.js` - Frontend WatermelonDB model for GRM Issue
- `src/database/models/grm_issue_log.js` - Frontend WatermelonDB model for GRM Issue Log
- `src/database/models/grm_issue_comment.js` - Frontend WatermelonDB model for GRM Issue Comment
- `src/database/schema.js` - Frontend database schema definition

### Notes

- The implementation follows WatermelonDB sync protocol as documented at https://watermelondb.dev/docs/Sync/Frontend
- All timestamp fields must use milliseconds since epoch format for consistency
- Existing Issue Actions functionality in the app works correctly - only sync needs to be added
- Backend currently only accepts `created` records for `grm_issues` - needs to be extended to accept `updated` records

## Tasks

- [x] 1.0 Backend Sync Protocol Extension
  - [x] 1.1 Analyze current backend sync.py structure and identify extension points
  - [x] 1.2 Extend SYNC_TABLES mapping to include grm_issue_logs and grm_issue_comments
  - [x] 1.3 Update push_changes filter to accept Issue Actions updates for grm_issues
  - [x] 1.4 Add child table processing logic for grm_issue_logs and grm_issue_comments
  - [x] 1.5 Implement transaction-based sync for Issue Actions and child records
  - [x] 1.6 Add timestamp handling for Issue Actions fields
  - [x] 1.7 Test backend sync extension with sample data

- [x] 2.0 Frontend Sync Manager Updates
  - [x] 2.1 Analyze current WatermelonSyncManager.js structure
  - [x] 2.2 Extend sync manager to handle Issue Actions sync
  - [x] 2.3 Update push changes logic to include Issue Actions updates
  - [x] 2.4 Ensure child records (logs/comments) are included in sync payload
