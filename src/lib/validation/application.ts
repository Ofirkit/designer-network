import { z } from "zod";
import {
  APPLICATION_AVAILABILITY,
  MARKETS,
  PLATFORMS,
  PRODUCT_TYPES,
  SPECIALTIES,
  YEARS_EXPERIENCE,
} from "@/lib/options";

// Error messages are message keys under "form.errors" so they can be
// translated. The same schema runs in the browser and on the server.

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

const linkedinUrl = httpUrl.refine((value) => {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "linkedin.com" || host.endsWith(".linkedin.com");
  } catch {
    return false;
  }
}, "invalidLinkedin");

const mustBeChecked = z.literal(true, { error: "mustAccept" });

export const applicationSchema = z.object({
  full_name: z.string().trim().min(2, "required").max(120, "tooLong"),
  email: z.string().trim().toLowerCase().max(254, "tooLong").pipe(z.email("invalidEmail")),
  phone: z
    .string()
    .trim()
    .max(30, "tooLong")
    .refine((value) => value === "" || /^[+\d][\d\s()-]{6,}$/.test(value), "invalidPhone")
    .optional()
    .transform((value) => value || null),
  linkedin_url: linkedinUrl,
  portfolio_url: httpUrl,
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
  availability: z.enum(APPLICATION_AVAILABILITY, { error: "required" }),
  confidential: z.boolean().default(false),
  own_work: mustBeChecked,
  consent: mustBeChecked,
});

export type ApplicationInput = z.input<typeof applicationSchema>;
export type Application = z.output<typeof applicationSchema>;
