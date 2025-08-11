import { auth } from "@/middleware/auth"
import { Album, AlbumZodSchema } from "@/models/album.model"
import { ArtistZodSchema } from "@/models/artist.model"
import { GenreZodSchema } from "@/models/genre.model"
import { Track, TrackZodSchema } from "@/models/track.model"
import { FormatOutputZodSchema, SecurityObject, ZodMongooseId, ZodQueryUnionMongooseIds } from "@/util"
import { app } from "@/util/hono"
import { createRoute, z } from "@hono/zod-openapi"

app.openapi(
    createRoute({
        method: "get",
        path: "/albums",
        tags: ["Album"],
        ...SecurityObject,
        request: {
            query: ZodQueryUnionMongooseIds
        },
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched albums",
                content: {
                    "application/json": {
                        schema: z.array(FormatOutputZodSchema(AlbumZodSchema.omit({ artists: true, genre: true }).extend({ artists: z.array(ArtistZodSchema), genre: GenreZodSchema })))
                    }
                }
            }
        }
    }),
    async (c) => {
        const { ids } = c.req.valid("query")

        const albums = await Album.find({ _id: { $in: ids } })
            .populate("artists")
            .populate("genre")

        return c.json(albums, 200)
    }
)

app.openapi(
    createRoute({
        method: "get",
        path: "/albums/{id}",
        tags: ["Album"],
        ...SecurityObject,
        request: {
            params: z.object({
                id: ZodMongooseId
            })
        },
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched album",
                content: {
                    "application/json": {
                        schema: FormatOutputZodSchema(AlbumZodSchema.omit({ artists: true, genre: true }).extend({ artists: z.array(ArtistZodSchema), genre: GenreZodSchema }))
                    }
                }
            }
        }
    }),
    async (c) => {
        const { id } = c.req.valid("param")

        const album = await Album.findOne({ _id: id })
            .populate("artists")
            .populate("genre")

        return c.json(album, 200)
    }
)

app.openapi(
    createRoute({
        method: "get",
        path: "/albums/{id}/tracks",
        tags: ["Album"],
        ...SecurityObject,
        request: {
            params: z.object({
                id: ZodMongooseId
            }),
            query: z.object({
                limit: z.coerce.number().min(1).default(9).optional(),
                skip: z.coerce.number().min(0).default(0).optional()
            })
        },
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched tracks for an album",
                content: {
                    "application/json": {
                        schema: z.array(FormatOutputZodSchema(TrackZodSchema.omit({ album: true, artists: true }).extend({ artists: z.array(ArtistZodSchema), album: AlbumZodSchema.omit({ artists: true, genre: true }) })))
                    }
                }
            }
        }
    }),
    async (c) => {
        const { id } = c.req.valid("param")
        const { limit, skip } = c.req.valid("query")

        const tracks = await Track.find({ album: id })
            .limit(limit || 9)
            .skip(skip || 0)
            .populate("artists")
            .populate({
                path: "album",
                select: "-artists -genre",
            })

        return c.json(tracks, 200)
    }
)
