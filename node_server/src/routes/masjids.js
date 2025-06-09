import express from "express";
import { pool, executeTransaction } from "../utilities/database.js";
import { isLoggedIn, requirePermissions } from "../utilities/permissions.js";
import { getLocationFromPostcode } from "../utilities/postcodeToLocation.js";



const app = express.Router();



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
            `SELECT ID, FullName, AddressLine
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



//#region ========== Get data of all members in masjid by ID ==========

// Retrieves data of all members of a masjid by ID in the database
app.get("/:id/members", async (req, res) =>
{	
	const { id } = req.params;

	try
	{
		const [masjids] = await pool.execute(`SELECT ID FROM Masjids WHERE ID = ?`, [id]);

		if (masjids.length == 0)
		{
			return res.status(404).send("No masjid exists with id: " + id);
		}

		const masjid = masjids[0];

		const [members] = await pool.execute
		(
			`SELECT Users.ID, FirstName, LastName, DOB, Gender
			FROM Users, Members
			WHERE Members.ID = Users.ID AND Masjid_ID = ?`,
			[masjid.ID]
		);
	
		return res.status(200).send(members);
	}
	catch (error)
	{
		console.error(`Error retrieving data of masjid members ${id}: ` + error);
		return res.status(500).send(`Error retrieving data of masjid members ${id}: ` + error);
	}
});

//#endregion



//#region ========== Get data of all trustees in masjid by ID ==========

// Retrieves data of all trustees in the trust of a masjid by ID in the database
app.get("/:id/trustees", async (req, res) =>
{	
	const { id } = req.params;

	try
	{
		const [masjids] = await pool.execute(`SELECT Trust_ID FROM Masjids WHERE ID = ?`, [id]);

		if (masjids.length == 0)
		{
			return res.status(404).send("No masjid exists with id: " + id);
		}

		const masjid = masjids[0];
		const trustID = masjid.Trust_ID;

		const [trustees] = await pool.execute
		(
			`SELECT Users.ID, FirstName, LastName, DOB, Gender, Email
			FROM Users, Trustees
			WHERE Trustees.ID = Users.ID AND Trust_ID = ?`,
			[trustID]
		);
	
		return res.status(200).send(trustees);
	}
	catch (error)
	{
		console.error(`Error retrieving data of masjid trustees ${id}: ` + error);
		return res.status(500).send(`Error retrieving data of masjid trustees ${id}: ` + error);
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



//#region ========== Get prayer statistics of masjid by ID ==========

// Retrieves prayer statistics of masjid with 'id' at a 'date' for a certain 'prayer' (only viewable by a trustee of that masjid or an admin)
app.get("/:id/:date/:prayer/stats", isLoggedIn, requirePermissions((req) => req.user.masjid_id == req.params.id, "Trustee"), async (req, res) =>
{	
	const { id, date, prayer } = req.params;

	try
	{
		const [masjids] = await pool.execute
		(
			`SELECT Statistics_ID 
			FROM Masjids
			WHERE ID = ?`,
			[id]
		);

		if (masjids.length == 0)
		{
			return res.status(404).send("No masjid exists with id: " + id);
		}

		const statsID = masjids[0].Statistics_ID;

		const [dailyStatistics] = await pool.execute
		(
			`SELECT ID
			FROM DailyMasjidStatistics 
			WHERE Statistics_ID = ? AND CurrentDate = ?`,
			[statsID, date]
		);

		if (dailyStatistics.length == 0)
		{
			return res.status(404).send("No daily masjid statistics for date: " + date);
		}

		const dailyStatsID = dailyStatistics[0].ID;

		const [prayerStatistics] = await pool.execute
		(
			`SELECT Prayer, Attendees
			FROM PrayerMasjidStatistics 
			WHERE Statistics_ID = ? AND Prayer = ?`,
			[dailyStatsID, prayer]
		);

		if (prayerStatistics.length == 0)
		{
			return res.status(404).send("No prayer masjid statistics for prayer: " + prayer);
		}
	
		return res.status(200).send(prayerStatistics[0]);
	}
	catch (error)
	{
		console.error(`Error retrieving prayer statistics of masjid ${id} at date ${date} for prayer ${prayer}: ` + error);
		return res.status(500).send(`Error retrieving prayer statistics of masjid ${id} at date ${date} for prayer ${prayer}: ` + error);
	}
});

//#endregion



export default app;