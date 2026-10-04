# Tân Dũng Sales V2

Website bán hàng bất động sản + du lịch với Next.js, Supabase Auth/Postgres/Storage.

## Cấu trúc dữ liệu

- `projects`: nhiều dự án.
- `properties`: nhiều bất động sản thuộc từng dự án qua `project_id`.
- `tours`: tour du lịch.
- `leads`: khách hàng để lại thông tin.
- `profiles`: quyền `admin` / `editor`.
- Storage bucket `media`: ảnh dự án, BĐS và tour.

## Chạy local

1. Tạo `.env.local` từ `.env.example`.
2. Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. `npm install`
4. `npm run dev`
5. Mở `http://localhost:3000`.

## Admin

- `/login`
- `/admin`
- `/admin/projects`
- `/admin/properties`
- `/admin/tours`
- `/admin/leads`

Một project có thể có nhiều BĐS. Từ quản trị Dự án, bấm **BĐS trong dự án** để lọc theo project.

## Public

- Trang chủ hiển thị các project đã `published`.
- `/projects/[slug]` hiển thị chi tiết project và các BĐS `published` thuộc project.
- Form tư vấn lưu vào `leads`.
- Có CTA gọi điện và Zalo trên desktop/mobile.

## Triển khai

Next.js nên deploy trên Vercel hoặc nền tảng hỗ trợ Next.js server. Supabase dùng cho Auth, Postgres và Storage. Không đưa service-role key lên client hoặc GitHub.


### Biến môi trường

Ngoài Supabase URL/Publishable Key, đặt `NEXT_PUBLIC_SITE_URL` thành domain thật khi deploy (ví dụ `https://tenmiencuaban.com`).

## Rich text & nhiều ảnh BĐS
- Mô tả BĐS dùng rich text editor và render HTML đã định dạng ở trang dự án.
- Mỗi BĐS hỗ trợ tối đa 12 ảnh trong bảng `property_images`.
- Ảnh đầu tiên làm ảnh đại diện; trang dự án hiển thị gallery ảnh + thumbnail.

## Project landing V18

Mỗi dự án có landing page riêng tại `/projects/[slug]` với cấu trúc:
1. Tổng quan
2. Tiện ích nội khu
3. Kết nối
4. Tiềm năng
5. Đầu tư / Bất động sản
6. Du lịch tham quan trải nghiệm
7. Footer / liên hệ

Quản trị nội dung landing tại `/admin/projects/[project-id]/content`.
- Tiềm năng: Rich Text
- Tiện ích, Kết nối, Du lịch tham quan: CRUD hình ảnh + danh mục + phút + km + ghi chú
- Đầu tư: lấy các BĐS được gắn `project_id`

Migration: `supabase/schema-project-landing-v18.sql`.
