import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Repo root (this file lives at project root). Stops Turbopack from mis-detecting `app/` as the workspace root. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  logging: {
    browserToTerminal: true,
  },
}

export default nextConfig
