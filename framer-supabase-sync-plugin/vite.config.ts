import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import framer from "vite-plugin-framer"
import fs from "fs"
import path from "path"
import { homedir } from "os"

const certPath = path.join(homedir(), ".vite-plugin-mkcert")

export default defineConfig({
    plugins: [react(), framer()],
    server: {
        https: {
            key: fs.readFileSync(path.join(certPath, "dev.pem")),
            cert: fs.readFileSync(path.join(certPath, "cert.pem"))
        }
    }
})
