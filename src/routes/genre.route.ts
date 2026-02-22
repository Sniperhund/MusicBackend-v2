import { auth } from "@/middleware/auth"
import { Album, AlbumZodSchema } from "@/models/album.model"
import { Genre, GenreZodSchema } from "@/models/genre.model"
import { Track, TrackZodSchema } from "@/models/track.model"
import { FormatOutputZodSchema, SecurityObject, ZodMongooseId } from "@/util"
import { app } from "@/util/hono"
import { createRoute, z } from "@hono/zod-openapi"
import mongoose, { PipelineStage } from "mongoose"

app.openapi(
    createRoute({
        method: "get",
        path: "/genres/random",
        tags: ["Genre"],
        ...SecurityObject,
        request: {
            query: z.object({
                limit: z.coerce.number().min(1).default(10).optional(),
            }),
        },
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched random genres",
                content: {
                    "application/json": {
                        schema: z.array(FormatOutputZodSchema(GenreZodSchema)),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { limit } = c.req.valid("query")

        const genres = await Genre.aggregate([
            { $sample: { size: limit || 10 } },
        ])

        return c.json(genres, 200)
    },
)

app.openapi(
    createRoute({
        method: "get",
        path: "/genres/albums/{id}",
        description: "Get random albums from the same genre",
        tags: ["Genre"],
        ...SecurityObject,
        request: {
            params: z.object({
                id: ZodMongooseId,
            }),
            query: z.object({
                limit: z.coerce.number().min(1).default(10).optional(),
            }),
        },
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched random albums from a genre",
                content: {
                    "application/json": {
                        schema: z.array(
                            FormatOutputZodSchema(
                                AlbumZodSchema.omit({ genre: true }),
                            ),
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { id } = c.req.valid("param")
        const { limit } = c.req.valid("query")

        const pipeline: PipelineStage[] = [
            {
                $match: { genre: new mongoose.Types.ObjectId(id) },
            },
            {
                $sample: { size: limit || 10 },
            },
            {
                $lookup: {
                    from: "artists",
                    localField: "artists",
                    foreignField: "_id",
                    as: "artists",
                },
            },
            { $unset: "genre" },
        ]

        const albums = await Album.aggregate(pipeline)

        return c.json(albums, 200)
    },
)

app.openapi(
    createRoute({
        method: "get",
        path: "/genres/tracks/{id}",
        description: "Get random tracks from the same genre",
        tags: ["Genre"],
        ...SecurityObject,
        request: {
            params: z.object({
                id: ZodMongooseId,
            }),
            query: z.object({
                limit: z.coerce.number().min(1).default(10).optional(),
            }),
        },
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched random tracks from a genre",
                content: {
                    "application/json": {
                        schema: z.array(
                            FormatOutputZodSchema(
                                TrackZodSchema.extend({
                                    durationInSeconds: z.number(),
                                }),
                            ),
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { id } = c.req.valid("param")
        const { limit } = c.req.valid("query")

        const pipeline: PipelineStage[] = [
            {
                $lookup: {
                    from: "albums",
                    localField: "album",
                    foreignField: "_id",
                    as: "album",
                },
            },
            { $unwind: "$album" },
            {
                $lookup: {
                    from: "artists",
                    localField: "artists",
                    foreignField: "_id",
                    as: "artists",
                },
            },
            { $match: { "album.genre": new mongoose.Types.ObjectId(id) } },
            { $sample: { size: limit || 10 } },
            { $unset: "album.artists" },
        ]

        const tracks = await Track.aggregate(pipeline)

        return c.json(tracks, 200)
    },
)
