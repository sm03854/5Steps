//#region Library Imports

import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import apiEndpoints from './utilities/apiEndpoints.json' with { type: 'json' };
import { readdirSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

//#endregion



//#region Constants

const app = express();
const ip = process.env.IP;
const port = process.env.PORT;

//#endregion



//#region Express App Initialisation

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(
{
	origin: `http://${ip}:${process.env.FRONTEND_PORT}`, // frontend origin
	credentials: true, // allow cookies
}));
app.use(cookieParser());

//#endregion



//#region API Routes Initialisation

const __dirname = fileURLToPath(new URL('.', import.meta.url)); // finds 'src' folder
const routesPath = resolve(__dirname, 'routes'); // finds 'src/routes' folder

// import all modules from 'src/routes' and add them as routers to the main app
// name of file in 'src/routes' will be the root of the router.
// e.g. root of all GET/POST routes in 'src/routes/auth.js' --> '/api/auth'
readdirSync(routesPath).forEach(async (file) => 
{
	const { default: route } = await import(join(routesPath, file)); // imports the 'default' export from the imported module (the 'app')
	const routeName = '/' + file.replace('.js', ''); // remove file extension from route
	const apiRoute = `/api${routeName}`;

	app.use(apiRoute, route);
});

//#endregion



//#region API Endpoints

// Lists API endpoints
app.get("/api/", (req, res) =>
{
	return res.status(200).send(apiEndpoints);
});

//#endregion



//#region Server Connection

app.listen(port, "0.0.0.0", () => console.log(`Backend node server listening on http://${ip}:${port}`));

//#endregion