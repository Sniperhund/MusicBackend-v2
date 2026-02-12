import { adminAuth } from "@/middleware/auth"
import { Track, TrackZodSchema } from "@/models/track.model"
import { FormatOutputZodSchema, SecurityObject, ZodMongooseId } from "@/util"
import {
    cleanFileOrDirectory,
    getAudioDuration,
    processAudioFile,
    saveFile,
} from "@/util/file"
import { app } from "@/util/hono"
import { StdError } from "@/util/responses"
import { createRoute, z } from "@hono/zod-openapi"
import { Types } from "mongoose"
import * as fsPath from "path"

app.openapi(
    createRoute({
        method: "post",
        path: "/admin/track",
        tags: ["Admin"],
        ...SecurityObject,
        request: {
            body: {
                content: {
                    "multipart/form-data": {
                        schema: TrackZodSchema,
                    },
                },
            },
        },
        middleware: [adminAuth] as const,
        responses: {
            201: {
                description: "Track created",
                content: {
                    "application/json": {
                        schema: FormatOutputZodSchema(TrackZodSchema)
                            .omit({ file: true })
                            .extend({ fileDir: z.string() }),
                    },
                },
            },
            400: StdError("Track creation failed"),
        },
    }),
    async (c) => {
        const { name, album, artists, file, lyrics } = c.req.valid("form")

        if (!file.type.includes("audio/"))
            return c.json({ message: "Only audio files are accepted" }, 400)

        const filePath = `tracks/${crypto.randomUUID()}/original`
        const fileInfo = fsPath.parse(filePath)

        try {
            console.log("Processing audio")
            await saveFile(filePath, file)
            const duration = await getAudioDuration(filePath)
            processAudioFile(filePath)

            const track = new Track({
                name,
                album,
                artists,
                fileDir: fileInfo.dir,
                durationInSeconds: Math.round(duration),
                lyrics: lyrics || undefined,
            })

            await track.save()

            return c.json(track, 201)
        } catch (e) {
            cleanFileOrDirectory(fileInfo.dir)

            console.log(e)

            return c.status(500)
        }
    },
)

app.openapi(
    createRoute({
        method: "patch",
        path: "/admin/track",
        tags: ["Admin"],
        ...SecurityObject,
        request: {
            query: z.object({
                id: ZodMongooseId,
            }),
            body: {
                content: {
                    "multipart/form-data": {
                        schema: TrackZodSchema.partial(),
                    },
                },
            },
        },
        middleware: [adminAuth] as const,
        responses: {
            200: {
                description: "Track changed",
                content: {
                    "application/json": {
                        schema: FormatOutputZodSchema(TrackZodSchema)
                            .omit({ file: true })
                            .extend({ fileDir: z.string() }),
                    },
                },
            },
            400: StdError("Track change failed"),
        },
    }),
    async (c) => {
        const { name, album, artists, file, lyrics } = c.req.valid("form")
        const { id } = c.req.valid("query")

        if (file && !file.type.includes("audio/"))
            return c.json({ message: "Only audio files are accepted" }, 400)

        const track = await Track.findById(id)

        if (!track) return c.json({}, 404)

        if (file) {
            cleanFileOrDirectory(track.fileDir)

            const filePath = `tracks/${crypto.randomUUID()}/original.${
                file.name.split(".")[1]
            }`

            await saveFile(filePath, file)
            const duration = await getAudioDuration(filePath)
            processAudioFile(filePath)

            const fileInfo = fsPath.parse(filePath)

            track.fileDir = fileInfo.dir
            track.durationInSeconds = Math.round(duration)
        }

        if (name) track.name = name
        if (album) track.album = new Types.ObjectId(album)
        if (artists) {
            const artistIds = artists.map((id) => new Types.ObjectId(id))

            track.artists = artistIds
        }
        if (lyrics && typeof lyrics == "string")
            track.lyrics = JSON.parse(lyrics)
        else if (lyrics && typeof lyrics != "string") track.lyrics = lyrics

        await track.save()

        return c.json(track, 200)
    },
)

app.openapi(
    createRoute({
        method: "delete",
        path: "/admin/track",
        tags: ["Admin"],
        ...SecurityObject,
        request: {
            query: z.object({
                id: ZodMongooseId,
            }),
        },
        middleware: [adminAuth] as const,
        responses: {
            200: {
                description: "Track deleted",
            },
        },
    }),
    async (c) => {
        const { id } = c.req.valid("query")

        const track = await Track.findByIdAndDelete(id)

        if (!track) {
            return c.json({}, 404)
        }

        cleanFileOrDirectory(track.fileDir)

        return c.json({}, 200)
    },
)
