// ===== User Types =====
export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  language: SupportedLanguage;
  profilePhoto: string;
  role: 'user' | 'admin';
  createdAt: number;
}

// ===== Language Types =====
export type SupportedLanguage = 'en' | 'ur' | 'hi' | 'pa';

export interface TranslationStrings {
  [key: string]: string;
}

// ===== Protocol Types =====
export interface ProtocolRequest {
  id?: string;
  userId: string;
  serviceType: string;
  location: string;
  date: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  notes: string;
  createdAt: number;
}

// ===== Village Video Types =====
export interface VillageVideoRequest {
  id?: string;
  userId: string;
  villageName: string;
  district: string;
  description: string;
  videoLinks: string[];
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  createdAt: number;
}

// ===== Customs Types =====
export interface CustomsAssistance {
  id?: string;
  userId: string;
  itemType: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt: number;
}

// ===== Shop Types =====
export interface Product {
  id?: string;
  name_en: string;
  name_ur: string;
  name_hi: string;
  name_pa: string;
  description_en: string;
  description_ur: string;
  description_hi: string;
  description_pa: string;
  price: number;
  images: string[];
  stock: number;
  category: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id?: string;
  userId: string;
  products: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: number;
}

// ===== HumanFind Types =====
export interface HumanFindPerson {
  id?: string;
  name: string;
  location: string;
  description: string;
  photo: string;
  contactInfo: string;
  createdAt: number;
}

export interface HumanFindProperty {
  id?: string;
  title: string;
  location: string;
  details: string;
  images: string[];
  ownerContact: string;
  createdAt: number;
}

// ===== Property Submission Types =====
export interface PropertySubmission {
  id?: string;
  userId: string;
  title: string;
  location: string;
  description: string;
  images: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: number;
}

// ===== History Article Types =====
export interface HistoryArticle {
  id?: string;
  title_en: string;
  title_ur: string;
  title_hi: string;
  title_pa: string;
  content_en: string;
  content_ur: string;
  content_hi: string;
  content_pa: string;
  images: string[];
  createdAt: number;
}

// ===== Notification Types =====
export interface AppNotification {
  id?: string;
  userId: string;
  title: string;
  body: string;
  type: 'order_update' | 'protocol_approved' | 'humanfind_match';
  read: boolean;
  createdAt: number;
}

// ===== Theme Types =====
export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  card: string;
  inputBackground: string;
  placeholder: string;
  accent: string;
}
