import { z } from "zod";
import {
  AVAILABILITY,
  MARKETS,
  PLATFORMS,
  PRODUCT_TYPES,
  SPECIALTIES,
  YEARS_EXPERIENCE,
} from "@/lib/options";

// Profile fields, filled in after signing in (signup asks only for email and
// password). Error messages are message keys under "form.errors".
// The same schema runs in the browser and on the server.

const httpUrl = z
  .string()
  .trim()
  .min(1, "required")
  .max(500, "tooLong")
  .transform((value) => (/^https?:\/\//i.test(value) ? value : `https://${value}`))
  .refine((value) => {
    try {
      const url = new URL(value);
      return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
    } catch {
      return false;
    }
  }, "invalidUrl");

// LinkedIn is optional.
export const linkedinUrl = httpUrl.refine((value) => {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "linkedin.com" || host.endsWith(".linkedin.com");
  } catch {
    return false;
  }
}, "invalidLinkedin");

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "required").max(120, "tooLong"),
  portfolio_url: httpUrl,
  linkedin_url: linkedinUrl.optional(),
  specialty: z.enum(SPECIALTIES, { error: "required" }),
  years_experience: z.enum(YEARS_EXPERIENCE, { error: "required" }),
  product_type: z.enum(PRODUCT_TYPES, { error: "required" }),
  market: z.enum(MARKETS, { error: "required" }),
  platforms: z.array(z.enum(PLATFORMS)).max(PLATFORMS.length).default([]),
  industries: z
    .string()
    .trim()
    .max(300, "tooLong")
    .optional()
    .transform((value) => value || null),
  availability: z.enum(AVAILABILITY, { error: "required" }),
  confidential: z.boolean().default(false),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type Profile = z.output<typeof profileSchema>;
