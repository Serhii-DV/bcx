// Bandcamp Collection Page Data Interface
export interface CollectionPageData {
  recaptcha_public_key: string;
  invisible_recaptcha_public_key: string;
  localize_page: boolean;
  locale: string;
  languages: Record<string, string>;
  help_center_url: string;
  templglobals: TemplGlobals;
  image_editor_enabled: boolean;
  signup_querystrings: Record<string, string>;
  cfg: ConfigFlags;
  identities: Identities;
  signup_params: Record<string, unknown>;
  fan_onboarding: FanOnboarding;
  utc_for_new_banner: string;
  social_prefs: SocialPreferences;
  media_mode_test: boolean;
  currency_data: CurrencyData;
  fan_read_only: boolean;
  from_fansuggest: null | string;
  fan_stats: FanStats;
  tracklists: Tracklists;
  platform: string;
  active_tab: string;
  mobile_app_compatible: boolean;
  platform_app_url: null | string;
  mobile_app_url: string;
  fan_data: FanData;
  current_fan: CurrentFan;
  collection_data: CollectionData;
  wishlist_data: WishlistData;
  hidden_data: HiddenData;
  gifts_given_data: GiftsGivenData;
  followers_data: FollowersData;
  following_bands_data: FollowingBandsData;
  following_fans_data: FollowingFansData;
  following_genres_data: FollowingGenresData;
  embed_data: EmbedData;
  item_cache: ItemCache;
  fan_suggestions_data: FanSuggestionsData;
  banner_data: BannerData;
  MAX_NAME_LENGTH: number;
  MAX_BIO_LENGTH: number;
  MAX_WEBSITE_URL_LENGTH: number;
  MAX_WHY_LENGTH: number;
  REVIEW_OR_FAVTRACK_FOUND: boolean;
  collection_count: number;
  genre_picker: GenrePicker;
  show_newsletter_invite_banner: boolean;
}

export interface TemplGlobals {
  endpoint_mobilized: boolean;
  is_phone: boolean;
}

export interface ConfigFlags {
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
  gifting: boolean;
  artist_subscriptions: boolean;
  open_signup: boolean;
  fan_page_2017: boolean;
  genre_management: boolean;
  mobile_onboarding: boolean;
  fan_collection_also_collected_expand: boolean;
  fan_collection_also_collected_counts: boolean;
}

export interface IdentityUser {
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

export interface Identities {
  user: IdentityUser;
  ip_country_code: string;
  fan: Fan;
  is_page_band_member: null | boolean;
  subscribed_to_page_band: null | boolean;
  bands: unknown[];
  partner: boolean;
  is_admin: boolean;
  labels: unknown[];
}

export interface FanOnboarding {
  tooltips: null | unknown[];
  num_tooltips: number;
  tooltip_number: null | number;
  current_index: null | number;
  complete: boolean;
  show_collection_banner: boolean;
  show_feed_banner: boolean;
  show_verify_banner: boolean;
  first_wishlisted_item_title: null | string;
  first_wishlisted_item_type: null | string;
  first_purchased_item_title: null | string;
  first_purchased_item_type: null | string;
  template: null | string;
  email: string;
  has_collection: boolean;
  has_seen_tooltips: boolean;
  show_first_wishlist_tooltip: boolean;
  deferred: null | unknown;
}

export interface SocialPreferences {
  fb_is_connected: boolean;
  tw_is_connected: boolean;
}

export interface CurrencyInfo {
  symbol: string;
  long: string;
  plural: string;
  prefix_utf8: string;
  prefix: string;
  prefix_informal_utf8: string;
  prefix_informal: string;
  suffix_informal: string;
  places: number;
  a_dollar: number;
  small_min_price: number;
  medium_min_price: number;
  fixed_rate: number;
  slang?: string[];
  paypal: boolean;
  payflow: boolean;
}

export interface CurrencyData {
  info: Record<string, CurrencyInfo>;
  list: string[];
  rates: Record<string, number>;
  setting: null | string;
  current: null | string;
}

export interface FanStats {
  fan_id: number;
  other_visits: number;
  other_plays: number;
  other_wishlists: number;
  other_purchases: number;
  fansuggest_welcome: number;
  fansuggest_activity: number;
  fansuggest_sidebar: number;
  fansuggest_followed: number;
  fansuggest_feed: number;
  fansuggest_collection: number;
  fan_edit_photo: number;
  photo_facebook: number;
  photo_twitter: number;
  photo_upload: number;
  views_desktop: number;
  views_mobile: number;
}

export interface Track {
  id: number;
  title: string;
  artist: string;
  track_number: number;
  duration: number;
  file: Record<string, string>;
}

export interface Tracklists {
  collection: Record<string, Track[]>;
  wishlist: Record<string, Track[]>;
}

export interface FanData {
  trackpipe_url: string;
  username: string;
  name: string;
  fan_id: number;
  location: string;
  raw_location: string;
  bio: string;
  photo: PhotoInfo;
  website_url: string;
  is_own_page: boolean;
  followers_count: number;
  following_bands_count: number;
  following_fans_count: number;
  following_genres_count: number;
  subscriptions_count: number;
  fav_genre: string;
}

export interface PhotoInfo {
  image_id: number;
  width: number;
  height: number;
}

export interface ItemLookup {
  item_type: string;
  purchased: boolean;
}

export interface CurrentFan {
  fan_id: number;
  username: string;
  item_lookup: Record<string, ItemLookup>;
  trackpipe_url: string;
  collection_count: number;
  is_following: boolean;
  is_following_any: null | boolean;
  is_own_collection: boolean;
  subscriptions_count: number;
}

export interface CollectionData {
  redownload_urls: Record<string, string>;
  last_token: string;
  item_count: number;
  batch_size: number;
  hidden_items_count: number;
  small_collection: boolean;
  small_wishlist: boolean;
  purchase_infos: Record<string, unknown>;
  collectors: Record<string, unknown>;
  sequence: string[];
  pending_sequence: string[];
}

export interface WishlistData {
  last_token: string;
  item_count: number;
  batch_size: number;
  hidden: boolean;
  sequence: string[];
  pending_sequence: string[];
}

export interface HiddenData {
  last_token: null | string;
  last_token_is_gift_given: null | boolean;
  item_count: number;
  batch_size: number;
  sequence: string[];
  pending_sequence: string[];
}

export interface GiftsGivenData {
  visible_count: number;
  hidden_count: number;
  similar: Record<string, unknown>;
  last_token: null | string;
  item_count: number;
  batch_size: number;
  sequence: string[];
  pending_sequence: string[];
}

export interface FollowersData {
  last_token: string;
  batch_size: number;
  item_count: number;
  sequence: string[];
  pending_sequence: string[];
}

export interface FollowingBandsData {
  last_token: string;
  batch_size: number;
  item_count: number;
  sequence: string[];
  pending_sequence: string[];
}

export interface FollowingFansData {
  last_token: string;
  batch_size: number;
  item_count: number;
  sequence: string[];
  pending_sequence: string[];
}

export interface FollowingGenresData {
  last_token: string;
  batch_size: number;
  item_count: number;
  hidden: boolean;
  sequence: string[];
  pending_sequence: string[];
}

export interface EmbedData {
  linkback: string;
}

export interface ItemCacheItem {
  item_id: number;
  item_type: string;
  tralbum_id: number;
  tralbum_type: string;
  album_id: null | number;
  item_title: string;
  band_id: number;
  band_name: string;
  featured_track: number;
  featured_track_title: string;
  featured_track_url: null | string;
  featured_track_is_custom: boolean;
  also_collected_count: number;
  why: null | string;
  url_hints: UrlHints;
  item_art_id: number;
  item_url: string;
  package_details: null | unknown;
  num_streamable_tracks: number;
  is_purchasable: boolean;
  is_private: boolean;
  is_preorder: boolean;
  is_giftable: boolean;
  is_subscriber_only: boolean;
  is_subscription_item: boolean;
  hidden: null | boolean;
  gift_sender_name: null | string;
  gift_sender_note: null | string;
  gift_id: null | number;
  gift_recipient_name: null | string;
  sale_item_id: null | number;
  sale_item_type: null | string;
  band_image_id: null | number;
  band_location: null | string;
  release_count: null | number;
  message_count: null | number;
  service_name: null | string;
  service_url_fragment: null | string;
  download_available: boolean;
  purchased: null | string;
}

export interface UrlHints {
  subdomain: string;
  custom_domain: null | string;
  custom_domain_verified: null | boolean;
  slug: string;
  item_type: string;
}

export interface ItemCache {
  collection: Record<string, ItemCacheItem>;
  wishlist: Record<string, ItemCacheItem>;
  gifts_given: Record<string, unknown>;
  hidden: Record<string, unknown>;
  followers: Record<string, FollowerItem>;
  following_bands: Record<string, FollowingBandItem>;
  following_fans: Record<string, FollowingFanItem>;
  following_genres: Record<string, GenreItem>;
  fan_suggestions: Record<string, unknown>;
}

export interface FollowerItem {
  fan_id: number;
  band_id: null | number;
  fan_url: null | string;
  image_id: number;
  trackpipe_url: string;
  name: string;
  is_following: boolean;
  location: null | string;
  date_followed: string;
  token: string;
}

export interface FollowingBandItem {
  band_id: number;
  image_id: null | number;
  art_id: null | number;
  url_hints: UrlHints;
  name: string;
  is_following: boolean;
  is_subscribed: null | boolean;
  location: null | string;
  date_followed: string;
  token: string;
}

export interface FollowingFanItem {
  fan_id: number;
  band_id: null | number;
  fan_url: null | string;
  image_id: number;
  trackpipe_url: string;
  name: string;
  is_following: boolean;
  location: null | string;
  date_followed: string;
  token: string;
}

export interface GenreItem {
  discover_id: number;
  name: string;
  norm_name: string;
  token: string;
  is_following: boolean;
  date: null | string;
  genre_id: number;
  tag_id: number;
  geoname_id: number;
  format_type: string;
  art_ids: number[];
  location: null | string;
  discover_url: null | string;
  tag_page_url: string;
  display_name: string;
}

export interface FanSuggestionsData {
  item_count: number;
  sequence: string[];
  pending_sequence: string[];
}

export interface BannerChoice {
  banner_id: number;
  banner_url: string;
  banner_image_id: number;
  mobile_image_id: number;
  name: string;
  alignment: number;
}

export interface BannerData {
  banner_choices: BannerChoice[];
  banner_url: string;
  banner_align: number;
  banner_id: number;
  banner_image_id: number;
  custom_banner_image_id: null | number;
  custom_banner_url: string;
  custom_banner_align: null | number;
  custom_banner_image_hash: null | string;
  is_custom_banner: boolean;
}

export interface GenreOption {
  id: number;
  name: string;
  norm_name: string;
  value: string;
}

export interface SubgenreOption {
  name: string;
  value: string;
  norm_name: string;
}

export interface GenrePicker {
  genres: GenreOption[];
  subgenres: Record<string, SubgenreOption[]>;
}
