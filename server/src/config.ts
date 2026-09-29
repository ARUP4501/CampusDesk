import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const ConfigSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(5000),
  APP_URL: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().default("postgresql://campusdesk:campusdesk_secret@localhost:5432/campusdesk_db?schema=public"),
  JWT_SECRET: z.string().default("campusdesk_jwt_super_secret_key_change_in_production_32chars"),
  VAPID_PUBLIC_KEY: z.string().default("BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSPOSnfMSC2101MmVC30RE4FTC4m5006_5PU"),
  VAPID_PRIVATE_KEY: z.string().default("1wR7_2L-rW56G2oQ_17uX_14l_11O_00l-57G_99l-4"),
  VAPID_SUBJECT: z.string().default("mailto:admin@campusdesk.edu"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  ENABLE_EMAIL: z.coerce.boolean().default(false),
  SHOW_SAMPLE_BANNER: z.string().default("true")
});

export const config = ConfigSchema.parse(process.env);
