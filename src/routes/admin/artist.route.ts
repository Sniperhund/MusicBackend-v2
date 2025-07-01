import { adminAuth } from "@/middleware/auth"
import { Album } from "@/models/album.model"
import { Artist, ArtistZodSchema } from "@/models/artist.model"
import { Track } from "@/models/track.model"
import { findDependents, FormatOutputZodSchema, SecurityObject, ZodForceDeletion, ZodMongooseId } from "@/util"
import { cleanFileOrDirectory, saveFile } from "@/util/file"
import { app } from "@/util/hono"
import { DependentsError, StdError } from "@/util/responses"
import { createRoute, z } from "@hono/zod-openapi"

app.openapi(
    createRoute({
        method: "post",
        path: "/admin/artist",
        tags: ["Admin"],
        ...SecurityObject,
        request: {
            body: {
                content: {
                    "multipart/form-data": {
                        schema: ArtistZodSchema
                    }
                }
            }
        },
        middleware: [adminAuth] as const,
        responses: {
            201: {
                description: "Artist created",
                content: {
                    "application/json": {
                        schema: FormatOutputZodSchema(ArtistZodSchema)
                    }
                }
            },
            400: StdError("Artist creation failed")
        },
    }),
    async (c) => {
        const { name, file } = c.req.valid("form")

        if (!file.type.includes("image/"))
            return c.json({ message: "Only image files are accepted" }, 400)

        const filePath = `artists/${crypto.randomUUID()}.${file.name.split(".")[1]}`

        await saveFile(filePath, file)

        const artist = await Artist.create({
            name,
            file: filePath
        })

        return c.json(artist, 201)
    }
)

app.openapi(
    createRoute({
        method: "patch",
        path: "/admin/artist",
        tags: ["Admin"],
        ...SecurityObject,
        request: {
            query: z.object({
                id: ZodMongooseId
            }),
            body: {
                content: {
                    "multipart/form-data": {
                        schema: ArtistZodSchema.partial()
                    }
                }
            }
        },
        middleware: [adminAuth] as const,
        responses: {
            200: {
                description: "Artist updated",
                content: {
                    "application/json": {
                        schema: FormatOutputZodSchema(ArtistZodSchema)
                    }
                }
            },
            400: StdError("Track update failed")
        }
    }),
    async (c) => {
        const { name, file } = c.req.valid("form")
        const { id } = c.req.valid("query")

        if (file && !file.type.includes("image/"))
            return c.json({ message: "Only image files are accepted" }, 400)

        const artist = await Artist.findById(id)

        if (!artist)
            return c.json({}, 404)

        if (file) {
            cleanFileOrDirectory(artist.file)

            const filePath = `artists/${crypto.randomUUID()}.${file.name.split(".")[1]}`

            await saveFile(filePath, file)

            artist.file = filePath
        }

        if (name) artist.name = name

        await artist.save()

        return c.json(artist, 200)
    }
)

app.openapi(
    createRoute({
        method: "delete",
        path: "/admin/artist",
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
                description: "Artist deleted"
            },
            409: DependentsError("Artist")
        }
    }),
    async (c) => {
        const { id, force } = c.req.valid("query")

        const artist = await Artist.findById(id)

        if (!artist) {
            return c.json({ message: "Artist not found" }, 404)
        }

        let dependents = await findDependents(Track, "artists", artist._id)

        if (force) {
            await Promise.all(dependents.map(dep => Track.findByIdAndDelete(dep._id)))
        } else if (dependents.length) {
            return c.json({
                message: "Artist has one or more dependents",
                dependentType: "Track",
                dependents
            }, 409)
        }

        dependents = await findDependents(Album, "artists", artist._id)

        if (force) {
            await Promise.all(dependents.map(dep => Album.findByIdAndDelete(dep._id)))
        } else if (dependents.length) {
            return c.json({
                message: "Artist has one or more dependents",
                dependentType: "Artist",
                dependents
            }, 409)
        }

        await Artist.findByIdAndDelete(id)

        cleanFileOrDirectory(artist.file)

        return c.json({}, 200)
    }
)
