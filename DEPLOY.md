# Hướng dẫn Deploy lên GitHub Pages

## Yêu cầu

1. Repository trên GitHub (public hoặc private với GitHub Pro)
2. GitHub Actions enabled

## Các bước triển khai

### 1. Cấu hình Repository

1. Vào **Settings** của repository trên GitHub
2. Vào **Pages** trong sidebar
3. Chọn **Source**: `GitHub Actions`
4. Lưu lại

### 2. Cập nhật Base Path (nếu cần)

Nếu repository name không phải là `quizlet`, bạn cần cập nhật:

- File `.github/workflows/deploy.yml`: Thay `${{ github.event.repository.name }}` bằng tên repository của bạn
- Hoặc set environment variable `NEXT_PUBLIC_BASE_PATH` trong GitHub Actions

### 3. Push code lên GitHub

```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

### 4. Kiểm tra Deployment

1. Vào tab **Actions** trên GitHub
2. Xem workflow "Deploy to GitHub Pages" đang chạy
3. Sau khi hoàn thành, vào **Settings > Pages** để xem URL

## Lưu ý quan trọng

### ⚠️ Static Export Limitations

Next.js static export có một số hạn chế:

1. **Không có Server-Side Rendering (SSR)**: Tất cả pages phải là static
2. **Không có API Routes**: Nếu app có `/api` routes, cần migrate sang client-side hoặc external API
3. **Dynamic Routes**: Phải được generate tại build time hoặc dùng client-side routing
4. **localStorage**: Hoạt động bình thường vì là client-side

### 🔧 Cấu hình hiện tại

- **Output**: Static export (`output: 'export'`)
- **Images**: Unoptimized (vì GitHub Pages không hỗ trợ Next.js Image Optimization)
- **Base Path**: Tự động từ repository name
- **Trailing Slash**: Enabled (cần thiết cho GitHub Pages)

### 📝 Nếu có vấn đề

1. **404 Errors**: Kiểm tra `basePath` và `assetPrefix` trong `next.config.ts`
2. **Routing Issues**: Đảm bảo tất cả links dùng `Link` component từ Next.js
3. **Build Failures**: Kiểm tra logs trong GitHub Actions

## Alternative: Deploy lên Vercel (Recommended)

Nếu app cần SSR hoặc API routes, nên dùng Vercel:

```bash
npm i -g vercel
vercel
```

Vercel hỗ trợ Next.js đầy đủ và miễn phí cho personal projects.

