import { adminAuth } from "@/middleware/auth"
import { Genre, GenreZodSchema } from "@/models/genre.model"
import { SecurityObject } from "@/util"
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
                description: "Genre created"
            },
            400: StdError("Genre creation failed")
        }
    }),
    async (c) => {
        const { name } = await c.req.json()

        let genre = await Genre.findOne({
            name
        })

        if (genre) return c.json({ message: "Genre already exists" }, 400)

        genre = new Genre({
            name
        })

        await genre.save()

        return c.text("", 201)
    }
)
