# MillionX E-commerce Phase 1 — Bruno

> Contract update 2026-10-25: `_id`, `...Dto`, list argument `input`, and
> `isActive: active/inactive/all`. Reopen the collection after updating the backend.
> See [migration guide](../../docs/ID_DTO_MIGRATION.md). Docker 3001 must be rebuilt
> in coordination with frontend changes; changing this collection alone does not deploy the API.

## ວິທີໃຊ້

1. ເປີດ folder `api-client/bruno` ເປັນ Collection ໃນ Bruno.
2. ເລືອກ Environment `Local`.
3. ກວດ `baseUrl`, username/password ໃຫ້ກົງກັບ `.env` (`admin` / `admin123`).
4. ເປີດ Backend ດ້ວຍ Docker (`docker compose up -d`) ຫຼື `npm run start:dev`.
5. Run request `01` ຫາ `18` ແລະ `20` ຫາ `27` ຕາມລຳດັບ. Request `19` ໃຊ້ທົດສອບ Rate Limit ແຍກຕ່າງຫາກ.

> Request `01 Login` ຕ້ອງໃຊ້ `{{username}}` ແລະ
> `{{password}}`; ມັນຈະເກັບ token ໃໝ່ໃຫ້ environment ອັດຕະໂນມັດ.
> ຖ້າ Bruno ຍັງສະແດງ editor draft ເກົ່າ,
> ໃຫ້ກັບໄປ Home ແລ້ວເປີດ Collection ໃໝ່
> ຫຼື restart Bruno ເພື່ອລ້າງ editor draft ເກົ່າ.

## Request flow

| ລຳດັບ | Request                      | ຜົນທີ່ເກັບໃນ Environment                                                      |
| ----- | ---------------------------- | ----------------------------------------------------------------------------- |
| 01    | Staff/Admin Login            | `staffToken`, `staffRefreshToken`                                             |
| 02    | List Categories              | ອ່ານ Category ແບບ public, ເກັບ `categoryId`                                   |
| 03    | Create Category              | `runId`, `categoryId`                                                         |
| 04    | Create Product Bundle        | `productId`, `variantId`; Product/Variant/Price/Image ໃນ transaction ດຽວ      |
| 05    | Create Variant               | `variantId`                                                                   |
| 06    | Set Price                    | ລາຄາ LAK                                                                      |
| 07    | Add Product Image            | `imageId`; ເພີ່ມຮູບຂອງ Product/Variant                                        |
| 08    | List Products                | ກວດ Product read model                                                        |
| 09    | Register Customer            | `customerEmail`, `customerPhone` (020xxxxxxxx), `customerToken`, `customerId` |
| 10    | Customer Login (Phone)       | Login ດ້ວຍເບີໂທ (`02012345678` ຫຼື 020 ທີ່ຫາກໍ່ສະໝັກ) ໄດ້ token               |
| 10b   | Customer Login by Email      | Login ດ້ວຍ Gmail/Email (`demo.customer@example.com`) ໄດ້ token                |
| 11    | Update My Profile            | Profile ພາສາລາວ (ໃຊ້ `customerEmail`, `customerPhone`)                        |
| 12    | Create My Address            | `addressId` (ໃຊ້ `customerPhone`)                                             |
| 13    | My Profile                   | ກວດ Profile ແລະ Address                                                       |
| 14    | Update Product Image         | ແກ້ `url`, `altText`, `sortOrder`, `variantId` ຕາມ `imageId`                  |
| 15    | Delete Product Image         | ລຶບແຖວຮູບຕາມ `imageId` ແລະ reset ຄ່າເປັນ `not-set`                            |
| 16    | List Customers               | Admin/Manager ອ່ານ Customer, Account, ຈຳນວນ Address ແລະ Pagination            |
| 17    | Refresh Staff Token          | rotate `staffToken` ແລະ `staffRefreshToken`                                   |
| 18    | Refresh Customer Token       | rotate `customerToken` ແລະ `customerRefreshToken`                             |
| 19    | Rate Limit Staff Login       | ທົດສອບ username ຜິດ; run ຊ້ຳເພື່ອກວດກາ HTTP/GraphQL error 429                 |
| 20    | List Zones                   | Staff ອ່ານລາຍການ Zone, ເກັບ `zoneId`                                          |
| 21    | Create Zone                  | ສ້າງ Zone ໃໝ່, ເກັບ `zoneId`                                                  |
| 22    | Update Zone                  | ແກ້ໄຂຊື່ Zone ຕາມ `zoneId`                                                    |
| 23    | Delete Zone                  | Soft delete Zone ຕາມ `zoneId` ແລະ reset ຄ່າເປັນ `not-set`                     |
| 24    | Social Login Google          | Login/Auto-Register ຜ່ານ Google ໄດ້ Session Token                             |
| 25    | Social Login Facebook        | Login/Auto-Register ຜ່ານ Facebook ໄດ້ Session Token                           |
| 26    | Products Include Descendants | ອ່ານສິນຄ້າຂອງໝວດແມ່ ແລະ ລູກຫຼານທຸກລະດັບ; ຕັ້ງ `categoryId` ກ່ອນ               |
| 27    | Update Product               | ແກ້ໄຂສິນຄ້າ, ຕົວເລືອກ ແລະ ລາຄາ ດ້ວຍ `_id` ທຸກລະດັບ                            |

## Products: ລວມໝວດລູກ (22 ຕຸລາ 2026)

- Request `26` ເປັນ public read-only; ບໍ່ຕ້ອງ Login ແລະ ບໍ່ສ້າງ seed.
- ຕັ້ງ `categoryId` ເປັນ UUID ຈິງຂອງໝວດແມ່, ແລ້ວສົ່ງ `includeDescendants: true`.
- ບໍ່ສົ່ງ flag ຫຼືສົ່ງ `false`: ກັ່ນຕອງສະເພາະ Category ID ກົງຕົວຄືເກົ່າ.
- `total` ນັບທຸກສິນຄ້າທີ່ກົງ filter ກ່ອນ pagination; ໝວດວ່າງຍັງຄືນ `items: []`.
- ອັບເດດ backend/schema ທີ່ກຳລັງ run ກ່ອນໃຊ້ request ນີ້; build source ບໍ່ໄດ້ອັບເດດ Docker container ເອງ.
- ເບິ່ງ [Frontend contract ແລະ tests](../../docs/PRODUCT_CATEGORY_DESCENDANTS.md).

## ລະບົບເບີໂທລະສັບ (Phone Normalization)

- ໃນ Database ຕັດເຄື່ອງໝາຍ `+` ອອກໝົດ (ຕົວຢ່າງ: `8562012345678`).
- ເວລາ Login ຫຼື Register:
  - ປ້ອນ `02012345678` ລະບົບຈະ Normalize ເປັນ `8562012345678` ໃຫ້ອັດຕະໂນມັດ.
  - ປ້ອນ `+8562012345678` ຫຼື `8562012345678` ກໍ່ເຂົ້າໄດ້ຄືກັນ.
  - ຮອງຮັບທັງການ Login ດ້ວຍ **ເບີໂທລະສັບ** ແລະ **Email/Gmail**.

## ທົດສອບ Rate Limit

1. ລໍຖ້າ 60 ວິນາທີຈາກ Staff login ຄັ້ງຫຼ້າສຸດ ເພື່ອເລີ່ມ window ໃໝ່.
2. Run `19 Rate Limit Staff Login` 6 ຄັ້ງຕິດຕໍ່ກັນ.
3. 5 ຄັ້ງທຳອິດຈະໄດ້ `Invalid username or password`.
4. ຄັ້ງທີ 6 ຈະໄດ້ `Too many staff login attempts...`.
5. ລໍຖ້າ 60 ວິນາທີແລ້ວຈຶ່ງທົດສອບ login ອີກຄັ້ງ.

GraphQL ຍັງຕອບ HTTP 200 ຕາມ GraphQL transport convention ແຕ່ error ມີ status 429.
REST `POST /api/auth/login` ຕອບ HTTP 429 ໂດຍກົງ.

## Environment `Local`

- `baseUrl`: default `http://localhost:3001`
- `username`/`password`: default `admin` / `admin123`
- `customerIdentifier`: default `02012345678` (Demo customer)
- `customerPhone`: default `02012345678`
- `customerEmail`: default `demo.customer@example.com`
- `customerPassword`: default `12345678`
- Access/Refresh Token ເລີ່ມຕົ້ນເປັນ `not-set` ແລະຈະຖືກຕັ້ງຄ່າໃໝ່ຫຼັງ Login/Refresh;
  ຢ່າ commit JWT ຫຼື token ທີ່ເຄີຍໃຊ້ແລ້ວ. UUID ທີ່ collection ສ້າງຂຶ້ນຈະຖືກເກັບໃນ environment.
