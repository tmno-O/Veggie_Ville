@echo off
cd /d "%~dp0"

echo.
echo ========================================
echo  Veggie Ville - Push to GitHub
echo ========================================
echo.

:: Remove stale lock if present
if exist ".git\index.lock" del /f ".git\index.lock"

:: Unstage files that should not be committed
git reset HEAD database.sqlite 2>nul
git reset HEAD ".claude/settings.local.json" 2>nul

:: Stage all relevant files
git add .gitignore
git add BUG_REPORT_login.md
git add veggie_ville_design_prompt.md
git add seed.js
git add public/router.js
git add public/components.js
git add public/veggie-ui.js
git add public/veggie-ui.css
git add public/vv-hifi.css
git add public/error-banner.js
git add public/modal.js
git add controllers/auth.controller.js
git add services/auth.service.js
git add middlewares/auth.js
git add routes/auth.routes.js
git add __tests__/auth.backend.test.js
git add __tests__/error-banner.test.js
git add __tests__/frontend.test.js
git add __tests__/modal.test.js
git add app.js
git add index.html
git add package.json
git add package-lock.json
git add schema.sql
git add config/db.js
git add lib/socket.js
git add middlewares/role.js
git add routes/cart.routes.js
git add routes/order.routes.js
git add routes/pickupSlot.routes.js
git add routes/product.routes.js
git add routes/admin.routes.js
git add controllers/admin.controller.js
git add controllers/cart.controller.js
git add controllers/order.controller.js
git add controllers/pickupSlot.controller.js
git add controllers/product.controller.js
git add services/admin.service.js
git add services/auth.service.js
git add services/cart.service.js
git add services/order.service.js
git add services/pickupSlot.service.js
git add services/product.service.js
git add .env.example
git add claude_report_and_scoring.md

echo.
echo Staged files:
git status --short
echo.

:: Commit with detailed message
git commit -m "fix: login button intercepted by global click handler - users could not log in" -m "ROOT CAUSE" -m "The global click event listener in public/router.js catches all .btn clicks and matches button text against a route pattern table. The Login submit button has the text 'Login' which matched the /login/ regex pattern, causing the handler to call navigate('/login') and event.preventDefault() - blocking the form submit event from ever firing." -m "WHAT THE USER SAW" -m "Fill in email and password, click Login, page re-renders the same Login page. No error shown. No feedback. Stuck in a loop." -m "EXECUTION ORDER (broken)" -m "1. User clicks Login button 2. Global click handler fires (event bubbling) 3. .btn matched -> text = 'login' 4. /login/.test('login') === true 5. event.preventDefault() -> kills form submit 6. navigate('/login') -> re-renders login page 7. Form submit handler -> NEVER REACHED" -m "THE FIX (public/router.js)" -m "Added one early-return guard inside the global click handler: if a button has type='submit' AND is inside a form, skip route matching entirely and let the form handle it." -m "CODE CHANGE" -m "  // Before (broken)" -m "  const link = event.target.closest('.link, .nav-bar .logo, .bottom-nav .b, .btn, .pcard');" -m "  if (!link) return;" -m "  // After (fixed)" -m "  const link = event.target.closest('.link, .nav-bar .logo, .bottom-nav .b, .btn, .pcard');" -m "  if (!link) return;" -m "  if ((link.type === 'submit' || link.getAttribute('type') === 'submit') && link.closest('form')) return;" -m "OTHER FORMS ALSO AFFECTED" -m "- Save Listing button text matched /sell/ -> would navigate to /seller without saving (now fixed)" -m "- Register button was accidentally safe (text did not match any pattern)" -m "ADDITIONAL FILES" -m "- BUG_REPORT_login.md: full root cause analysis, call stack trace, code review of all auth files, 13 issues found with severity ratings and copy-paste fixes" -m "- veggie_ville_design_prompt.md: complete UI design system prompt with color tokens, component specs, and 7 screen definitions" -m "- seed.js: updated to seed all 3 test accounts (buyer, seller, admin) with documented plain-text passwords"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo  Done! Check GitHub for the new commit.
echo ========================================
echo.
pause
