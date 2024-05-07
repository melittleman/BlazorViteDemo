import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import path from "path";

import { Vite } from "./appsettings.Development.json";

export default defineConfig({
    appType: "custom",
    root: "Client",
    plugins: [ mkcert() ],
    resolve: {
        alias: { "~": __dirname }
    },
    build: {
        manifest: true,
        emptyOutDir: true,
        outDir: path.join(__dirname, "wwwroot"),
        assetsDir: "",
        rollupOptions: {
            input: [ 
                path.join(__dirname, "Client", "scripts", "app.js"), 
                path.join(__dirname, "Client", "styles", "app.scss")
            ],
            output: {
                entryFileNames: "js/[name]-[hash].bundle.min.js",
                chunkFileNames: "js/[name]-[hash].chunk.min.js",
                assetFileNames: (info) => {
                    if (info.name) {

                        // If the file is a CSS file, save it to the "css" folder
                        if (/\.css$/.test(info.name)) {
                            return "css/[name]-[hash].bundle.min.[ext]";
                        }

                        // If the file is an image file, save it to the "img" folder
                        if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(info.name)) {
                            return "img/[name][extname]";
                        }

                        // If the file is any other type of file, save it to the "assets" folder 
                        return "assets/[name][extname]";
                    } else {

                        // If the file name is not specified, save it to the output directory
                        return "[name][extname]";
                    }
                },
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        return 'lib';
                    }
                }
            }
        }
    },
    server: {
        port: Vite.Server.Port,
        strictPort: true,
        hmr: {
            host: "localhost",
            clientPort: Vite.Server.Port
        }
    }
});