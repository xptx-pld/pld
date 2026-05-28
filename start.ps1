# 启动后端（新窗口）
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

# 启动前端（新窗口）
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\web'; npm run dev"

Write-Host "前后端服务已在新窗口启动" -ForegroundColor Green
Write-Host "后端: http://localhost:8000" -ForegroundColor Yellow
Write-Host "前端: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
