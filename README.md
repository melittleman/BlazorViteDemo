# BlazorViteDemo
> An example .NET 8 Blazor Web project working with Vite build tooling

## Getting Started
The .NET workflow with [Vite](https://vitejs.dev/) is outstanding. It provides a much more modern and faster development experience than when using Webpack. 
If you're interested in how to set up a new .NET project with Blazor and Vite, please follow the steps below and use this repository as a reference.

### Install NPM Packages
1. Run `npm init -y` to scaffold the default `package.json` at the root of the Web project.
2. `npm install vite --save-dev`
3. `npm install vite-plugin-mkcert --save-dev`
4. `npm install sass@npm:sass-embedded@latest --save-dev`
     > Note that this is currently using an NPM alias for 'sass', but Vite intends to support the 'sass-embedded' package directly in the future as it is much faster. 
     > See: https://github.com/vitejs/vite/issues/6734
5. `npm install bootstrap --save`

### Install .NET Packages
* Run `dotnet add package Vite.AspNetCore` at the root of the Web project.

### Creating Vite Config
1. Using your desired text editor _(hint: you can use `code .` to open VS Code at the current directory)_, open the directory and create a `vite.config.js` file at the root of the Web project.
2. Save the following configuration into this newly created file:

    ```javascript
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
    ```

3. Add the following 'Vite' section to the `appsettings.Development.json` file, so that it looks like the below:

    ```json
    {
        "Logging": {
            "LogLevel": {
            "Default": "Information",
            "Microsoft.AspNetCore": "Warning"
            }
        },
        "Vite": {
            "Server": {
            "Enabled": true,
            "Port": 5173,
            "Https": true,
            "AutoRun": true
            }
        }
    }
    ```

4. Create a new directory at the project root called 'Client' e.g. `mkdir Client`.
5. Inside there, create 3 more directories to be used as input for the Vite build: `public`, `scripts` and `styles`.
6. Lastly create an `app.js` file inside of `Client/scripts/` and an `app.scss` file inside of `Client/styles/` to be used for the Javascript and CSS respectively. _Note that the 'public' directory will be used for static assets such as the favicon that need to be copied to the output with no compilation or build process applied_.

### Using Vite With .NET
We already installed the `Vite.AspNetCore` package earlier which does most of the heavy lifting, but there is a final piece of configuration needed for everything to work.

1. Add the following NPM scripts to the `package.json` file:

    ```json
    "start": "echo Starting the development server && vite",
    "dev": "vite",
    "build": "vite build --mode development",
    "publish": "vite build --mode production"
    ```

2. Open the `wwwroot` directory and copy the contents of `app.css` into our new `app.scss` file. 
3. Delete the default bootstrap folder and add the line `@import "bootstrap/scss/bootstrap";` to the top of `app.scss`.
3. Copy the `favicon.png` to the `Client/public/` directory.
4. Add the following to the top of the `Program.cs` file:

    ```csharp
    using Vite.AspNetCore;

    //...omitted for brevity

    // Add the Vite manifest integration.
    builder.Services.AddViteServices();
    ```

5. Add the following to the bottom of the `Program.cs` file:

    ```csharp
    if (app.Environment.IsDevelopment())
    {
        if (bool.Parse(builder.Configuration["Vite:Server:Enabled"] ?? string.Empty)) 
        {
            // Proxies requests for css and js to 
            // the Vite development server for HMR.
            app.UseViteDevelopmentServer(true);
        }
    }
    ```

5. Finally, update the `App.razor` component to use the new script and style assets provided via Vite by placing the following within the `<head>` tags:

    ```csharp
    @using Vite.AspNetCore

    @inject IWebHostEnvironment env
    @inject IViteManifest manifest
    @inject IViteDevServerStatus vite

    //...omitted for brevity

    @if (env.IsDevelopment() && vite.IsMiddlewareEnable)
    {
        <script type="module" src="@@vite/client"></script>
        <script type="module" src="scripts/app.js" defer></script>

        /** Note that this .scss is correct as it's purely acting as a 'key' 
        to the real css file being held in the Vite server memory. **/
        <link rel="stylesheet" href="styles/app.scss" />
    }
    else 
    {
        IViteChunk? js = manifest["scripts/app.js"];
        if (js is not null) 
        {
            <script type="module" src="@js.File" defer></script>

            if (js.Imports is not null) 
            {
                foreach (string import in js.Imports) 
                {
                    if (manifest.ContainsKey(import) is false) continue;

                    <script type="module" src="@manifest[import]!.File" defer></script>
                }
            }
        }

        IViteChunk? css = manifest["styles/app.scss"];
        if (css is not null)
        {
            <link rel="stylesheet" href="@css.File" />
        }
    }
    ```

6. Test by running `npm run build` to ensure that Vite successfully built and output the js and css files into the `wwwroot` directory.
7. You can now run `dotnet watch run` to run the application and see the Hot Reload in action after making a change to the scripts or styles.
