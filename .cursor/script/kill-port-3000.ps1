# Script de kill process dang su dung port 3000
# Su dung khi can giai phong port 3000 de tiep tuc dev/test

Write-Host "Dang kiem tra port 3000..." -ForegroundColor Cyan

# Tim tat ca process lien quan den port 3000 (ca LISTEN va connection)
$allConnections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$processes = $allConnections | Select-Object -ExpandProperty OwningProcess -Unique

# Loc bo PID 0 (system process)
$validProcesses = $processes | Where-Object { $_ -ne 0 } | Sort-Object -Unique

if ($validProcesses) {
    $killedCount = 0
    foreach ($process in $validProcesses) {
        # Kiem tra xem process con ton tai khong
        $processInfo = Get-Process -Id $process -ErrorAction SilentlyContinue
        if ($processInfo) {
            Write-Host "Tim thay process voi PID: $process dang su dung port 3000" -ForegroundColor Yellow
            Write-Host "   Process: $($processInfo.ProcessName)" -ForegroundColor Gray
            if ($processInfo.Path) {
                Write-Host "   Path: $($processInfo.Path)" -ForegroundColor Gray
            }
            
            # Kill process
            try {
                Stop-Process -Id $process -Force
                Write-Host "Da kill process tren port 3000 (PID: $process)" -ForegroundColor Green
                $killedCount++
            } catch {
                Write-Host "Loi khi kill process: $_" -ForegroundColor Red
                Write-Host "Thu chay script voi quyen Administrator" -ForegroundColor Yellow
            }
        } else {
            Write-Host "Process voi PID: $process khong con ton tai" -ForegroundColor Gray
        }
    }
    
    if ($killedCount -gt 0) {
        Write-Host "Tong cong da kill $killedCount process(es)" -ForegroundColor Green
    }
} else {
    Write-Host "Khong co process nao dang su dung port 3000" -ForegroundColor Cyan
}
