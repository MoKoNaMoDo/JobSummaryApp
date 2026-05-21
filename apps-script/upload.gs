/**
 * Google Apps Script — Image Upload Proxy
 * Deploy as: Web App → Execute as: Me → Who has access: Anyone
 *
 * Receives JSON POST from Next.js with:
 *   { base64, fileName, mimeType, folderId }
 * Returns JSON: { status, url } or { status, message }
 */
function doPost(e) {
  try {
    // Parse incoming JSON body
    var raw = e.postData ? e.postData.getDataAsString() : '{}';
    var data = JSON.parse(raw);

    var base64Data = data.base64;
    var fileName   = data.fileName   || ('upload_' + Date.now() + '.jpg');
    var mimeType   = data.mimeType   || 'image/jpeg';
    var folderId   = data.folderId;

    // Validate required fields
    if (!base64Data || base64Data.length === 0) {
      throw new Error('base64 field is missing or empty');
    }
    if (!folderId) {
      throw new Error('folderId is required');
    }

    // Decode base64 → byte array → Blob
    var bytes = Utilities.base64Decode(base64Data);
    var blob  = Utilities.newBlob(bytes, mimeType, fileName);

    // Upload to Drive folder
    var folder = DriveApp.getFolderById(folderId);
    var file   = folder.createFile(blob);

    // Make publicly viewable via link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var url = 'https://drive.google.com/uc?export=view&id=' + file.getId();

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', url: url, id: file.getId() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: handle GET for health check
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Upload proxy is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
