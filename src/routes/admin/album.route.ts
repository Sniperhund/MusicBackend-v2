import { adminAuth } from "@/middleware/auth"
import { Album, AlbumZodSchema } from "@/models/album.model"
import { Track } from "@/models/track.model"
import { findDependents, FormatOutputZodSchema, SecurityObject, ZodForceDeletion, ZodMongooseId } from "@/util"
import { cleanFileOrDirectory, saveFile } from "@/util/file"
import { app } from "@/util/hono"
import { DependentsError, StdError } from "@/util/responses"
import { createRoute, z } from "@hono/zod-openapi"
import { Types } from "mongoose"

app.openapi(
    createRoute({
        method: "post",
        path: "/admin/album",
        tags: ["Admin"],
        ...SecurityObject,
        request: {
            body: {
                content: {
                    "multipart/form-data": {
                        schema: AlbumZodSchema
                    }
                }
            }
        },
        middleware: [adminAuth] as const,
        responses: {
            201: {
                description: "Album created",
                content: {
                    "application/json": {
                        schema: FormatOutputZodSchema(AlbumZodSchema)
                    }
                }
            },
            400: StdError("Album creation failed")
        }
    }),
    async (c) => {
        const { name, artists, file, genre } = c.req.valid("form")

        if (!file.type.includes("image/"))
            return c.json({ message: "Only image files are accepted" }, 400)

        const filePath = `album/${crypto.randomUUID()}.${file.name.split(".")[1]}`

        await saveFile(filePath, file)

        const album = await Album.create({
            name,
            artists,
            file: filePath,
            genre
        })

        return c.json(album, 201)
    }
)

app.openapi(
    createRoute({
        method: "patch",
        path: "/admin/album",
        tags: ["Admin"],
        ...SecurityObject,
        request: {
            query: z.object({
                id: ZodMongooseId
            }),
            body: {
                content: {
                    "multipart/form-data": {
                        schema: AlbumZodSchema.partial()
                    }
                }
            },

        },
        middleware: [adminAuth] as const,
        responses: {
            200: {
                description: "Album updated",
                content: {
                    "application/json": {
                        schema: FormatOutputZodSchema(AlbumZodSchema)
                    }
                }
            },
            400: StdError("Album update failed")
        }
    }),
    async (c) => {
        const { name, artists, file, genre } = c.req.valid("form")
        const { id } = c.req.valid("query")

        if (file && !file.type.includes("image/"))
            return c.json({ message: "Only image files are accepted" }, 400)

        const album = await Album.findById(id)

        if (!album)
            return c.json({}, 404)

        if (file) {
            cleanFileOrDirectory(album.file)

            const filePath = `album/${crypto.randomUUID()}.${file.name.split(".")[1]}`

            await saveFile(filePath, file)

            album.file = filePath
        }

        if (name) album.name = name
        if (artists) {
            const artistIds = artists.map(id => new Types.ObjectId(id))

            album.artists = artistIds
        }
        if (genre) album.genre = new Types.ObjectId(genre)

        await album.save()

        return c.json(album, 200)
    }
)


app.openapi(
    createRoute({
        method: "delete",
        path: "/admin/album",
        tags: ["Admin"],
        ...SecurityObject,
        request: {
            query: z.object({
                id: ZodMongooseId,
                force: ZodForceDeletion
            })
        },
        middleware: [adminAuth] as const,
        responses: {
            200: {
                description: "Album delete"
            },
            409: DependentsError("Album")
        }
    }),
    async (c) => {
        const { id, force } = c.req.valid("query")

        const album = await Album.findById(id)

        if (!album) {
            return c.json({ message: "Album not found" }, 404)
        }

        const dependents = await findDependents(Track, "album", album._id)

        if (force) {
            await Promise.all(dependents.map(dep => Track.findByIdAndDelete(dep._id)))
        } else if (dependents.length) {
            return c.json({
                message: "Album has one or more dependents",
                dependentType: "Track",
                dependents
            }, 409)
        }

        await Album.findByIdAndDelete(id)

        cleanFileOrDirectory(album.file)

        return c.json({}, 200)
    }
)
