# 47daPunjab

## Overview
A mobile service platform for Punjab, Pakistan visitors. Features protocol services, village video recording, customs assistance, shop, Bronze Migration & Family Search Portal, history, and property detail submissions.

## Recent Changes
- 2026-02-15: Added "47daPunjab Visit Places" blog system with admin-only post creation and user commenting
- 2026-02-15: Added blog_posts, blog_comments tables with seed data (5 tourist attraction posts)
- 2026-02-15: Added products table with 8 seed products, shop now fetches from database API
- 2026-02-15: Admin panel now manages blog posts and products (create/delete via modal forms)
- 2026-02-15: Explore tab has section toggle between "Visit Places Blog" and "Migration Portal"
- 2026-02-15: Blog detail page (blog-detail.tsx) with hero section, content, and comment system
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
- **Database Tables**: bookings, cart, property_details, rental_inquiries, users, auth_users, migration_records, migration_comments, blog_posts, blog_comments, products
- **API Layer**: server/firebase.ts abstracts DB operations; server/routes.ts defines REST endpoints; server/auth.ts handles authentication
- **Font**: Poppins (Google Fonts)
- **Colors**: Emerald green + Gold accent (Pakistan inspired)

### Screens
- `app/(tabs)/index.tsx` - Home with services overview
- `app/(tabs)/services.tsx` - Protocol, Video ($100/hr), Customs services with booking
- `app/(tabs)/shop.tsx` - Product marketplace with cart
- `app/(tabs)/rent.tsx` - Bronze Migration & Family Search Portal (search/submit 1947 partition records)
- `app/(tabs)/profile.tsx` - User profile + admin toggle
- `app/history.tsx` - Historical/destroyed places + modern Pakistan
- `app/submit-details.tsx` - Property/land detail submission form
- `app/admin.tsx` - Full admin dashboard with booking/property/blog/product management
- `app/migration-detail.tsx` - Full-page migration record detail with comments system
- `app/blog-detail.tsx` - Blog post detail page with hero section and comment system

### Migration Portal Features
- Search by name, village, district, year, location (ILIKE full-text search)
- Filter by migration period (before/after 1947) and district
- Submit family migration records with validation
- Click record cards to open full-page detail view with hero section
- Comment system on each migration record (post and view comments)
- 10 seed records with real historical migration data
- Database: migration_records, migration_comments tables
- API: GET/POST /api/migration-records, GET /api/migration-records/:id, DELETE /api/migration-records/:id, PATCH /api/migration-records/:id/status, GET/POST /api/migration-records/:id/comments

### Tab Navigation
5 tabs: Home, Services, Shop, Explore (Migration Portal), Profile
Supports NativeTabs (iOS 26 liquid glass) and classic Tabs with blur

## User Preferences
- Not specified yet
