# Quick test Revo 1.0 via /api/quick-content
Write-Host "Testing Revo 1.0 Quick Content endpoint..." -ForegroundColor Cyan

$uri = "http://localhost:3001/api/quick-content"
$payload = {
  revoModel = "revo-1.0"
  platform = "instagram"
  brandProfile = {
    businessName = "Paya"
    businessType = "Financial Technology"
    location = {
      city = "Nairobi"
      country = "Kenya"
    }
    primaryColor = "#E4574C"
    accentColor = "#2A2A2A"
    backgroundColor = "#FFFFFF"
    services = "Digital Banking, Payment Solutions, Buy Now Pay Later"
    keyFeatures = @("No credit checks", "Quick setup", "Mobile app")
    competitiveAdvantages = @("Financial inclusivity", "Universally accessible banking")
    targetAudience = "small businesses"
  }
  brandConsistency = {
    includeContacts = $false
    followBrandColors = $true
  }
} | ConvertTo-Json -Depth 6

try {
  $response = Invoke-RestMethod -Uri $uri -Method Post -Body $payload -ContentType "application/json" -TimeoutSec 60
  Write-Host "Status: Success" -ForegroundColor Green
  Write-Host "Image URL: $($response.imageUrl)" -ForegroundColor Yellow
  Write-Host "Content (preview): $($response.content.Substring(0, [Math]::Min(150, $response.content.Length)))..." -ForegroundColor White
} catch {
  Write-Host "Status: Failed" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  if ($_.Exception.Response -ne $null) {
    try {
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $body = $reader.ReadToEnd()
      Write-Host "Response body:" -ForegroundColor Yellow
      Write-Host $body -ForegroundColor White
    } catch {
      Write-Host "Failed to read response body" -ForegroundColor Yellow
    }
  }
}
