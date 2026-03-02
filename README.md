# 47daPunjab

A comprehensive mobile service platform for visitors in Punjab, Pakistan. Built with React Native (Expo) and Firebase.

## Features

- **Protocol Services** — Request official protocol services for visits
- **Village Video Recording** — Request video recording of villages
- **Customs Assistance** — Get help with customs processes
- **Shop** — Browse and purchase local products with multilingual support
- **HumanFind** — Search for people and properties across Punjab
- **Property Submissions** — Submit property details for verification
- **History & Culture** — Read articles about Punjab's rich history
- **Admin Panel** — Manage products, approve submissions, handle requests
- **Multilingual** — English, Urdu (RTL), Hindi, Punjabi
- **Dark/Light Theme** — Full theme support with persistence

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo Router) |
| Backend | Firebase (Auth, Firestore, Storage, Functions, FCM) |
| State Management | Zustand |
| Navigation | Expo Router (file-based) |
| i18n | Custom system with RTL support |
| Caching | AsyncStorage |

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Tab navigation (Home, Shop, Search, Profile)
│   ├── auth/               # Authentication screens
│   ├── protocol/           # Protocol services
│   ├── village/            # Village video recording
│   ├── customs/            # Customs assistance
│   ├── shop/               # Shop (product detail, cart, orders)
│   ├── humanfind/          # HumanFind (people & property search)
│   ├── property/           # Property submissions
│   ├── history/            # History & cultural content
│   └── admin/              # Admin panel
├── src/
│   ├── components/         # Shared UI components
│   ├── constants/          # Theme colors, collections, i18n strings
│   ├── hooks/              # Custom hooks (useTranslate, useFirestoreQuery)
│   ├── i18n/               # Language files (en, ur, hi, pa)
│   ├── services/           # Firebase service layer
│   ├── store/              # Zustand stores (auth, cart, theme)
│   └── types/              # TypeScript type definitions
├── functions/              # Firebase Cloud Functions
│   └── src/index.ts        # Translation API + FCM notification triggers
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
└── firebase.json           # Firebase project config
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project with Blaze plan (for Cloud Functions)

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/chzafar861/aastora.git
cd aastora
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable the following services:
   - **Authentication**: Enable Email/Password and Phone providers
   - **Firestore Database**: Create in production mode
   - **Storage**: Set up default bucket
   - **Cloud Messaging**: Enable for push notifications
3. Add a Web app in Project Settings and copy the config
4. Update `src/config/firebase.ts` with your Firebase credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 3. Deploy Security Rules

```bash
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy --only firestore:rules,storage
```

### 4. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 5. Enable Google Cloud Translate API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Enable the **Cloud Translation API**
4. The Cloud Functions will automatically use the project credentials

## Running the App

### Development

```bash
npx expo start
```

Scan the QR code with:
- **iOS**: Camera app or Expo Go
- **Android**: Expo Go app

### Build for Production

```bash
# Using EAS Build (recommended)
npx eas build --platform android
npx eas build --platform ios
```

## Firestore Collections

| Collection | Description | Access |
|-----------|-------------|--------|
| `users` | User profiles | Auth required |
| `protocol_requests` | Protocol service requests | Owner + Admin |
| `village_video_requests` | Village video requests | Owner + Admin |
| `customs_assistance` | Customs help requests | Owner + Admin |
| `products` | Shop products | Public read, Admin write |
| `orders` | User orders | Owner + Admin |
| `humanfind_people` | People search records | Public read, Auth write |
| `humanfind_properties` | Property search records | Public read, Auth write |
| `property_submissions` | Property detail submissions | Owner + Admin |
| `history_articles` | History & cultural content | Public read, Admin write |
| `translations_cache` | Cached translations | Public read, Functions write |
| `notifications` | Push notification records | Owner read |

## Cloud Functions

| Function | Trigger | Description |
|----------|---------|-------------|
| `translate` | HTTPS Callable | Translates text via Google Cloud Translate API with Firestore caching |
| `onOrderStatusUpdate` | Firestore onUpdate | Sends FCM notification when order status changes |
| `onProtocolRequestUpdate` | Firestore onUpdate | Sends FCM notification when protocol request status changes |
| `onNewHumanFindPerson` | Firestore onCreate | Logs new person entries (extensible for match alerts) |
| `onPropertySubmissionUpdate` | Firestore onUpdate | Sends FCM notification when property verification status changes |

## Multilingual Support

The app supports 4 languages with full RTL support for Urdu:

- **English** (en) — Default
- **Urdu** (ur) — Right-to-Left layout
- **Hindi** (hi)
- **Punjabi** (pa)

Language preference is stored in AsyncStorage and persists across sessions.

## Admin Setup

To make a user an admin, update their Firestore document:

```
users/{userId}.role = 'admin'
```

Admin capabilities: manage products, approve property submissions, update request statuses, upload history articles.

## License

MIT
