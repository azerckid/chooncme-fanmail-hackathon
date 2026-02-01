import { z } from "zod";

export const sendReplySchema = z.object({
    letterId: z.coerce.number().int().positive("Letter ID must be a positive integer"),
    to: z.string().email("Invalid email address"),
    subject: z.string().min(1, "Subject is required").max(200, "Subject must be at most 200 characters"),
    body: z.string().min(1, "Body is required"),
});

export type SendReplyInput = z.infer<typeof sendReplySchema>;
