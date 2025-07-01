import { z } from "@hono/zod-openapi"
import { ZodMongooseId } from "."

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

export const DependentsError = (type: string) => {
    return {
        description: `${type} couldn't get deleted since it has one or more dependents`,
        content: {
            "application/json": {
                schema: z.object({
                    message: z.string(),
                    dependentType: z.string(),
                    dependents: z.array(z.object({
                        _id: ZodMongooseId,
                        name: z.string()
                    }))
                })
            }
        }
    }
}
