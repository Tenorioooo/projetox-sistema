$qrToken = "5e37c2cbe4c0d556107e23478719edf6aed3d3a1dd8202d31ef620d6e908945c"
$loginBody = '{"email":"portaria@projetox.com","password":"Operador123!"}'
$login = Invoke-RestMethod -Method POST -Uri "http://localhost:3001/api/auth/login" -ContentType "application/json" -Body $loginBody
$token = $login.token
Write-Host "Login OK."

$checkinBody = "{`"token`":`"$qrToken`"}"
$result = Invoke-RestMethod -Method POST -Uri "http://localhost:3001/api/checkin" -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $checkinBody
$result | ConvertTo-Json -Depth 5
