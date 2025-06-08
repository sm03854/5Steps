import express from "express";
import { pool, executeTransaction } from "../utilities/database.js";
import { isLoggedIn, requirePermissions } from "../utilities/permissions.js";
import { getLocationFromPostcode } from "../utilities/postcodeToLocation.js";



const app = express.Router();



//#region ========== Create new masjid ==========

// Displays HTML form to enter masjid data (front-facing-api-route)
app.get("/new/", isLoggedIn, requirePermissions("Admin"), (req, res) =>
{
    return res.render("masjid/create");
});

// Register a new masjid into the database
app.post("/new/", isLoggedIn, requirePermissions("Admin"), async (req, res) =>
{	
    const { name, postcode, address, email } = req.body;
    
    try 
    {
        const location = await getLocationFromPostcode(postcode);

		await executeTransaction(async () => 
		{
            // Create new masjid trust
            const [trust] = await pool.execute(`INSERT INTO Trusts () VALUES ()`);
			const trustInsertID = trust.insertId;

            // Create new masjid statistics
            const [statistics] = await pool.execute(`INSERT INTO MasjidStatistics () VALUES ()`);
			const statisticsInsertID = statistics.insertId;
            
			// Insert new masjid into Masjids table
			await pool.execute
			(
				`INSERT INTO Masjids
				(FullName, Postcode, AddressLine, Email, Latitude, Longitude, Trust_ID, Statistics_ID)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[name, postcode, address, email, location.latitude, location.longitude, trustInsertID, statisticsInsertID]
			);
		});

		// Status code 201: Created
		return res.status(201).send(`New masjid registered successfully!`);
    } 
    catch (error)
    {
        console.error(`Error registering a new masjid: ` + error);
        return res.status(500).send(`Error registering a new masjid: ` + error);
    }
});

//#endregion



//#region ========== Get data of all masjids ==========

// Retrieves data of all masjids in the database
app.get("/", async (req, res) =>
{	
	try
	{
		const [masjids] = await pool.execute
		(
			`SELECT ID, FullName, Postcode, AddressLine, Email, Latitude, Longitude
			FROM Masjids`
		);

		return res.status(200).send(masjids);
	}
	catch (error)
	{
		console.error("Error retrieving data of all masjids in the database: " + error);
		return res.status(500).send("Error retrieving data of all masjids in the database: " + error);
	}
});

//#endregion



//#region ========== Get data of masjid by ID ==========

// Retrieves full data of masjid with 'id'
app.get("/:id/", async (req, res) =>
{	
	const { id } = req.params;

	try
	{
		const [masjids] = await pool.execute
		(
			`SELECT ID, FullName, Postcode, AddressLine, Email, Latitude, Longitude
			FROM Masjids
            WHERE ID = ?`,
            [id]
		);

		if (masjids.length == 0)
		{
			return res.status(404).send("No masjid exists with id: " + id);
		}
	
		return res.status(200).send(masjids[0]);
	}
	catch (error)
	{
		console.error(`Error retrieving data of masjid ${id}: ` + error);
		return res.status(500).send(`Error retrieving data of masjid ${id}: ` + error);
	}
});

//#endregion



//#region ========== Edit masjid ==========

// Displays HTML form to update trustee user data (front-facing-api-route)
app.get("/:id/edit/", isLoggedIn, requirePermissions("Admin"), async (req, res) =>
{	
	const { id } = req.params;

	try
	{
		const [masjids] = await pool.execute("SELECT * FROM Masjids WHERE ID = ?", [id]);

		if (masjids.length == 0)
		{
			return res.status(404).send("No masjid exists with id: " + id);
		}

		const masjid = masjids[0];
	
		return res.render("masjid/edit",
		{
			id: id,
			name: masjid.FullName,
			postcode: masjid.Postcode,
			address: masjid.AddressLine,
			email: masjid.Email
		});
	}
	catch (error)
	{
		console.error("Error retrieving data of masjid: " + error);
		return res.status(500).send("Error retrieving data of masjid: " + error);
	}
});

// Updates user data
app.post("/:id/edit/", isLoggedIn, requirePermissions("Admin"), async (req, res) =>
{	
	const { id } = req.params;

    const { name, postcode, address, email } = req.body;

	try
	{
        const location = await getLocationFromPostcode(postcode);

		await executeTransaction(async () => 
		{
			await pool.execute
			(
				`UPDATE Masjids SET
				FullName = ?,
				Postcode = ?,
				AddressLine = ?,
				Email = ?,
				Latitude = ?,
				Longitude = ?
				WHERE ID = ?`,
				[name, postcode, address, email, location.latitude, location.longitude, id]
			);
		});

		return res.status(200).send("Masjid data updated successfully!");
	}
	catch (error)
	{
		console.error("Error updating masjid data: " + error);
		return res.status(500).send("Error updating masjid data: " + error);
	}
});

//#endregion



//#region ========== Search masjids by name ==========

// Retrieves all masjids with similar names to 'name' parameter
app.get("/search", async (req, res) =>
{	
    const { name } = req.query;

    if (!name || name.length < 1) 
    {
        return res.status(400).json({ error: 'Missing or invalid query parameter: name' });
    }

    try 
    {
        const [rows] = await pool.execute
        (
            `SELECT ID, FullName
            FROM Masjids
            WHERE FullName LIKE ?
            ORDER BY
                CASE
                WHEN FullName LIKE ? THEN 1
                WHEN FullName LIKE ? THEN 2
                ELSE 3
                END
            LIMIT 10
            `,
            [
                `%${name}%`,
                `${name}%`,     // Starts with input
                `%${name}`      // Ends with input
            ]
        );

        return res.status(200).send(rows);
    } 
    catch (err) 
    {
        console.error(`Error searching for masjid with name ${name}:`, err);
        res.status(500).send(`Error searching for masjid with name ${name}:`, err);
    }
});

//#endregion



export default app;