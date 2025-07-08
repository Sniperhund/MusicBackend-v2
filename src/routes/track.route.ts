import { auth } from "@/middleware/auth"
import { Track, TrackZodSchema } from "@/models/track.model"
import { FormatOutputZodSchema, SecurityObject, ZodMongooseId, ZodQueryUnionMongooseIds } from "@/util"
import { app } from "@/util/hono"
import { createRoute, z } from "@hono/zod-openapi"

app.openapi(
    createRoute({
        method: "get",
        path: "/tracks",
        tags: ["Track"],
        ...SecurityObject,
        request: {
            query: ZodQueryUnionMongooseIds
        },
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched tracks",
                content: {
                    "application/json": {
                        schema: z.array(FormatOutputZodSchema(TrackZodSchema))
                    }
                }
            }
        }
    }),
    async (c) => {
        const { ids } = c.req.valid("query")

        const tracks = await Track.find({ _id: { $in: ids } })
            .populate({
                path: "album",
                select: "-artists",
                populate: {
                    path: "genre"
                }
            })
            .populate("artists")

        return c.json(tracks, 200)
    }
)

app.openapi(
    createRoute({
        method: "get",
        path: "/tracks/{id}",
        tags: ["Track"],
        ...SecurityObject,
        request: {
            params: z.object({
                id: ZodMongooseId
            })
        },
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched artist",
                content: {
                    "application/json": {
                        schema: FormatOutputZodSchema(TrackZodSchema)
                    }
                }
            }
        }
    }),
    async (c) => {
        const { id } = c.req.valid("param")

        const track = await Track.findOne({ _id: id })
            .populate({
                path: "album",
                select: "-artists",
                populate: {
                    path: "genre"
                }
            })
            .populate("artists")

        return c.json(track, 200)
    }
)

app.openapi(
    createRoute({
        method: "get",
        path: "/tracks/{id}/lyrics",
        tags: ["Track"],
        ...SecurityObject,
        request: {
            params: z.object({
                id: ZodMongooseId
            })
        },
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched artist",
                content: {
                    "application/json": {
                        schema: FormatOutputZodSchema(z.object({
                            synced: z.boolean(),
                            text: z.string()
                        }))
                    }
                }
            }
        }
    }),
    async (c) => {
        const { id } = c.req.valid("param")

        const track = await Track.findOne({ _id: id })
            .select("lyrics")

        if (!track) return c.json({}, 200)

        return c.json(track.lyrics, 200)
    }
)
