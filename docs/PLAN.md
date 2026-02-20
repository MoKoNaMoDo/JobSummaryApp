# Project Plan: Dynamic Year-Based Spreadsheets

## 1. Executive Summary
The goal is to modify the Job Summary application's data layer to dynamically manage Google Sheets. Instead of using a single hardcoded Spreadsheet file for everything, the system will now automatically create and manage Spreadsheets separated by **Year** (e.g., File: `JobSummary_2026`), and organize the data inside by **Month** (e.g., Tab: `02-2026`). 

**Crucially, this logic will be completely isolated from the old ClearBill system**, ensuring zero impact on legacy code.

## 2. Technical Architecture & Logic
**Workflow when adding/reading a job:**
1. Determine the `Year` and `Month` from the job's date.
2. Search the designated Google Drive Folder for a Spreadsheet file named `JobSummary_{Year}`.
3. **If the file DOES NOT exist:** Create a new Google Spreadsheet file named `JobSummary_{Year}` inside that folder.
4. **If the file DOES exist:** Retrieve its `spreadsheetId`.
5. Connect to that `spreadsheetId` and look for a Tab named `{Month}-{Year}`.
6. **If the Tab DOES NOT exist:** Create the Tab and inject the header row.
7. Append or edit the data in that Tab.

## 3. Orchestration Details (Available Agents)

### Phase 2.1: Database Architect (`database-architect`) & Backend Specialist (`backend-specialist`)
- **Action**: Completely rewrite the `appendToSheet`, `getReimbursements`, `updateRowStatus`, `updateRowData`, and `deleteRow` functions in `backend/src/services/googleService.ts`.
- **Implementation**: 
    - Introduce Google Drive API calls (`drive.files.list`, `drive.files.create`) to discover and spawn Spreadsheets dynamically.
    - Ensure `ConfigService.get('googleDriveFolderId')` is used as the parent directory for all new Spreadsheets.
    - Maintain strict separation so the original ClearBill functions remain untouched (or we duplicate the GoogleService methods specifically for Jobs).

### Phase 2.2: Frontend Specialist (`frontend-specialist`)
- **Action**: Review and adjust `frontend/app/page.tsx` and `frontend/lib/api.ts`.
- **Implementation**: Ensure that when a user interacts with the Kanban board (Edit, Change Status, Delete), the frontend provides enough context (like the `date` string) so the backend can compute the Year and resolve the correct file ID. Ensure loading states gracefully handle the delay of creating a new Google Sheet file.

### Phase 2.3: Test Engineer (`test-engineer`) & Security Auditor (`security-auditor`)
- **Action**: Validate the flow.
- **Implementation**:
    - Run the standard security scan (`security_scan.py`).
    - Run the linter (`lint_runner.py`).
    - Attempt to log a mock job for the year 2027 to verify "next year" file creation works.
