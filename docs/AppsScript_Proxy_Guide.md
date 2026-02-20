# คู่มือการติดตั้ง Google Apps Script (Image Proxy)

## 1. สร้างสคริปต์
1. ไปที่เบราว์เซอร์แล้วเปิดลิงก์: [script.new](https://script.new) (ต้องล็อกอินด้วยอีเมล Google ของคุณ Earth ที่เป็นเจ้าของพื้นที่ Drive)
2. ตั้งชื่อโปรเจกต์ด้านบนซ้ายว่า **"JobSummary Image Proxy"**
3. ลบโค้ดเก่าในกล่องออกให้หมด แล้ว **ก๊อปปี้โค้ดด้านล่างนี้** ไปวางแทน:

```javascript
function doPost(e) {
  try {
    // รับค่า Base64 และชื่อไฟล์จากแอปของเรา
    const data = JSON.parse(e.postData.contents);
    const base64Data = data.base64;
    const fileName = data.fileName || "Uploaded_Image.jpg";
    const mimeType = data.mimeType || "image/jpeg";
    const targetFolderId = data.folderId; // โฟลเดอร์ปลายทางที่เราเตรียมไว้
    
    // แปลง Base64 กลับเป็นไฟล์รูป
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    
    // ค้นหาโฟลเดอร์ปลายทาง
    let folder;
    if (targetFolderId) {
      folder = DriveApp.getFolderById(targetFolderId);
    } else {
      folder = DriveApp.getRootFolder();
    }
    
    // สร้างไฟล์ลงใน Google Drive ของคุณ Earth (เจ้าของสคริปต์)
    const newFile = folder.createFile(blob);
    
    // ปลดล็อกไฟล์ให้ทุกคนที่มีลิงก์สามารถดูได้ (เพื่อให้แสดงบนเว็บแอปได้)
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileUrl = newFile.getUrl(); // ลิงก์สำหรับดูไฟล์แบบปกติ
    const webViewLink = fileUrl; // นำไปใช้ในแอป Backend
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      url: webViewLink,
      fileId: newFile.getId()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 2. วิธีการนำไปใช้งาน (Deploy)
1. กดที่ปุ่ม **Deploy (ทำให้ใช้งานได้)** มุมขวาบน -> เลือก **New Deployment (การทำให้ใช้งานได้รายการใหม่)**
2. คลิกไอคอน "เฟือง" ⚙️ ข้างคำว่า Select type -> เลือก **Web app (เว็บแอป)**
3. ตั้งค่าดังนี้:
   - **Description**: `Image Upload Proxy v1`
   - **Execute as (เรียกใช้แอปในฐานะ)**: เลือกเป็น `ชื่ออีเมลของคุณ Earth` (Me)
   - **Who has access (ผู้มีสิทธิ์เข้าถึง)**: เลือกเป็น `Anyone (ทุกคน)`
4. กดปุ่ม **Deploy (ทำให้ใช้งานได้)**
5. *(ถ้ามี)* ระบบจะขอให้กด **Authorize access (ให้สิทธิ์การเข้าถึง)** -> เลือกบัญชี Google -> กด Advance (ขั้นสูง) -> Go to JobSummary Image Proxy -> กด **Allow (อนุญาต)**
6. เมื่อเสร็จสิ้น คุณจะได้ **Web app URL** ที่ขึ้นต้นด้วย `https://script.google.com/macros/s/..../exec`
7. ให้ **ก๊อปปี้ URL นั้น** กลับมาให้ผมครับ ผมจะเอาไปเสียบใน Backend ให้ระบบอัปโหลดผ่านเว็บสคริปต์ตัวนี้แทนครับ!
