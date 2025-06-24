import { z } from "@hono/zod-openapi"
import mongoose from "mongoose"

export const SecurityObject = {
    security: [
        {
            Bearer: []
        }
    ]
}

export const FormatOutputZodSchema = (schema: z.ZodObject<any>) => {
    return schema.extend({
        _id: z.string()
    })
}

export const ZodMongooseId = z.coerce.string().refine(
    (val) => mongoose.isValidObjectId(val),
    {
        message: "Invalid id"
    }
)

export const ZodCommaSeparatedMongooseIds = z.coerce.string().transform(
    (val) => val.split(",").map((id) => id.trim()).filter(Boolean)
).refine((ids) => ids.every((id) => mongoose.isValidObjectId(id)), {
    message: "One or more ID(s) are invalid"
}).openapi({
    type: "array"
})
