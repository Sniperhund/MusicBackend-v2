import { auth } from "@/middleware/auth"
import { Album, AlbumZodSchema } from "@/models/album.model"
import { Artist, ArtistZodSchema } from "@/models/artist.model"
import { GenreZodSchema } from "@/models/genre.model"
import { Track, TrackZodSchema } from "@/models/track.model"
import { FormatOutputZodSchema, SecurityObject } from "@/util"
import { app } from "@/util/hono"
import { createRoute, z } from "@hono/zod-openapi"
import Fuse from "fuse.js"
import { HydratedDocument } from "mongoose"

app.openapi(
    createRoute({
        method: "get",
        path: "/search",
        tags: ["Search"],
        ...SecurityObject,
        request: {
            query: z.object({
                q: z.string(),
                type: z
                    .enum(["track", "album", "artist", "default"])
                    .describe("Default includes all")
                    .default("default"),
                limit: z.coerce.number().min(1).default(9),
            }),
        },
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched searched query",
                content: {
                    "application/json": {
                        schema: z.object({
                            tracks: z.array(
                                FormatOutputZodSchema(TrackZodSchema)
                                    .omit({ album: true, artists: true })
                                    .extend({
                                        album: AlbumZodSchema,
                                        artists: z.array(ArtistZodSchema),
                                        durationInSeconds: z.number(),
                                    }),
                            ),
                            albums: z.array(
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
                            artists: z.array(
                                FormatOutputZodSchema(ArtistZodSchema),
                            ),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { q, type, limit } = c.req.valid("query")

        let results: { tracks: any[]; albums: any[]; artists: any[] } = {
            tracks: [],
            albums: [],
            artists: [],
        }

        if (type === "track" || type === "default") {
            const rawTracks = await Track.find({})
                .populate(["album", "artists"])
                .lean()

            const fuse = new Fuse(rawTracks, {
                keys: ["name", "lyrics.text"],
                threshold: 0.3,
                distance: 100,
                ignoreLocation: true,
            })

            results.tracks = fuse
                .search(q)
                .slice(0, limit)
                .map((r) => r.item)
        }

        if (type === "album" || type === "default") {
            const rawAlbums = await Album.find({})
                .populate(["artists", "genre"])
                .lean()

            const fuse = new Fuse(rawAlbums, {
                keys: ["name"],
                threshold: 0.3,
                distance: 100,
                ignoreLocation: true,
            })

            results.albums = fuse
                .search(q)
                .slice(0, limit)
                .map((r) => r.item)
        }

        if (type === "artist" || type === "default") {
            const rawArtists = await Artist.find({}).lean()

            const fuse = new Fuse(rawArtists, {
                keys: ["name"],
                threshold: 0.3,
                distance: 100,
                ignoreLocation: true,
            })

            results.artists = fuse
                .search(q)
                .slice(0, limit)
                .map((r) => r.item)
        }

        results = {
            tracks: results.tracks.slice(0, Math.ceil(limit / 3)),
            albums: results.albums.slice(0, Math.floor(limit / 3)),
            artists: results.artists.slice(0, Math.floor(limit / 3)),
        }

        return c.json(results)
    },
)
