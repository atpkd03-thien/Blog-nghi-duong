import { z } from 'zod'
export const propertySchema=z.object({title:z.string().min(3).max(150),location:z.string().min(2).max(150),price:z.string().max(80).optional(),status:z.enum(['draft','published','sold']),description:z.string().max(5000).optional(),image_url:z.string().url().optional().or(z.literal(''))})
export const tourSchema=z.object({title:z.string().min(3).max(150),destination:z.string().min(2).max(150),price:z.string().max(80).optional(),status:z.enum(['draft','published']),description:z.string().max(5000).optional(),image_url:z.string().url().optional().or(z.literal(''))})
