import { z } from 'zod'

export const providerKeys = ['winget', 'choco', 'scoop'] as const
export type ProviderKey = (typeof providerKeys)[number]

export const wingetProviderSchema = z.object({
  packageId: z.string().min(1),
  source: z.string().min(1).default('winget'),
  supportsSilent: z.boolean().default(true),
  notes: z.string().default(''),
})

export const chocoProviderSchema = z.object({
  packageId: z.string().min(1),
  notes: z.string().default(''),
})

export const scoopProviderSchema = z.object({
  packageId: z.string().min(1),
  bucket: z.string().min(1).default('main'),
  notes: z.string().default(''),
})

export const providersSchema = z
  .object({
    winget: wingetProviderSchema.optional(),
    choco: chocoProviderSchema.optional(),
    scoop: scoopProviderSchema.optional(),
  })
  .refine(
    (value) =>
      value.winget !== undefined ||
      value.choco !== undefined ||
      value.scoop !== undefined,
    { message: 'At least one provider mapping is required.' },
  )

export const appSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1),
  popularity: z.number().int().min(0).max(100),
  addedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  icon: z.string().min(1),
  providers: providersSchema,
  homepage: z.string().url(),
  license: z.string().min(1),
  needsVerification: z.boolean().default(false),
})

export const catalogSchema = z.array(appSchema).min(60)

export type WingetProvider = z.infer<typeof wingetProviderSchema>
export type ChocoProvider = z.infer<typeof chocoProviderSchema>
export type ScoopProvider = z.infer<typeof scoopProviderSchema>
export type AppProviders = z.infer<typeof providersSchema>
export type CatalogApp = z.infer<typeof appSchema>
