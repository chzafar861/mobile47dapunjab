// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  PROTOCOL_REQUESTS: 'protocol_requests',
  VILLAGE_VIDEO_REQUESTS: 'village_video_requests',
  CUSTOMS_ASSISTANCE: 'customs_assistance',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  HUMANFIND_PEOPLE: 'humanfind_people',
  HUMANFIND_PROPERTIES: 'humanfind_properties',
  PROPERTY_SUBMISSIONS: 'property_submissions',
  HISTORY_ARTICLES: 'history_articles',
  TRANSLATIONS_CACHE: 'translations_cache',
  NOTIFICATIONS: 'notifications',
} as const;

// Firebase Storage paths
export const STORAGE_PATHS = {
  USER_PROFILE: (userId: string) => `users/${userId}/profile`,
  PROPERTY_IMAGES: (propertyId: string) => `properties/${propertyId}`,
  VILLAGE_VIDEOS: (requestId: string) => `villages/${requestId}`,
  PRODUCT_IMAGES: (productId: string) => `products/${productId}`,
} as const;
