# Migration Script: MongoDB to Supabase
# This script removes all MongoDB files and updates imports to use Supabase

Write-Host "🚀 Starting MongoDB to Supabase migration..." -ForegroundColor Green

# 1. Remove MongoDB npm packages
Write-Host "📦 Removing MongoDB npm packages..." -ForegroundColor Yellow
npm uninstall mongodb mongoose @types/mongodb

# 2. Remove MongoDB files and directories
Write-Host "🗑️ Removing MongoDB files..." -ForegroundColor Yellow

$filesToRemove = @(
    "src\lib\mongodb",
    "src\contexts\brand-context-mongo.tsx",
    "src\components\auth\auth-wrapper-mongo.tsx",
    "src\components\cbrand\cbrand-wizard-mongo.tsx",
    "src\app\brand-profile-mongo",
    "src\app\layout-mongo.tsx",
    "src\app\quick-content-mongo"
)

foreach ($file in $filesToRemove) {
    $fullPath = Join-Path $PWD $file
    if (Test-Path $fullPath) {
        Write-Host "  Removing: $file" -ForegroundColor Red
        Remove-Item -Path $fullPath -Recurse -Force
    }
}

# 3. Update unified brand context to replace the old one
Write-Host "🔄 Updating brand contexts..." -ForegroundColor Yellow

# Backup the old unified brand context
if (Test-Path "src\contexts\unified-brand-context.tsx") {
    Copy-Item "src\contexts\unified-brand-context.tsx" "src\contexts\unified-brand-context.tsx.backup"
    Write-Host "  Created backup: unified-brand-context.tsx.backup" -ForegroundColor Blue
}

# Replace the old context with the new Supabase-based one
if (Test-Path "src\contexts\brand-context-supabase-unified.tsx") {
    Move-Item "src\contexts\brand-context-supabase-unified.tsx" "src\contexts\unified-brand-context.tsx" -Force
    Write-Host "  Replaced unified-brand-context.tsx with Supabase version" -ForegroundColor Green
}

Write-Host "✅ Migration completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Run the SQL migration in your Supabase dashboard:"
Write-Host "   - Copy the contents of supabase/migrations/001_initial_schema.sql"
Write-Host "   - Run it in your Supabase SQL editor"
Write-Host ""
Write-Host "2. Verify your environment variables:"
Write-Host "   - NEXT_PUBLIC_SUPABASE_URL"
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY"
Write-Host ""
Write-Host "3. Test the application:"
Write-Host "   - npm run dev"
Write-Host "   - Create a new brand profile"
Write-Host "   - Verify logo persistence works"
Write-Host ""
Write-Host "4. Clean up any remaining MongoDB imports in your files if needed"