# 47daPunjab

## Overview
A mobile service platform for Punjab, Pakistan visitors. Features protocol services, village video recording, customs assistance, shop, HumanFind (people & property search), history, and property detail submissions.

## Recent Changes
- 2026-03-10: Android adaptive icon fix:
  - Background: solid brand green (#0D7C3D) at 1024x1024 (was template/guideline image at 512x512)
  - Monochrome: proper crescent+wheat silhouette at 1024x1024 (was generic chevron at 432x432)
  - All three layers (foreground, background, monochrome) now consistent 1024x1024
- 2026-03-11: Google OAuth deep-link fix for mobile:
  - Backend: /api/auth/google now encodes platform (native/web) in OAuth state parameter
  - Backend: callback detects native platform and redirects to 47dapunjab://auth?token=XXX instead of HTML postMessage
  - Backend: /api/auth/oauth/status always returns facebook: false (removed from app)
  - Frontend: handleGoogleLogin passes platform=native to OAuth URL on native
  - Frontend: uses WebBrowser.openAuthSessionAsync with "47dapunjab://auth" as redirect scheme
  - Frontend: extracts token from deep-link URL and stores in AsyncStorage
  - Frontend: Facebook button removed from login UI entirely
  - lib/auth-context.tsx: storeToken exported for use in login.tsx
  - app/login.tsx: missing resetCodeDisplay state declaration added (pre-existing bug fixed)
- 2026-03-10: Mobile APK login fix:
  - getApiUrl() now checks isNative FIRST, always uses EXPO_PUBLIC_API_URL on native (never window.location.origin)
  - This prevents expo-router from injecting wrong internal URLs on native platform
  - Better error messages: shows HTTP status + response preview instead of generic "invalid response"
- 2026-03-10: Mobile APK backend connectivity fix:
  - Added token-based authentication (auth_tokens table) alongside session cookies
  - Native mobile (Android APK) now uses Bearer tokens stored in AsyncStorage
  - Web continues to use session cookies (no change to web behavior)
  - CORS updated to allow mobile app requests (no Origin header)
  - API URL resolution: EXPO_PUBLIC_API_URL env var in eas.json, fallback to 47dapunjab.com
  - Created lib/api-fetch.ts shared utility for native-aware fetch with auth headers
  - Updated all API-calling files: query-client, auth-context, firebase, admin, my-submissions, my-orders, shop
  - Token middleware (tokenAuthMiddleware) injects token user into session for all existing endpoints
- 2026-03-10: Session persistence fix for deployed web app:
  - Added app.set("trust proxy", 1) for secure cookies behind Replit reverse proxy
  - Improved OAuth callback HTML with postMessage to parent window
  - Web OAuth login uses window.open popup with proper communication
- 2026-03-08: Comprehensive SEO, performance, and auth improvements:
  - Google & Facebook OAuth login now active (credentials configured)
  - SEOHead enhanced: og:image, twitter:image, meta keywords on all 21 pages
  - Performance: compression middleware, 7-day cache headers for static assets
  - Favicon system: favicon-16x16, favicon-32x32, apple-touch-icon (180x180), android-chrome-192x192, android-chrome-512x512
  - Web manifest (site.webmanifest) with PWA-ready icon configuration
  - Session persistence: rolling: true added so 30-day timer resets on activity
  - Updated +html.tsx with all favicon sizes and manifest link
- 2026-03-06: SEO complete — SEOHead component added to all pages (index, services, shop, rent, profile, login, blog, history, pakistan-guide, privacy-policy, terms, my-orders, submit-details, subscription). robots.txt and sitemap.xml server routes added. SEOHead uses imperative DOM API for reliable web meta tag injection.
- 2026-03-06: Security hardening for production: protected /api/clear-all (admin-only), added auth to booking/cart delete and profile update routes, removed admin email typo, stopped returning password reset codes in API responses, set cookie secure flag for production, updated login UI to show contact-support message for password resets.
- 2026-03-06: Production now serves actual Expo web app instead of QR code landing page. Build pipeline runs `npx expo export --platform web --output-dir web-build` before mobile builds. Server serves web-build with SPA fallback in production; mobile clients (expo-platform header) still get manifests.
- 2026-03-05: Added Metro bundler proxy in development mode (server/index.ts) - backend now proxies manifest, bundle, and asset requests to Metro (port 8081) when no static-build exists, with URL rewriting for Expo Go compatibility
- 2026-02-17: Real-time dynamic content translation using google-translate-api-x backend endpoint (POST /api/translate)
- 2026-02-17: useTranslate hook (lib/useTranslate.ts) with global cache for translating user-entered content
- 2026-02-17: Shop products fully translated (names, descriptions, details) via static translation keys in all 4 languages
- 2026-02-17: HumanFind PersonCard/PropertyCard dynamically translate names, locations, descriptions
- 2026-02-17: Migration detail page translates person info, notes, and comments in real-time
- 2026-02-17: My Orders page shows translated product names using static product translation map
- 2026-02-17: My Submissions page uses TranslatedText component for dynamic content
- 2026-02-17: Full multilingual i18n support - 4 languages: English, Urdu (RTL), Hindi, Punjabi
- 2026-02-17: I18nProvider (lib/i18n.tsx) with AsyncStorage persistence, useI18n hook, LANGUAGES array
- 2026-02-17: Translation files: lib/translations/en.ts, ur.ts, hi.ts, pa.ts (15+ sections each)
- 2026-02-17: Language selector on Profile page with native labels (English, اردو, हिन्दी, ਪੰਜਾਬੀ)
- 2026-02-17: ALL 18+ screens updated with translations (tabs, home, services, shop, humanfind, profile, login, orders, submissions, submit-details, admin, blog, history, pakistan-guide, protocol/video/customs requests, migration-detail)
- 2026-02-17: Tab bar labels translate dynamically when language changes
- 2026-02-16: Added My Orders page (app/my-orders.tsx) - users can view orders, see order tracking timeline with 6 statuses
- 2026-02-16: Order tracking statuses: pending, confirmed, processing, shipped, out_for_delivery, delivered (+ cancelled)
- 2026-02-16: Added tracking_number and status_updated_at columns to orders table
- 2026-02-16: New API endpoints: GET /api/orders/:id, PUT /api/admin/orders/:id/status, GET /api/admin/orders
- 2026-02-16: Admin dashboard has Orders section with status management
- 2026-02-16: Shop order success modal now shows "Track My Order" button linking to My Orders
- 2026-02-16: Profile page has My Orders card (before My Submissions)
- 2026-02-16: Added My Submissions page (app/my-submissions.tsx) - users can view, edit, and delete their own property and person submissions
- 2026-02-16: Added submitted_by column to property_details table for user tracking
- 2026-02-16: New API endpoints: GET /api/my-submissions, PUT /api/property-details/:id, PUT /api/migration-records/:id, DELETE /api/my-submissions/property/:id, DELETE /api/my-submissions/person/:id
- 2026-02-16: My Submissions card added to Profile page (between Submit card and Quick Links)
- 2026-02-15: Added blog writing permission request form - users can request writing access, admin approves/rejects from dashboard
- 2026-02-15: blog_write_requests table, API endpoints for submit/approve/reject, admin Writers section
- 2026-02-15: Approved writers + admins can both write blog posts
- 2026-02-15: Added Blog page with post cards, category filters, like system, write post modal with image upload
- 2026-02-15: Blog accessible from Home page Explore section, 6 seed posts
- 2026-02-15: Migration Portal records now open full-page detail view with comments system
- 2026-02-15: Added migration_comments table, comment API endpoints (GET/POST)
- 2026-02-15: Profile page now has prominent gold gradient Submit Property Details card with image upload
- 2026-02-15: Submit Details form supports photo uploads (up to 5 images via expo-image-picker)
- 2026-02-14: Enhanced History page with image-based cards, hero banner, expandable details, location/year metadata, significance badges, 11 detailed entries with stock images
- 2026-02-14: Enhanced Pakistan Guide with image sections, hero banners, image place cards for tourism destinations, richer content across all sections (Partition, Old History, Modern History, Capital, Economy, Tourism)
- 2026-02-14: Added 16 stock images for landmarks (Lahore Fort, Badshahi Mosque, Faisal Mosque, Mohenjo-daro, Hunza Valley, K2, Swat Valley, Shalimar Gardens, Taxila, etc.)
- 2026-02-14: Replaced Rent tab with Bronze Migration & Family Search Portal (Explore tab)
- 2026-02-14: Added migration_records table with search, submit, and filter APIs
- 2026-02-14: Switched from Firebase Firestore to PostgreSQL for reliable cloud persistence
- 2026-02-14: All API endpoints verified working (bookings, cart, properties, profile, migration)
- 2026-02-13: Initial build - all core screens created

## Project Architecture
- **Stack**: Expo Router (React Native) + Express backend
- **Data**: PostgreSQL (built-in) for cloud persistence via JSONB columns
- **Database Tables**: bookings, cart, property_details, rental_inquiries, users, auth_users, migration_records, migration_comments, blog_posts
- **API Layer**: server/firebase.ts abstracts DB operations; server/routes.ts defines REST endpoints; server/auth.ts handles authentication
- **Font**: Poppins (Google Fonts)
- **Colors**: Emerald green + Gold accent (Pakistan inspired)

### Screens
- `app/(tabs)/index.tsx` - Home with services overview
- `app/(tabs)/services.tsx` - Protocol, Video ($100/hr), Customs services with booking
- `app/(tabs)/shop.tsx` - Product marketplace with cart
- `app/(tabs)/rent.tsx` - HumanFind page (Find People + Property Details search)
- `app/(tabs)/profile.tsx` - User profile + admin toggle
- `app/history.tsx` - Historical/destroyed places + modern Pakistan
- `app/submit-details.tsx` - Property/land detail submission form
- `app/admin.tsx` - Full admin dashboard with booking/property management
- `app/migration-detail.tsx` - Full-page migration record detail with comments system
- `app/blog.tsx` - Blog page with post cards, category filters, write post modal

### HumanFind Features
- Two tabs: Find People and Property Details
- People search by name, village, location (uses migration_records table)
- Property details search by owner, location, type (uses property_details table)
- Click person cards to open full-page detail view with comments
- Database: migration_records, migration_comments, property_details tables
- API: GET/POST /api/migration-records, GET /api/migration-records/:id, GET/POST /api/property-details

### Tab Navigation
5 tabs: Home, Services, Shop, HumanFind, Profile
Supports NativeTabs (iOS 26 liquid glass) and classic Tabs with blur

## User Preferences
- Main admin email: 47dapunjab@gmail.com
