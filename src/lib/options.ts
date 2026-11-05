// Stored values for select fields. Labels live in /messages/{locale}.json
// under "options.<group>.<value>".

export const SPECIALTIES = ["product_design", "ux_ui", "web_design", "brand", "other"] as const;
export const YEARS_EXPERIENCE = ["0-2", "3-5", "6-9", "10+"] as const;
export const PRODUCT_TYPES = ["desktop", "mobile", "both"] as const;
export const MARKETS = ["b2b", "b2c", "both"] as const;
export const PLATFORMS = ["figma", "framer", "webflow", "shopify", "wordpress", "other"] as const;

// The application form offers only the first two; "not_looking" is set later
// from the profile editor.
export const AVAILABILITY = ["actively_looking", "open_to_offers", "not_looking"] as const;
export const APPLICATION_AVAILABILITY = ["actively_looking", "open_to_offers"] as const;

export const DECLINE_REASONS = [
  "no_process_case_studies",
  "outside_focus",
  "not_enough_real_work",
  "portfolio_link_broken",
  "other",
] as const;

export const STATUSES = ["pending", "approved", "declined"] as const;

export type Specialty = (typeof SPECIALTIES)[number];
export type YearsExperience = (typeof YEARS_EXPERIENCE)[number];
export type ProductType = (typeof PRODUCT_TYPES)[number];
export type Market = (typeof MARKETS)[number];
export type Platform = (typeof PLATFORMS)[number];
export type Availability = (typeof AVAILABILITY)[number];
export type DeclineReason = (typeof DECLINE_REASONS)[number];
export type Status = (typeof STATUSES)[number];
