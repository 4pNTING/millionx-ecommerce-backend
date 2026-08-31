# MillionX E-commerce Phase 1 — Bruno

## ວິທີໃຊ້

1. ເປີດ folder `api-client/bruno` ເປັນ Collection ໃນ Bruno.
2. ເລືອກ Environment `Local`.
3. ກວດ `baseUrl`, username/password ໃຫ້ກົງກັບ `.env`.
4. ເປີດ Backend ດ້ວຍ `npm run start:dev`.
5. Run request `01` ຫາ `13` ຕາມລຳດັບ.

> Request `01 Login` ຕ້ອງໃຊ້ `{{username}}` ແລະ
> `{{password}}`. ຖ້າ Bruno ຍັງສະແດງ editor draft ເກົ່າ,
> ໃຫ້ກັບໄປ Home ແລ້ວເປີດ Collection ໃໝ່
> ຫຼື restart Bruno ເພື່ອລ້າງ editor draft ເກົ່າ.

## Request flow

| ລຳດັບ | Request           | ຜົນທີ່ເກັບໃນ Environment                                                |
| ----- | ----------------- | ----------------------------------------------------------------------- |
| 01    | Staff/Admin Login | `staffToken`                                                            |
| 02    | List Categories   | ອ່ານ Category ແບບ public                                                |
| 03    | Create Category   | `runId`, `categoryId`                                                   |
| 04    | Create Product    | `productId`                                                             |
| 05    | Create Variant    | `variantId`                                                             |
| 06    | Set Price         | ລາຄາ LAK                                                                |
| 07    | Add Product Image | ຮູບຂອງ Product/Variant                                                  |
| 08    | List Products     | ກວດ Product read model                                                  |
| 09    | Register Customer | `customerIdentifier`, `customerPassword`, `customerToken`, `customerId` |
| 10    | Customer Login    | `customerToken`, `customerId`                                           |
| 11    | Update My Profile | Profile ພາສາລາວ                                                         |
| 12    | Create My Address | `addressId`                                                             |
| 13    | My Profile        | ກວດ Profile ແລະ Address                                                 |

## Environment

- `baseUrl`: default `http://localhost:3001`
- `username`/`password`: ຕ້ອງກົງກັບ `SEED_ADMIN_USERNAME`/`SEED_ADMIN_PASSWORD`
- `customerIdentifier`/`customerPassword`: ຕ້ອງກົງກັບ seed ຫຼືຈະຖືກປ່ຽນໂດຍ request `09`
- Token ແລະ UUID ເລີ່ມຕົ້ນເປັນ `not-set`; ບໍ່ຄວນ commit JWT ທີ່ເຄີຍໃຊ້ແລ້ວ
- Request `11 Update My Profile` ໃຊ້ເບີໂທ `+85620{{runId}}`
  ເພື່ອໃຫ້ກົງກັບ customer ທີ່ request `09` ສ້າງ ແລະ
  ບໍ່ຊ້ຳກັບ customer ອື່ນ.

ຖ້າເກີດ `EADDRINUSE` ທີ່ port `9898`, ສະແດງວ່າ Backend instance ເກົ່າຍັງເຮັດວຽກ. ໃຫ້ຢຸດ instance ເກົ່າດ້ວຍ `Ctrl+C` ກ່ອນ run ໃໝ່.
