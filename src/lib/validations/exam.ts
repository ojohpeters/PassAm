import { z } from "zod"

export const submitExamSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        selectedOptionId: z.string().uuid().nullable(),
      })
    )
    .min(1),
  timeTakenSecs: z.number().int().min(0),
})
