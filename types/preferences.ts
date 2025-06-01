export type Theme = 'light' | 'dark' | 'system';

export type VisibilityLevel = 'public' | 'followers' | 'private';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';

export type Region = 'US' | 'CA' | 'GB' | 'AU' | 'DE' | 'FR' | 'ES' | 'IT' | 'JP' | 'KR' | 'CN' | 'BR' | 'MX' | 'IN';

export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

export interface UserPreferences {
  id: string;
  user_id: string;
  
  // Theme preferences
  theme: Theme;
  
  // Default visibility settings
  default_review_visibility: VisibilityLevel;
  default_list_visibility: VisibilityLevel;
  default_watchlist_visibility: VisibilityLevel;
  default_activity_visibility: VisibilityLevel;
  
  // Notification preferences
  email_notifications: boolean;
  push_notifications: boolean;
  notify_on_follow: boolean;
  notify_on_review_like: boolean;
  notify_on_review_comment: boolean;
  notify_on_list_like: boolean;
  notify_on_list_comment: boolean;
  notify_on_recommendation: boolean;
  notify_on_system_updates: boolean;
  
  // Regional and language settings
  language: Language;
  region: Region;
  timezone: string;
  
  // Content preferences
  adult_content: boolean;
  spoiler_protection: boolean;
  auto_mark_watched: boolean;
  
  // Display preferences
  items_per_page: number;
  date_format: DateFormat;
  
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesUpdate {
  theme?: Theme;
  default_review_visibility?: VisibilityLevel;
  default_list_visibility?: VisibilityLevel;
  default_watchlist_visibility?: VisibilityLevel;
  default_activity_visibility?: VisibilityLevel;
  email_notifications?: boolean;
  push_notifications?: boolean;
  notify_on_follow?: boolean;
  notify_on_review_like?: boolean;
  notify_on_review_comment?: boolean;
  notify_on_list_like?: boolean;
  notify_on_list_comment?: boolean;
  notify_on_recommendation?: boolean;
  notify_on_system_updates?: boolean;
  language?: Language;
  region?: Region;
  timezone?: string;
  adult_content?: boolean;
  spoiler_protection?: boolean;
  auto_mark_watched?: boolean;
  items_per_page?: number;
  date_format?: DateFormat;
}

export const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System'
};

export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
  public: 'Public',
  followers: 'Followers Only',
  private: 'Private'
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語',
  ko: '한국어',
  zh: '中文'
};

export const REGION_LABELS: Record<Region, string> = {
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  JP: 'Japan',
  KR: 'South Korea',
  CN: 'China',
  BR: 'Brazil',
  MX: 'Mexico',
  IN: 'India'
};

export const DATE_FORMAT_LABELS: Record<DateFormat, string> = {
  'MM/DD/YYYY': 'MM/DD/YYYY (US)',
  'DD/MM/YYYY': 'DD/MM/YYYY (EU)',
  'YYYY-MM-DD': 'YYYY-MM-DD (ISO)'
};

export const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  theme: 'system',
  default_review_visibility: 'public',
  default_list_visibility: 'public',
  default_watchlist_visibility: 'public',
  default_activity_visibility: 'public',
  email_notifications: true,
  push_notifications: true,
  notify_on_follow: true,
  notify_on_review_like: true,
  notify_on_review_comment: true,
  notify_on_list_like: true,
  notify_on_list_comment: true,
  notify_on_recommendation: true,
  notify_on_system_updates: true,
  language: 'en',
  region: 'US',
  timezone: 'UTC',
  adult_content: false,
  spoiler_protection: true,
  auto_mark_watched: false,
  items_per_page: 20,
  date_format: 'MM/DD/YYYY'
}; 