# Note: เพิ่ม Icon และรูปให้ Category / Subcategory

วันที่บันทึก: 2026-10-28 — Asia/Vientiane

**สถานะ: ข้อเสนอ / Backlog สำหรับทำภายหลัง — ยังไม่ได้พัฒนาฟีเจอร์นี้**

โน้ตนี้ไม่ใช่คำสั่งให้เริ่มแก้โค้ดหรือฐานข้อมูลอัตโนมัติเมื่อเปิดอ่าน ต้องได้รับคำขอให้ลงมือก่อน
API, ฟิลด์ และชื่อไฟล์ตัวอย่างด้านล่างเป็นแบบที่เสนอ ไม่ใช่สิ่งที่ใช้งานได้แล้ว
การบันทึกโน้ตครั้งนี้ไม่มีการเพิ่มคอลัมน์, Upload ไฟล์, เปลี่ยนข้อมูล หรือ Deploy Backend

## เป้าหมายและข้อเสนอ

- ให้ Admin/Manager เลือก Icon หรือ Upload รูปสำหรับหมวดหลักและหมวดย่อยได้
- ใช้ตาราง `ecommerce.categories` เดิมทุกระดับ โดยคง `_id` และ `parentId` เดิม
- เก็บไฟล์จริงใน Upload storage และเก็บเพียงข้อมูลอ้างอิงใน PostgreSQL ไม่เก็บ Base64 ในแถว Category
- หน้าร้านเลือกแสดง **รูป → Icon → Icon เริ่มต้น** ตามข้อมูลที่มี รวมถึงกรณีโหลดรูปไม่สำเร็จ
- หมวดย่อยมีรูปของตัวเองได้ ไม่บังคับใช้รูปเดียวกับแม่ และไม่สืบทอดรูปแม่โดยอัตโนมัติ
- ถ้าใช้เฉพาะ Icon ไม่ต้อง Upload ไฟล์ ให้ Frontend แปล `iconKey` จากรายการที่อนุญาต

## ฟิลด์ที่เสนอ

| ฟิลด์      | ตำแหน่ง        | ตัวอย่าง                           | หมายเหตุ                                                          |
| ---------- | -------------- | ---------------------------------- | ----------------------------------------------------------------- |
| `iconKey`  | Database       | `laptop`                           | nullable; เป็น key กลางให้ Flutter/เว็บใช้ร่วมกัน                 |
| `imageKey` | Database       | `categories/<generated-uuid>.webp` | nullable; key ที่ Backend สร้าง ไม่ใช่ local absolute path        |
| `imageAlt` | Database       | `ໝວດແລັບທັອບ`                      | nullable; คำอธิบายรูปสำหรับ accessibility                         |
| `imageUrl` | GraphQL output | URL ของไฟล์                        | Backend คำนวณจาก storage configuration; ไม่ต้องเก็บซ้ำใน Database |

เมื่อไม่มี `imageAlt` ให้ Frontend ใช้ชื่อ Category เป็นคำอธิบายที่เหมาะสม
ไม่เก็บ signed URL ที่มีวันหมดอายุเป็น `imageKey`

ตัวอย่างข้อมูลจำลองหลังเพิ่มฟีเจอร์:

```json
{
  "_id": "e06440c7-b8e6-4db9-b3ca-1a1011a285f7",
  "parentId": "97185773-0c7f-419d-a8c9-53a9064e027b",
  "name": "ແລັບທັອບ",
  "iconKey": "laptop",
  "imageKey": "categories/laptop-demo.webp",
  "imageAlt": "ໝວດແລັບທັອບ"
}
```

`laptop-demo.webp` เป็นชื่อสมมติสำหรับอธิบาย; ตอนทำจริงใช้ชื่อที่ Backend สร้าง ไม่ใช้ชื่อไฟล์จากผู้ Upload

## เส้นทางการทำงานที่เสนอ

```text
Admin เลือกรูป
    ↓
POST /api/upload/category-image — ส่ง multipart/form-data ช่อง file
    ↓
ตรวจสิทธิ์ / ตรวจรูป / บันทึกไฟล์ → คืน imageKey และ imageUrl
    ↓
Admin กดบันทึก → createCategory หรือ updateCategory ผ่าน GraphQL
    ↓
Database เก็บ iconKey / imageKey / imageAlt
    ↓
หน้าร้านเรียก categories(input: ...) → ได้ imageUrl → โหลดรูป
```

Upload กับ Save Category เป็นสอง request คนละหน้าที่ ไม่ส่ง Base64 ผ่าน GraphQL
ถ้า Upload ล้มเหลว ห้ามส่ง key ที่ไม่ได้รับการยืนยันไปบันทึก

### API Upload ใหม่ที่เสนอ

```http
POST http://localhost:3001/api/upload/category-image
Authorization: Bearer <ADMIN_OR_MANAGER_ACCESS_TOKEN>
Content-Type: multipart/form-data

file: <ไฟล์รูปที่เลือก>
```

ตัวอย่าง response ที่เสนอ:

```json
{
  "imageKey": "categories/laptop-demo.webp",
  "imageUrl": "http://localhost:3001/uploads/categories/laptop-demo.webp"
}
```

### GraphQL ที่ต้องขยายเมื่อเริ่มทำ

- เพิ่มฟิลด์ที่บันทึกได้ใน `CreateCategoryDto` และ `UpdateCategoryDto`
- เพิ่มฟิลด์และ `imageUrl` ที่คำนวณได้ใน output `Category`
- คง Operation เดิม `categories`, `createCategory`, `updateCategory` และ argument `input`
- คง response รายการ `{items,total,page,limit}` และพฤติกรรม `parentId`/`rootOnly`/`fetchAll`

```graphql
mutation UpdateCategoryMedia($input: UpdateCategoryDto!) {
  updateCategory(input: $input) {
    _id
    name
    iconKey
    imageKey
    imageUrl
    imageAlt
  }
}
```

```json
{
  "input": {
    "_id": "e06440c7-b8e6-4db9-b3ca-1a1011a285f7",
    "iconKey": "laptop",
    "imageKey": "categories/laptop-demo.webp",
    "imageAlt": "ໝວດແລັບທັອບ"
  }
}
```

**ตัวอย่างข้างต้นยังรันกับ schema ปัจจุบันไม่ได้** เพราะฟิลด์สื่อยังไม่ได้เพิ่ม
รูปแบบ update ที่ต้องกำหนด: ไม่ส่งฟิลด์ = คงค่าเดิม; ส่ง `null` = ล้างฟิลด์นั้นโดยตั้งใจ

## ที่อยู่ไฟล์สำหรับพัฒนาในเครื่อง

| ส่วน                  | ที่อยู่ตัวอย่าง                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| ไฟล์จริงบนเครื่อง     | `/Users/ting/Documents/Backend_Architecture/millionx-ecommerce-backend/uploads/categories/laptop-demo.webp` |
| ไฟล์ใน Docker         | `/app/uploads/categories/laptop-demo.webp`                                                                  |
| key ใน Database       | `categories/laptop-demo.webp`                                                                               |
| URL ที่ Frontend โหลด | `http://localhost:3001/uploads/categories/laptop-demo.webp`                                                 |

ปัจจุบันมีการ mount `/Users/ting/Documents/Backend_Architecture/millionx-ecommerce-backend/uploads`
ไปที่ `/app/uploads` อยู่แล้ว และมี static route `/uploads` อยู่แล้ว
Production ควรแยก storage configuration เพื่อย้ายไป Object Storage ได้ และต้องสำรองไฟล์แยกจาก PostgreSQL
ไม่ hard-code `localhost` ในข้อมูล Database; มือถือจริงต้องใช้ host/domain ที่เข้าถึงได้ ไม่ใช่ localhost ของโทรศัพท์

## แนวทางเปลี่ยนหรือลบรูป

- Upload รูปใหม่ก่อน แล้วค่อยบันทึก `imageKey` ใหม่ให้ Category
- อย่าลบรูปเดิมก่อน Save สำเร็จ เพราะถ้าบันทึกไม่ผ่าน Category จะยังต้องใช้รูปเดิม
- ลบไฟล์ที่ไม่ถูกอ้างอิงหลัง commit ผ่านกลไกที่ retry ได้ และตรวจว่าไม่มี Category อื่นใช้ key นั้น
- การล้าง `imageKey` ไม่ลบ Category และไม่เปลี่ยน `parentId`
- ต้องมีแนวทางเก็บกวาดไฟล์ที่ Upload แล้วผู้ใช้ยกเลิก/Save ไม่สำเร็จ เช่น temporary upload + อายุหมดอายุ
- การ Upload และ transaction PostgreSQL ไม่ใช่ transaction เดียวกัน ต้องออกแบบ cleanup ให้ชัดเจน

## ไฟล์/ส่วนงานที่คาดว่าจะเกี่ยวข้อง

ต่อยอดจาก Product upload controller เดิม แต่ไม่คัดลอกการตรวจ MIME อย่างเดียวมาใช้เป็นการป้องกันทั้งหมด

- Controller ใหม่ที่เสนอ: `/Users/ting/Documents/Backend_Architecture/millionx-ecommerce-backend/src/infrastructure/controllers/upload/category-image-upload.controller.ts`
- Entity: `/Users/ting/Documents/Backend_Architecture/millionx-ecommerce-backend/src/infrastructure/entities/category.entity.ts`
- Domain model: `/Users/ting/Documents/Backend_Architecture/millionx-ecommerce-backend/src/domain/models/category.model.ts`
- DTO/output: `/Users/ting/Documents/Backend_Architecture/millionx-ecommerce-backend/src/infrastructure/resolvers/category/category.model.ts`
- Create/Update action และ validation ใต้ `/Users/ting/Documents/Backend_Architecture/millionx-ecommerce-backend/src/infrastructure/repositories/category/`
- Resolver/DI, cache invalidation, Migration, SQL init/verify และ Bruno ตามขอบเขตที่เพิ่มจริง

## Checklist สำหรับลงมือภายหลัง

- [ ] ตกลงรายการ `iconKey` กลางที่ Admin, เว็บ และ Flutter รองรับ
- [ ] กำหนดชนิดรูป ขนาดไฟล์ และขนาดภาพสูงสุด; แนะนำเริ่มจาก JPEG/PNG/WebP
- [ ] ออกแบบ storage service ให้ Upload ได้ key และ resolve เป็น URL ตาม environment
- [ ] ทำ Migration เพิ่ม nullable fields โดยไม่ลบ/สร้าง UUID หรือ reset ข้อมูลเดิม
- [ ] เพิ่ม Entity/Model/DTO/Resolver/Repository action และ validation
- [ ] เพิ่ม Upload API ที่ตรวจ JWT และสิทธิ์ Admin/Manager
- [ ] ตรวจเนื้อหาไฟล์จริง/ลายเซ็นไฟล์และขนาด ไม่เชื่อเพียงนามสกุลหรือ Content-Type; ปฏิเสธ SVG/HTML ในระยะแรก
- [ ] Validate key ว่าเป็นไฟล์ใน Category storage ที่อนุญาต ป้องกัน path traversal และ arbitrary external URL
- [ ] ออกแบบ cleanup สำหรับ replace/delete/cancel/shared file และกรณี Save ล้มเหลว
- [ ] ล้าง Category/catalog cache หลังบันทึกสื่อสำเร็จ
- [ ] เพิ่ม UI Admin: เลือก Icon, Upload/Preview, เปลี่ยนและนำรูปออก
- [ ] เพิ่ม Storefront fallback รูป → Icon → default รวมกรณี URL โหลดไม่ได้
- [ ] เพิ่ม Bruno และ automated tests ครอบคลุม Upload, สิทธิ์, Save, replace/null-clear, failure และ cache
- [ ] ทดสอบ root/subcategory, ลำดับชั้นเดิม, URL นอก localhost และความคงอยู่ของไฟล์หลัง Docker restart
- [ ] อัปเดตเอกสารและประสาน Frontend ก่อน Deploy API/schema ใหม่

อ้างอิงด้าน Upload: [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
