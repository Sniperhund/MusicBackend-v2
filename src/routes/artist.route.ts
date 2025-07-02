import { auth } from "@/middleware/auth"
import { Artist, ArtistZodSchema } from "@/models/artist.model"
import { FormatOutputZodSchema, SecurityObject, ZodMongooseId, ZodQueryUnionMongooseIds } from "@/util"
import { app } from "@/util/hono"
import { createRoute, z } from "@hono/zod-openapi"

app.openapi(
    createRoute({
        method: "get",
        path: "/artists",
        tags: ["Artist"],
        ...SecurityObject,
        request: {
            query: ZodQueryUnionMongooseIds
        },
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched artists",
                content: {
                    "application/json": {
                        schema: z.array(FormatOutputZodSchema(ArtistZodSchema))
                    }
                }
            }
        }
    }),
    async (c) => {
        const { ids } = c.req.valid("query")

        const artists = await Artist.find({ _id: { $in: ids } })

        return c.json(artists, 200)
    }
)
