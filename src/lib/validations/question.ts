import { z } from "zod"

export const createQuestionSchema = z.object({
  text: z.string().min(10),
  explanation: z.string().optional(),
  year: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear())
    .optional(),
  schoolId: z.string().uuid(),
  subjectId: z.string().uuid(),
  options: z
    .array(
      z.object({
        label: z.enum(["A", "B", "C", "D"]),
        text: z.string().min(1),
        isCorrect: z.boolean(),
      })
    )
    .length(4)
    .refine(
      (opts) => opts.filter((o) => o.isCorrect).length === 1,
      "Exactly one option must be marked correct"
    ),
})
