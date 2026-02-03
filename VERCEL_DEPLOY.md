# Hướng dẫn Deploy lên Vercel

## Cách 1: Deploy qua Vercel Dashboard (Khuyến nghị)

1. **Đăng ký/Đăng nhập Vercel**
   - Truy cập: https://vercel.com
   - Đăng nhập bằng GitHub account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Chọn repository `quizlet` từ GitHub
   - Vercel sẽ tự động detect Next.js

3. **Cấu hình Build**
   - Framework Preset: **Next.js** (tự động detect)
   - Build Command: `npm run build` (mặc định)
   - Output Directory: `.next` (mặc định)
   - Install Command: `npm install` (mặc định)

4. **Deploy**
   - Click "Deploy"
   - Vercel sẽ tự động build và deploy
   - Sau khi deploy xong, bạn sẽ có URL: `https://quizlet-xxx.vercel.app`

5. **Custom Domain (Tùy chọn)**
   - Vào Settings → Domains
   - Thêm domain của bạn

## Cách 2: Deploy qua Vercel CLI

1. **Cài đặt Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Lần đầu sẽ hỏi một số câu hỏi, chọn defaults
   - Production deploy: `vercel --prod`

## Lưu ý

- Vercel tự động detect Next.js và không cần config đặc biệt
- Không cần `vercel.json` cho Next.js app cơ bản
- Vercel hỗ trợ đầy đủ Next.js features (SSR, dynamic routes, API routes)
- Mỗi commit/push lên `main` branch sẽ tự động trigger deployment (nếu enable)

## Environment Variables (Nếu cần)

Nếu app cần environment variables:
- Vào Project Settings → Environment Variables
- Thêm các biến cần thiết

