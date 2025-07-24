import { auth } from "@/middleware/auth"
import { UserOutputZodSchema } from "@/models/user.model"
import { FormatOutputZodSchema, SecurityObject } from "@/util"
import { app } from "@/util/hono"
import { createRoute } from "@hono/zod-openapi"

app.openapi(
    createRoute({
        method: "get",
        path: "/user",
        tags: ["User"],
        ...SecurityObject,
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched user information",
                content: {
                    "application/json": {
                        schema: FormatOutputZodSchema(UserOutputZodSchema)
                    }
                }
            }
        }
    }),
    async (c) => {
        return c.json(c.var.user)
    }
)
