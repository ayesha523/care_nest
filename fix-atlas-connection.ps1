# Fix MongoDB Atlas DNS/Firewall Issues
# Run these commands in PowerShell as Administrator

Write-Host "=== MongoDB Atlas Connection Fix ===" -ForegroundColor Cyan
Write-Host ""

# Solution 1: Add Node.js to Windows Firewall
Write-Host "1. Adding Node.js to Windows Firewall..." -ForegroundColor Yellow

$nodePath = (Get-Command node).Path
try {
    New-NetFirewallRule -DisplayName "Node.js MongoDB Atlas" `
        -Direction Outbound `
        -Program $nodePath `
        -Action Allow `
        -Protocol TCP `
        -RemotePort 27017,27018,27019 `
        -ErrorAction Stop
    Write-Host "   ✅ Firewall rule added successfully" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Rule may already exist or needs admin rights" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Flushing DNS Cache..." -ForegroundColor Yellow
Clear-DnsClientCache
Write-Host "   ✅ DNS cache cleared" -ForegroundColor Green

Write-Host ""
Write-Host "3. Testing MongoDB Atlas connection..." -ForegroundColor Yellow
Write-Host ""

# Test connection
node -e "const mongoose = require('mongoose'); (async () => { try { await mongoose.connect('mongodb+srv://tashrik_halim:404ilovesuki@carenest.hlkwku3.mongodb.net/carenest', {serverSelectionTimeoutMS: 20000}); console.log('✅ SUCCESS! Atlas Connected'); process.exit(0); } catch(e) { console.log('❌ FAILED:', e.message); process.exit(1); } })()"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== SUCCESS ===" -ForegroundColor Green
    Write-Host "MongoDB Atlas is now connected!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=== Still Having Issues? ===" -ForegroundColor Yellow
    Write-Host "Try the following:" -ForegroundColor White
    Write-Host "  1. Disable Windows Defender temporarily" -ForegroundColor White
    Write-Host "  2. Use a VPN (sometimes bypasses DNS blocks)" -ForegroundColor White
    Write-Host "  3. Check antivirus settings" -ForegroundColor White
    Write-Host "  4. Keep using local MongoDB (already working!)" -ForegroundColor Cyan
}
