import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { cors } from "hono/cors"
import { OpenAPIHono } from "@hono/zod-openapi"
import { swaggerUI } from "@hono/swagger-ui"
import { serveStatic } from "hono/bun"

export const app = new OpenAPIHono({
    defaultHook: (result, c) => {
        if (!result.success) {
            if (
                result.error.issues[0].code == "invalid_union" &&
                result.error.issues[0].errors[0][0].message
            ) {
                return c.json(
                    {
                        message: result.error.issues[0].errors[0][0].message,
                    },
                    400,
                )
            }

            return c.json(
                {
                    message: `${result.error.issues[0].message}`,
                },
                400,
            )
        }
    },
})

app.use(cors())
app.use(logger())
app.use(prettyJSON())
app.use(
    "/static/*",
    serveStatic({
        root: process.env.UPLOAD_DIR || "./upload",
        rewriteRequestPath: (path) => {
            return path.replace(/^\/static/, "")
        },
    }),
)

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
    openapi: "3.1.0",
})
