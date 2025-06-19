import { z } from "@hono/zod-openapi"

export const StdError = (desc: string) => {
    return {
        description: desc,
        content: {
            "application/json": {
                schema: z.object({
                    message: z.string()
                })
            }
        }
    }
}
