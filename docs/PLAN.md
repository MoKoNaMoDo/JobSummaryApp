# Multi-Project (Rooms) Feature

## Overview

เปลี่ยนจาก **Single Project** → **Multi-Project Hub**
- หน้าแรกแสดงรายชื่อทุกโปรเจค + สถิติภาพรวม
- กดเข้าแต่ละโปรเจค → Dashboard แยกกัน (เหมือนตอนนี้)
- **ข้อมูลอยู่ Google Sheet ไฟล์เดียว** แยก Tab โดยตั้งชื่อรูปแบบ `{ProjectSlug}_{MM-YYYY}`

---

## Data Design

### Project Registry
เก็บรายชื่อโปรเจคใน `data/projects.json`:

```json
[
  {
    "id": "abc123",
    "name": "ซ่อมบำรุงตึก A",
    "slug": "building-a",
    "createdAt": "2026-02-21",
    "color": "#6366f1"
  }
]
```

### Google Sheet Tab Naming
```
เดิม:    02-2026
ใหม่:    building-a_02-2026
```
- `slug` สร้างจากชื่อโปรเจค (lowercase, dash-separated)
- ถ้าเป็น Tab ที่มีอยู่แล้ว (โปรเจคเก่าก่อน feature นี้) → migrate ภายหลัง

### Team Members
- **Global** — รายชื่อจาก Settings ใช้ร่วมทุกโปรเจค
- ใน Dropdown เลือก Assignee จะแสดงชื่อจาก Settings + ชื่อที่เจอใน Sheet ของโปรเจคนั้น (auto-detect)

---

## API Changes

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create new project |
| `PATCH` | `/api/projects/:id` | Update project name/color |
| `DELETE` | `/api/projects/:id` | Delete project |

### Modified Endpoints

| Endpoint | Change |
|----------|--------|
| `GET /api/jobs` | เพิ่ม `?projectSlug=building-a` query param |
| `POST /api/jobs` | เพิ่ม `projectSlug` ใน body |
| `PATCH /api/jobs` | ไม่เปลี่ยน (ใช้ `sheetName` เดิม) |
| `PATCH /api/jobs/status` | ไม่เปลี่ยน |
| `DELETE /api/jobs` | ไม่เปลี่ยน |

### Backend Files

| File | Action |
|------|--------|
| **[NEW]** `services/projectService.ts` | CRUD projects.json |
| **[NEW]** `controllers/projectController.ts` | API handlers |
| **[MOD]** `routes.ts` | เพิ่ม `/api/projects` routes |
| **[MOD]** `services/googleService.ts` | เปลี่ยน `sheetName` จาก `MM-YYYY` → `{slug}_MM-YYYY` |
| **[MOD]** `controllers/jobController.ts` | รับ `projectSlug` → ส่ง GoogleService |

---

## Frontend Changes

### Routing

| Route | Page | Description |
|-------|------|-------------|
| `/` | **ProjectsPage** (NEW) | หน้ารวมโปรเจค — Grid cards + สถิติ |
| `/projects/[slug]` | **Dashboard** (เดิม = page.tsx) | Kanban + Metrics ของโปรเจคนั้น |
| `/projects/[slug]/add` | **AddJob** (เดิม = add/page.tsx) | เพิ่มงานเข้าโปรเจค |
| `/settings` | **Settings** (เดิม) | ตั้งค่า Global |

### Frontend Files

| File | Action |
|------|--------|
| **[NEW]** `app/page.tsx` | **Project Hub** — Grid ของโปรเจค |
| **[NEW]** `app/projects/[slug]/page.tsx` | ย้าย Dashboard เดิมมา + รับ `slug` จาก URL |
| **[NEW]** `app/projects/[slug]/add/page.tsx` | ย้าย Add page เดิมมา + ส่ง `slug` ไป API |
| **[NEW]** `components/CreateProjectDialog.tsx` | Modal สร้างโปรเจคใหม่ |
| **[MOD]** `lib/api.ts` | เพิ่ม `projectService` (CRUD) + แก้ `jobService` ส่ง `slug` |
| **[MOD]** `lib/translations.ts` | เพิ่ม keys สำหรับหน้า Projects |
| **[MOD]** `app/layout.tsx` | ปรับ Navigation — "Home" → ไปหน้า Projects |

---

## Implementation Order

```
Phase 1: Backend (Data Layer)
  1. สร้าง projectService.ts + projects.json
  2. สร้าง projectController.ts + routes
  3. แก้ googleService.ts รองรับ slug prefix
  4. แก้ jobController.ts รับ projectSlug

Phase 2: Frontend (Pages)
  5. สร้างหน้า Project Hub (app/page.tsx ใหม่)
  6. ย้าย Dashboard → app/projects/[slug]/page.tsx
  7. ย้าย Add Job → app/projects/[slug]/add/page.tsx
  8. แก้ API client + translations

Phase 3: Polish
  9. Navigation (bottom bar) อัปเดต
  10. i18n keys ใหม่
  11. Build verification
```

---

## Verification

- [ ] สร้างโปรเจคใหม่ได้
- [ ] เข้าหน้า Kanban ของแต่ละโปรเจคแยกกัน
- [ ] เพิ่มงานเข้าถูกโปรเจค (Tab ในชีทตรง)
- [ ] หน้ารวมแสดงสถิติแต่ละโปรเจค
- [ ] Build ผ่าน + TypeScript ผ่าน

> **ประมาณงาน**: Backend ~4 ไฟล์ (2 ใหม่, 2 แก้) + Frontend ~6 ไฟล์ (4 ใหม่, 2 แก้)
