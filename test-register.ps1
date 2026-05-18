$body = @{
    username = "Davis"
    password = "20200730"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    $response | ConvertTo-Json
} catch {
    Write-Host "Error: $_"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
}