import { z } from "zod";

// Signup asks for email and password only (plus consent to the privacy
// policy). Error messages are message keys under "form.errors".

export const PASSWORD_MIN_LENGTH = 10;

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().max(254, "tooLong").pipe(z.email("invalidEmail")),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, "passwordTooShort")
    .max(72, "tooLong"), // bcrypt limit
  consent: z.literal(true, { error: "mustAccept" }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("invalidEmail")),
  password: z.string().min(1, "required"),
});

export type SignupInput = z.input<typeof signupSchema>;
