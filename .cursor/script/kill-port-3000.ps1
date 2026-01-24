# Script để kill process đang sử dụng port 3000
# Sử dụng khi cần giải phóng port 3000 để tiếp tục dev/test

Write-Host "🔍 Đang kiểm tra port 3000..." -ForegroundColor Cyan

# Tìm process đang sử dụng port 3000
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($process) {
    Write-Host "⚠️  Tìm thấy process với PID: $process đang sử dụng port 3000" -ForegroundColor Yellow
    
    # Hiển thị thông tin process
    $processInfo = Get-Process -Id $process -ErrorAction SilentlyContinue
    if ($processInfo) {
        Write-Host "   Process: $($processInfo.ProcessName)" -ForegroundColor Gray
        Write-Host "   Path: $($processInfo.Path)" -ForegroundColor Gray
    }
    
    # Kill process
    try {
        Stop-Process -Id $process -Force
        Write-Host "✅ Đã kill process trên port 3000 (PID: $process)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Lỗi khi kill process: $_" -ForegroundColor Red
        Write-Host "💡 Thử chạy script với quyền Administrator" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  Không có process nào đang sử dụng port 3000" -ForegroundColor Cyan
}

