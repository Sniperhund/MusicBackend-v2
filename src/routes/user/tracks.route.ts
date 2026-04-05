import { auth } from "@/middleware/auth"
import { TrackZodSchema } from "@/models/track.model"
import { User, UserOutputZodSchema } from "@/models/user.model"
import { FormatOutputZodSchema, SecurityObject, ZodMongooseId } from "@/util"
import { app } from "@/util/hono"
import { StdError } from "@/util/responses"
import { createRoute, z } from "@hono/zod-openapi"
import mongoose, { ObjectId } from "mongoose"

app.openapi(
    createRoute({
        method: "get",
        path: "/user/tracks",
        tags: ["User"],
        ...SecurityObject,
        middleware: [auth] as const,
        responses: {
            200: {
                description: "Fetched user saved tracks",
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
            404: StdError("User not found"),
        },
    }),
    async (c) => {
        const user = await User.findById(c.var.user._id).populate("savedTracks")

        if (!user) return c.json({ message: "User not found" }, 404)

        return c.json(user?.savedTracks)
    },
)

app.openapi(
    createRoute({
        method: "patch",
        path: "/user/tracks",
        tags: ["User"],
        ...SecurityObject,
        middleware: [auth] as const,
        request: {
            query: z.object({
                id: ZodMongooseId,
            }),
        },
        responses: {
            200: {
                description: "Updated user saved tracks",
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
            400: StdError("Invalid id"),
            404: StdError("User not found"),
        },
    }),
    async (c) => {
        const { id } = c.req.valid("query")

        const user = await User.findById(c.var.user._id)

        if (!user) return c.json({ message: "User not found" }, 404)

        if (user.savedTracks.includes(id)) return c.json({})

        user.savedTracks.push(id as unknown as ObjectId)

        await user.save()

        return c.json({})
    },
)
