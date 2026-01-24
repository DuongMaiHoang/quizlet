# Fix: $HOME Environment Variable on Windows

## Vấn đề
Playwright và các browser tools cần biến môi trường `$HOME` để hoạt động, nhưng Windows không tự động set biến này.

## Giải pháp tạm thời (đã tự động)
Scripts trong thư mục này đã tự động set `HOME` trước khi chạy tests:
- `run-e2e-tests.ps1` - Chạy tests bình thường
- `run-e2e-tests-ui.ps1` - Chạy tests với UI mode

Bạn chỉ cần chạy:
```bash
npm run test:e2e
# hoặc
npm run test:e2e:ui
```

## Giải pháp vĩnh viễn (khuyến nghị)

### Cách 1: Set qua PowerShell (User-level, không cần admin)
1. Mở PowerShell với quyền User (không cần Admin)
2. Chạy lệnh:
```powershell
[System.Environment]::SetEnvironmentVariable('HOME', $env:USERPROFILE, 'User')
```
3. Đóng và mở lại terminal/Cursor để áp dụng

### Cách 2: Set qua Windows Settings (GUI)
1. Mở **Settings** → **System** → **About**
2. Click **Advanced system settings**
3. Click **Environment Variables**
4. Trong **User variables**, click **New**
5. Variable name: `HOME`
6. Variable value: `%USERPROFILE%` (hoặc `C:\Users\PC`)
7. Click **OK** và đóng tất cả cửa sổ
8. Khởi động lại Cursor/terminal

### Cách 3: Set qua Command Prompt
```cmd
setx HOME "%USERPROFILE%"
```
Sau đó đóng và mở lại terminal.

## Kiểm tra
Sau khi set, kiểm tra bằng:
```powershell
echo $env:HOME
# Hoặc trong CMD:
echo %HOME%
```

Nó phải hiển thị: `C:\Users\PC` (hoặc tên user của bạn)

## Lưu ý
- Sau khi set vĩnh viễn, bạn không cần scripts nữa, có thể dùng trực tiếp `playwright test`
- Nếu vẫn lỗi, thử khởi động lại máy tính


