$body = @{
    username = "admin"
    password = "123456"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/login" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    $response | ConvertTo-Json
} catch {
    Write-Host "Error: $_"
}