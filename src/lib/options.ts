// Stored values for select fields. Labels live in /messages/{locale}.json
// under "options.<group>.<value>".

export const SPECIALTIES = ["product_design", "ux_ui", "web_design", "brand", "other"] as const;
export const YEARS_EXPERIENCE = ["0-2", "3-5", "6-9", "10+"] as const;
export const PRODUCT_TYPES = ["desktop", "mobile", "both"] as const;
export const MARKETS = ["b2b", "b2c", "both"] as const;
export const PLATFORMS = ["figma", "framer", "webflow", "shopify", "wordpress", "other"] as const;

export const AVAILABILITY = ["actively_looking", "open_to_offers", "not_looking"] as const;

export const MODERATION_REASONS = [
  "fake_profile",
  "work_not_own",
  "broken_portfolio",
  "broke_rules",
  "reported_by_company",
  "other",
] as const;

export const MODERATION_ACTIONS = ["warn", "hide", "remove", "restore"] as const;

// Account status is moderation only; there is no approval step.
export const STATUSES = ["active", "hidden", "removed"] as const;

export type Specialty = (typeof SPECIALTIES)[number];
export type YearsExperience = (typeof YEARS_EXPERIENCE)[number];
export type ProductType = (typeof PRODUCT_TYPES)[number];
export type Market = (typeof MARKETS)[number];
export type Platform = (typeof PLATFORMS)[number];
export type Availability = (typeof AVAILABILITY)[number];
export type ModerationReason = (typeof MODERATION_REASONS)[number];
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];
export type Status = (typeof STATUSES)[number];
