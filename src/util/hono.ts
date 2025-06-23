import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { cors } from "hono/cors"
import { OpenAPIHono } from "@hono/zod-openapi"
import { swaggerUI } from "@hono/swagger-ui"

export const app = new OpenAPIHono({
    defaultHook: (result, c) => {
        if (!result.success) {
            return c.json({
                message: result.error.issues[0].message
            }, 400)
        }
    }
})

app.use(cors())
app.use(logger())
app.use(prettyJSON())

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
})

app.get("/docs", swaggerUI({ url: "/schema" }))

app.doc("/schema", {
    info: {
        title: "MusicBackend",
        version: "v2",
    },
    openapi: "3.1.0"
})
