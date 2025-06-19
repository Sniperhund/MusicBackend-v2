import { Session, sessionTTL, User, UserZodSchema } from "@/models/user.model"
import { app } from "@/util/hono"
import { StdError } from "@/util/responses"
import { createRoute, z } from "@hono/zod-openapi"

app.openapi(
    createRoute({
        method: "post",
        path: "/auth/register",
        tags: ["Auth"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: UserZodSchema
                    }
                }
            }
        },
        responses: {
            201: {
                description: "User regisration successful",
                content: {
                    "application/json": {
                        schema: z.object({
                            refreshToken: z.string()
                        })
                    }
                }
            },
            400: StdError("User regisration failed")
        }
    }),
    async (c) => {
        const body = await c.req.json()

        let user = await User.findOne({
            email: body.email
        })

        if (user) {
            return c.json({ message: "The email is already in use" }, 400)
        }

        const hashedPassword = Bun.password.hashSync(body.password)

        user = new User({
            name: body.name,
            email: body.email,
            passwordHash: hashedPassword
        })

        await user.save()

        return c.json({
            refreshToken: user.refreshToken
        }, 201)
    }
)

app.openapi(
    createRoute({
        method: "post",
        path: "/auth/signin",
        tags: ["Auth"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: UserZodSchema.omit({ name: true })
                    }
                }
            }
        },
        responses: {
            200: {
                description: "User signin successful",
                content: {
                    "application/json": {
                        schema: z.object({
                            refreshToken: z.string()
                        })
                    }
                }
            },
            400: StdError("User signin failed")
        }
    }),
    async (c) => {
        const { email, password } = await c.req.json()

        const user = await User.findOne({
            email
        }).select("+refreshToken +passwordHash")

        if (!user || !Bun.password.verifySync(password, user.passwordHash)) {
            return c.json({ message: "The email or password is wrong" }, 400)
        }

        return c.json({
            refreshToken: user.refreshToken
        }, 200)
    }
)

app.openapi(
    createRoute({
        method: "post",
        path: "/auth/session",
        tags: ["Auth"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            refreshToken: z.string()
                        })
                    }
                }
            }
        },
        responses: {
            201: {
                description: "Created new session",
                content: {
                    "application/json": {
                        schema: z.object({
                            sessionToken: z.string(),
                            expireAt: z.string()
                        })
                    }
                }
            },
            401: StdError("Session creation failed")
        }
    }),
    async (c) => {
        const { refreshToken } = await c.req.json()

        const user = await User.findOne({
            refreshToken
        })

        if (!user) return c.json({ message: "Invalid refresh token" }, 401)

        const session = new Session({
            userId: user._id
        })

        await session.save()

        return c.json({
            sessionToken: session.token,
            expireAt: new Date(session.createdAt.getTime() + sessionTTL)
        }, 201)
    }
)
