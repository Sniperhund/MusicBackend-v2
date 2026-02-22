import { auth } from "@/middleware/auth"
import { Album, AlbumZodSchema } from "@/models/album.model"
import { Artist, ArtistZodSchema } from "@/models/artist.model"
import { Genre, GenreZodSchema } from "@/models/genre.model"
import { Track, TrackZodSchema } from "@/models/track.model"
import { FormatOutputZodSchema, SecurityObject } from "@/util"
import { app } from "@/util/hono"
import { createRoute, z } from "@hono/zod-openapi"

app.openapi(
    createRoute({
        method: "get",
        path: "/all/albums",
        tags: ["All"],
        ...SecurityObject,
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched all albums",
                content: {
                    "application/json": {
                        schema: z.array(
                            FormatOutputZodSchema(
                                AlbumZodSchema.omit({
                                    artists: true,
                                    genre: true,
                                }).extend({
                                    artists: z.array(ArtistZodSchema),
                                    genre: GenreZodSchema,
                                }),
                            ),
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const albums = await Album.find({})
            .populate("artists")
            .populate("genre")

        return c.json(albums, 200)
    },
)

app.openapi(
    createRoute({
        method: "get",
        path: "/all/tracks",
        tags: ["All"],
        ...SecurityObject,
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched all tracks",
                content: {
                    "application/json": {
                        schema: z.array(
                            FormatOutputZodSchema(TrackZodSchema)
                                .omit({ album: true, artists: true })
                                .extend({
                                    album: AlbumZodSchema,
                                    artists: z.array(ArtistZodSchema),
                                    durationInSeconds: z.number(),
                                }),
                        ),
                    },
                },
            },
        },
    }),
    async (c) => {
        const tracks = await Track.find({})
            .populate({
                path: "album",
                select: "-artists",
                populate: {
                    path: "genre",
                },
            })
            .populate("artists")

        return c.json(tracks, 200)
    },
)

app.openapi(
    createRoute({
        method: "get",
        path: "/all/genres",
        tags: ["All"],
        ...SecurityObject,
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched all genres",
                content: {
                    "application/json": {
                        schema: z.array(FormatOutputZodSchema(GenreZodSchema)),
                    },
                },
            },
        },
    }),
    async (c) => {
        const genres = await Genre.find({})

        return c.json(genres, 200)
    },
)

app.openapi(
    createRoute({
        method: "get",
        path: "/all/artists",
        tags: ["All"],
        ...SecurityObject,
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched all artists",
                content: {
                    "application/json": {
                        schema: z.array(FormatOutputZodSchema(ArtistZodSchema)),
                    },
                },
            },
        },
    }),
    async (c) => {
        const artists = await Artist.find({})

        return c.json(artists, 200)
    },
)
