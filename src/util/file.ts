import * as fsPath from "path"
import { rm } from "fs/promises"

if (!process.env.UPLOAD_DIR)
    throw new Error("Environment variable UPLOAD_DIR not found")

const uploadDir = process.env.UPLOAD_DIR

const calculatePath = async (filePath: string): Promise<string | undefined> => {
    try {
        const combinedPath = fsPath.join(uploadDir, filePath)

        if (!combinedPath.startsWith(uploadDir)) return undefined

        return combinedPath
    } catch {
        return undefined
    }
}

export const processAudioFile = async (filePath: string) => {
    if (!filePath) throw new Error("filePath is undefined")
}

export const saveFile = async (filePath: string, file: Blob) => {
    if (!file) throw new Error("file is undefined")

    const path = await calculatePath(filePath)

    if (!path) throw new Error("filePath is invalid")

    await Bun.write(path, file, { createPath: true })
}

export const cleanFile = async (filePath: string) => {
    if (!filePath) throw new Error("filePath is undefined")

    const path = await calculatePath(filePath)

    if (!path) throw new Error("filePath is invalid")

    try {
        await rm(path, { recursive: true })
    } catch(error: any) {
        if (error.code === "ENOENT") {
            console.error("File or directory doesn't exist")
        } else {
            throw error
        }
    }
}
