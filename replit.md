# 47daPunjab

## Overview
A mobile service platform for Punjab, Pakistan visitors. Features protocol services, village video recording, customs assistance, shop, rentals, history, and property detail submissions.

## Recent Changes
- 2026-02-14: Switched from Firebase Firestore to PostgreSQL for reliable cloud persistence
- 2026-02-14: All API endpoints verified working (bookings, cart, properties, profile, rentals)
- 2026-02-13: Initial build - all core screens created

## Project Architecture
- **Stack**: Expo Router (React Native) + Express backend
- **Data**: PostgreSQL (built-in) for cloud persistence via JSONB columns
- **Database Tables**: bookings, cart, property_details, rental_inquiries, users
- **API Layer**: server/firebase.ts abstracts DB operations; server/routes.ts defines REST endpoints
- **Font**: Poppins (Google Fonts)
- **Colors**: Emerald green + Gold accent (Pakistan inspired)

### Screens
- `app/(tabs)/index.tsx` - Home with services overview
- `app/(tabs)/services.tsx` - Protocol, Video ($100/hr), Customs services with booking
- `app/(tabs)/shop.tsx` - Product marketplace with cart
- `app/(tabs)/rent.tsx` - Rental listings (property, vehicle, equipment)
- `app/(tabs)/profile.tsx` - User profile + admin toggle
- `app/history.tsx` - Historical/destroyed places + modern Pakistan
- `app/submit-details.tsx` - Property/land detail submission form
- `app/admin.tsx` - Full admin dashboard with booking/property management

### Tab Navigation
5 tabs: Home, Services, Shop, Rent, Profile
Supports NativeTabs (iOS 26 liquid glass) and classic Tabs with blur

## User Preferences
- Not specified yet
