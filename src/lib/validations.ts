import { z } from "zod";

// Sign-up, sign-in and reset schemas lived here until sign-in became OAuth
// only. Nothing issues or checks a password now, so a shape describing one
// would only invite it back.
//
// This one stays: /api/auth/resend-verification still takes an email.
export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const PLATFORMS = ["TikTok", "Instagram", "YouTube", "X", "Twitch"] as const;

export const CAMPAIGN_GOALS = [
  "Brand Awareness",
  "Product Launch",
  "Community Growth",
  "Content Volume",
  "Sales / Conversions",
] as const;

export const campaignSchema = z.object({
  name: z.string().min(2, "Campaign name is required").max(120),
  brandName: z.string().min(1, "Brand name is required").max(120),
  brandLogoUrl: z.string().max(500).optional().or(z.literal("")),
  website: z
    .string()
    .max(200)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^https?:\/\/.+/.test(v), "Must start with http:// or https://"),
  discord: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(4000).optional().or(z.literal("")),
  goal: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
  budget: z.coerce.number().min(1, "Budget must be at least $1").max(10_000_000),
  platforms: z.array(z.string()).min(1, "Pick at least one platform"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  fileIds: z.array(z.string()).optional(),
});

export const campaignUpdateSchema = campaignSchema.partial().extend({
  status: z
    .enum(["PENDING", "APPROVED", "RUNNING", "PAUSED", "COMPLETED", "CANCELLED"])
    .optional(),
});

export const ticketSchema = z.object({
  subject: z.string().min(3, "Give your ticket a subject").max(160),
  message: z.string().min(10, "Describe the issue in a little more detail").max(5000),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  fileIds: z.array(z.string()).optional(),
});

export const ticketReplySchema = z.object({
  body: z.string().min(1, "Write a reply").max(5000),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  company: z.string().max(120).optional().or(z.literal("")),
  image: z.string().max(500).optional().or(z.literal("")),
});

// No longer confirmed by a password: sign-in is OAuth only, so nobody has one
// to type. A valid session is what proves who this is.
export const emailChangeSchema = z.object({
  email: z.string().email(),
});

export const notificationPrefsSchema = z.object({
  emailCampaignUpdates: z.boolean(),
  emailInvoices: z.boolean(),
  emailProductUpdates: z.boolean(),
  emailMarketing: z.boolean(),
});

export type CampaignInput = z.infer<typeof campaignSchema>;
