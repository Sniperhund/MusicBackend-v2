import { auth } from "@/middleware/auth"
import { Album, AlbumZodSchema } from "@/models/album.model"
import { Artist, ArtistZodSchema } from "@/models/artist.model"
import { GenreZodSchema } from "@/models/genre.model"
import { Track, TrackZodSchema } from "@/models/track.model"
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

app.openapi(
    createRoute({
        method: "get",
        path: "/artists/{id}",
        tags: ["Artist"],
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
                        schema: FormatOutputZodSchema(ArtistZodSchema)
                    }
                }
            }
        }
    }),
    async (c) => {
        const { id } = c.req.valid("param")

        const artist = await Artist.findOne({ _id: id })

        return c.json(artist, 200)
    }
)

app.openapi(
    createRoute({
        method: "get",
        path: "/artists/{id}/tracks",
        tags: ["Artist"],
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
                description: "Fetched tracks for an artist",
                content: {
                    "application/json": {
                        schema: z.array(FormatOutputZodSchema(TrackZodSchema.omit({ album: true, artists: true }).extend({ album: AlbumZodSchema.omit({ artists: true }), artists: z.array(ArtistZodSchema) })))
                    }
                }
            }
        }
    }),
    async (c) => {
        const { id } = c.req.valid("param")
        const { limit, skip } = c.req.valid("query")

        const tracks = await Track.find({ artists: id })
            .limit(limit || 9)
            .skip(skip || 0)
            .populate({
                path: "album",
                select: "-artists"
            })
            .populate("artists")

        return c.json(tracks, 200)
    }
)

app.openapi(
    createRoute({
        method: "get",
        path: "/artists/{id}/albums",
        tags: ["Artist"],
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
                description: "Fetched albums for an artist",
                content: {
                    "application/json": {
                        schema: z.array(FormatOutputZodSchema(AlbumZodSchema.omit({ genre: true, artists: true }).extend({ genre: GenreZodSchema, artists: z.array(ArtistZodSchema) })))
                    }
                }
            }
        }
    }),
    async (c) => {
        const { id } = c.req.valid("param")
        const { limit, skip } = c.req.valid("query")

        const albums = await Album.find({ artists: id })
            .limit(limit || 9)
            .skip(skip || 0)
            .populate("genre")
            .populate("artists")

        return c.json(albums, 200)
    }
)
