# Google Drive Integration: OAuth 2.0 Architecture Guide
**Status:** Documented for Future Scaling
**Context:** When a service requires end-users to upload files without hitting Service Account storage quotas (0GB limit).

## The Problem with Service Accounts
Service Accounts (`service-account@...iam.gserviceaccount.com`) are bot entities. While they can *edit* spreadsheets owned by a human effortlessly, any brand new file *created* by a Service Account consumes its own distinct Drive Quota. By default, Service Accounts have virtually 0GB of storage. Uploading images via `drive.files.create` will quickly lead to HTTP 403 `Quota Exceeded`. 

This can only be bypassed naturally if the Google Workspace account converts the destination into a **Shared Drive**, which applies the organization's pooled quota instead of the Service Account's individual quota.

## The OAuth 2.0 Solution
To solve this permanently without a Shared Drive or an Apps Script Proxy, the system must shift ownership of the uploaded file to the *User* (the person clicking upload) or the *Admin* via an explicit consent screen.

### Architecture Flow
1. **Frontend Google Login (`react-oauth/google`)**: 
   - Add a "Login with Google" button to the internal Dashboard.
   - User signs in. The app requests the scope: `https://www.googleapis.com/auth/drive.file`.
   
2. **Access Token Generation**:
   - Google returns an `access_token` and `refresh_token` to the Next.js frontend.
   - The frontend passes these tokens to the Node.js backend.
   
3. **Backend Credential Swapping**:
   - The `GoogleService` stops using `google.auth.GoogleAuth` with a `keyFile` (Service Account).
   - Instead, it initializes a generic `google.auth.OAuth2` client.
   - It sets the credentials: `oauth2Client.setCredentials({ access_token: "..." })`.

4. **Upload Execution**:
   - When the backend calls `drive.files.create`, Google registers the upload as coming from the real human user.
   - The image is saved in the human user's Google Drive, consuming their 15GB+ personal quota.
   - The human user's Drive permissions are automatically applied to the file, and the public `webViewLink` is generated.
   
### Implementation Prerequisites
1. Open **Google Cloud Console**.
2. Navigate to **APIs & Services > OAuth consent screen**.
3. Set user type to **Internal** (if organization) or **External** (if public).
4. Go to **Credentials > Create Credentials > OAuth client ID**.
5. Select **Web application**.
6. Set Authorized JavaScript origins to `http://localhost:3000` (and the Vercel domain).
7. Copy the **Client ID** and **Client Secret** into the application's `.env` files.

---
*Document designed to assist future integration if the lightweight proxy approach is retired.*
