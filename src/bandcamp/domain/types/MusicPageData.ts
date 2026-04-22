export interface MusicPageData {
  recaptcha_public_key: string;
  invisible_recaptcha_public_key: string;
  lo_querystr: string;
  localize_page: boolean;
  locale: string;
  languages: Record<string, string>;
  help_center_url: string;
  cfg: MusicPageConfig;
  identities: MusicPageIdentities;
  signup_params: Record<string, unknown>;
  fan_onboarding: FanOnboarding;
  templglobals: TemplGlobals;
  payment_type: string;
  saved_card: SavedCard;
}

export interface MusicPageConfig {
  menubar_autocomplete_enabled: boolean;
  use_elasticsearch_backed_search: boolean;
  new_search_api_service: boolean;
  search_tracking: boolean;
  single_sign_up: boolean;
  fan_signup_use_captcha: boolean;
  gift_cards: boolean;
  order_history: boolean;
  header_rework_2018: boolean;
  search_discovery_one_filter_desktop_only: boolean;
  search_discovery_one_filter_rollout: boolean;
  community: boolean;
  login_use_captcha: boolean;
  no_flash_uploads: boolean;
  open_signup: boolean;
  band_navbar_update_2023: boolean;
}

export interface MusicPageIdentities {
  user: User;
  ip_country_code: string;
  fan: Fan;
  is_page_band_member: boolean | null;
  subscribed_to_page_band: boolean | null;
  bands: unknown[];
  partner: boolean;
  is_admin: boolean;
  labels: unknown[];
  page_band: unknown | null;
  active_licenses: unknown[];
}

export interface User {
  id: number;
}

export interface Fan {
  id: number;
  username: string;
  name: string;
  photo: number;
  private: boolean;
  verified: boolean;
  url: string;
}

export interface FanOnboarding {
  tooltips: unknown | null;
  num_tooltips: number;
  tooltip_number: number | null;
  current_index: number | null;
  complete: boolean;
  show_collection_banner: boolean;
  show_feed_banner: boolean;
  show_verify_banner: boolean;
  first_wishlisted_item_title: string | null;
  first_wishlisted_item_type: string | null;
  first_purchased_item_title: string | null;
  first_purchased_item_type: string | null;
  template: string | null;
  email: string;
  has_collection: boolean;
  has_seen_tooltips: boolean;
  show_first_wishlist_tooltip: boolean;
  deferred: unknown | null;
}

export interface TemplGlobals {
  endpoint_mobilized: boolean;
  is_phone: boolean;
}

export interface SavedCard {
  last4: string;
  brand: string;
  brand_slug: string;
}
