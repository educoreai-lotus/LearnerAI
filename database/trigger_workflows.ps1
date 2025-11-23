# Trigger Workflows PowerShell Script
# This script triggers the actual learning path generation workflow
# for each of the 5 additional skills gaps via API calls.
#
# Usage: .\trigger_workflows.ps1
#
# Prerequisites:
# 1. Backend server must be running on http://localhost:5000
# 2. Skills gaps must already exist in the database (run complete_workflow_example.sql first)
# 3. Company must be set to manual approval policy

$API_URL = $env:API_URL
if (-not $API_URL) {
    $API_URL = "http://localhost:5000"
}

$API_VERSION = "v1"

# Skills gaps to process (these should already exist in the database)
$gapsToProcess = @(
    @{
        competencyTargetName = "Microservices Architecture"
        userId = "a1b2c3d4-e5f6-4789-a012-345678901234"
        companyId = "c1d2e3f4-5678-9012-3456-789012345678"
    },
    @{
        competencyTargetName = "CI/CD Pipeline Development"
        userId = "a1b2c3d4-e5f6-4789-a012-345678901234"
        companyId = "c1d2e3f4-5678-9012-3456-789012345678"
    },
    @{
        competencyTargetName = "Database Design & Optimization"
        userId = "a1b2c3d4-e5f6-4789-a012-345678901234"
        companyId = "c1d2e3f4-5678-9012-3456-789012345678"
    },
    @{
        competencyTargetName = "Cloud Security Fundamentals"
        userId = "a1b2c3d4-e5f6-4789-a012-345678901234"
        companyId = "c1d2e3f4-5678-9012-3456-789012345678"
    },
    @{
        competencyTargetName = "API Gateway Patterns"
        userId = "a1b2c3d4-e5f6-4789-a012-345678901234"
        companyId = "c1d2e3f4-5678-9012-3456-789012345678"
    }
)

function Trigger-Workflow {
    param(
        [hashtable]$Gap
    )
    
    $url = "$API_URL/api/$API_VERSION/learning-paths/generate"
    
    Write-Host ""
    Write-Host "🚀 Triggering workflow for: $($Gap.competencyTargetName)" -ForegroundColor Cyan
    Write-Host "   URL: $url"
    
    $body = @{
        userId = $Gap.userId
        companyId = $Gap.companyId
        competencyTargetName = $Gap.competencyTargetName
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $url `
            -Method POST `
            -ContentType "application/json" `
            -Body $body
        
        Write-Host "   ✅ Workflow started successfully!" -ForegroundColor Green
        Write-Host "   📋 Job ID: $($response.jobId)" -ForegroundColor Yellow
        Write-Host "   📊 Status: $($response.status)" -ForegroundColor Yellow
        
        return @{
            Success = $true
            CompetencyTargetName = $Gap.competencyTargetName
            JobId = $response.jobId
            Status = $response.status
        }
    }
    catch {
        Write-Host "   ❌ Failed to trigger workflow: $($_.Exception.Message)" -ForegroundColor Red
        return @{
            Success = $false
            CompetencyTargetName = $Gap.competencyTargetName
            Error = $_.Exception.Message
        }
    }
}

# Main execution
Write-Host "=" * 60
Write-Host "🎯 Triggering Learning Path Generation Workflows" -ForegroundColor Magenta
Write-Host "=" * 60
Write-Host ""
Write-Host "📡 API URL: $API_URL" -ForegroundColor Cyan
Write-Host "📦 Processing $($gapsToProcess.Count) skills gaps" -ForegroundColor Cyan
Write-Host ""

$results = @()

foreach ($gap in $gapsToProcess) {
    $result = Trigger-Workflow -Gap $gap
    $results += $result
    
    # Small delay between requests
    Start-Sleep -Seconds 2
}

# Summary
Write-Host ""
Write-Host "=" * 60
Write-Host "📊 Summary" -ForegroundColor Magenta
Write-Host "=" * 60
Write-Host ""

$successful = ($results | Where-Object { $_.Success -eq $true }).Count
$failed = ($results | Where-Object { $_.Success -eq $false }).Count

Write-Host "✅ Successful: $successful/$($gapsToProcess.Count)" -ForegroundColor Green
Write-Host "❌ Failed: $failed/$($gapsToProcess.Count)" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

if ($failed -gt 0) {
    Write-Host ""
    Write-Host "❌ Failed workflows:" -ForegroundColor Red
    $results | Where-Object { $_.Success -eq $false } | ForEach-Object {
        Write-Host "   - $($_.CompetencyTargetName): $($_.Error)" -ForegroundColor Red
    }
}

if ($successful -gt 0) {
    Write-Host ""
    Write-Host "✅ Successful workflows:" -ForegroundColor Green
    $results | Where-Object { $_.Success -eq $true } | ForEach-Object {
        Write-Host "   - $($_.CompetencyTargetName) (Job ID: $($_.JobId))" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "💡 Note: Jobs are processed in the background." -ForegroundColor Yellow
Write-Host "   Check job status with: GET /api/v1/jobs/{jobId}/status"
Write-Host "   Once completed, learning paths will be available in the courses table."
Write-Host "   Approval requests will be created automatically for manual approval companies."
Write-Host ""


