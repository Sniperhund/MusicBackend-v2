import { createMiddleware } from "hono/factory"
import { Session } from "@/models/user.model"

export const auth = createMiddleware(async (c, next) => {
    if (!c.req.header("Authorization")?.startsWith("Bearer "))
        return c.json({ message: "Unauthorized" }, 401)

    const session = await Session.findOne({
        token: c.req.header("Authorization")?.replace("Bearer ", "")
    }).populate("userId")

    // @ts-ignore verified does exist, as we populate userId above
    if (!session || !session.userId.verified) return c.json({ message: "Unauthorized" }, 401)

    c.set("user", session.userId)

    await next()
})

export const adminAuth = createMiddleware(async (c, next) => {
    if (!c.req.header("Authorization")?.startsWith("Bearer "))
        return c.json({ message: "Unauthorized" }, 401)

    const session = await Session.findOne({
        token: c.req.header("Authorization")?.replace("Bearer ", "")
    }).populate("userId")

    // @ts-ignore role and verified does exist, as we populate userId above
    if (!session || session.userId.role != "admin" || !session.userId.verified) return c.json({ message: "Unauthorized" }, 401)

    c.set("user", session.userId)

    await next()
})
