import { adminAuth } from "@/middleware/auth"
import { Genre, GenreZodSchema } from "@/models/genre.model"
import { FormatOutputZodSchema, SecurityObject, ZodMongooseId } from "@/util"
import { app } from "@/util/hono"
import { StdError } from "@/util/responses"
import { createRoute, z } from "@hono/zod-openapi"

app.openapi(
    createRoute({
        method: "post",
        path: "/admin/genre",
        tags: ["Admin"],
        ...SecurityObject,
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: GenreZodSchema
                    }
                }
            }
        },
        middleware: [adminAuth] as const,
        responses: {
            201: {
                description: "Genre created",
                content: {
                    "application/json": {
                        schema: FormatOutputZodSchema(GenreZodSchema)
                    }
                }
            },
            400: StdError("Genre creation failed")
        }
    }),
    async (c) => {
        const body = c.req.valid("json")

        try {
            const genre = await Genre.create(body)
            return c.json(genre, 201)
        } catch(error: any) {
            if (error.code == 11000) {
                return c.json({ message: "Genre already exists" }, 400)
            }

            return c.json({ message: "Unknown error" }, 400)
        }
    }
)

app.openapi(
    createRoute({
        method: "patch",
        path: "/admin/genre",
        tags: ["Admin"],
        ...SecurityObject,
        request: {
            query: z.object({
                id: ZodMongooseId
            }),
            body: {
                content: {
                    "application/json": {
                        schema: GenreZodSchema.partial()
                    }
                }
            }
        },
        middleware: [adminAuth] as const,
        responses: {
            200: {
                description: "Genre updated",
                content: {
                    "application/json": {
                        schema: FormatOutputZodSchema(GenreZodSchema)
                    }
                }
            },
            404: StdError("Genre not found")
        }
    }),
    async (c) => {
        const { id } = c.req.valid("query")
        const body = c.req.valid("json")

        const genre = await Genre.findByIdAndUpdate(id, body, { new: true })

        if (!genre) {
            return c.json({ message: "Genre not found" }, 404)
        }

        return c.json(genre, 200)
    }
)

app.openapi(
    createRoute({
        method: "delete",
        path: "/admin/genre",
        tags: ["Admin"],
        ...SecurityObject,
        request: {
            query: z.object({
                id: ZodMongooseId
            })
        },
        middleware: [adminAuth] as const,
        responses: {
            200: {
                description: "Genre deleted"
            },
            404: StdError("Genre not found")
        }
    }),
    async (c) => {
        const { id } = c.req.valid("query")

        const genre = await Genre.findByIdAndDelete(id)

        if (!genre) {
            return c.json({ message: "Genre not found" }, 404)
        }

        return c.json({}, 200)
    }
)
