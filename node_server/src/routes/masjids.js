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

			// Create new masjid timetable
			const date = new Date();
			const month = date.getMonth();
			const year = date.getFullYear();
            const [timetables] = await pool.execute(`INSERT INTO Timetables (CurrentMonth, CurrentYear) VALUES (?, ?)`, [month, year]);
			const timetablesInsertID = timetables.insertId;
            
			// Insert new masjid into Masjids table
			await pool.execute
			(
				`INSERT INTO Masjids
				(FullName, Postcode, AddressLine, Email, Latitude, Longitude, Trust_ID, Statistics_ID, Timetable_ID)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[name, postcode, address, email, location.latitude, location.longitude, trustInsertID, statisticsInsertID, timetablesInsertID]
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



//#region ========== Get data of masjid timetable by ID ==========

// Retrieves full data of masjid timetable with 'id'
app.get("/:id/timetable", async (req, res) =>
{	
	const { id } = req.params;

	try
	{
		const [masjids] = await pool.execute
		(
			`SELECT Timetable_ID
			FROM Masjids
            WHERE ID = ?`,
            [id]
		);

		if (masjids.length == 0)
		{
			return res.status(404).send("No masjid exists with id: " + id);
		}

		const masjid = masjids[0];

		const [timetables] = await pool.execute("SELECT * FROM Timetables WHERE ID = ?", [masjid.Timetable_ID]);
		const timetable = timetables[0];

		const [prayers] = await pool.execute
		(
			`SELECT
				pt.CurrentDay,
				MAX(CASE WHEN pt.Prayer = 'Fajr' THEN pt.StartTime END) AS Fajr_StartTime,
				MAX(CASE WHEN pt.Prayer = 'Fajr' THEN pt.AdhanTime END) AS Fajr_AdhanTime,
				MAX(CASE WHEN pt.Prayer = 'Fajr' THEN pt.IqamahTime END) AS Fajr_IqamahTime,
				MAX(CASE WHEN pt.Prayer = 'Zuhr' THEN pt.StartTime END) AS Zuhr_StartTime,
				MAX(CASE WHEN pt.Prayer = 'Zuhr' THEN pt.AdhanTime END) AS Zuhr_AdhanTime,
				MAX(CASE WHEN pt.Prayer = 'Zuhr' THEN pt.IqamahTime END) AS Zuhr_IqamahTime,
				MAX(CASE WHEN pt.Prayer = 'Asr' THEN pt.StartTime END) AS Asr_StartTime,
				MAX(CASE WHEN pt.Prayer = 'Asr' THEN pt.AdhanTime END) AS Asr_AdhanTime,
				MAX(CASE WHEN pt.Prayer = 'Asr' THEN pt.IqamahTime END) AS Asr_IqamahTime,
				MAX(CASE WHEN pt.Prayer = 'Maghrib' THEN pt.StartTime END) AS Maghrib_StartTime,
				MAX(CASE WHEN pt.Prayer = 'Maghrib' THEN pt.AdhanTime END) AS Maghrib_AdhanTime,
				MAX(CASE WHEN pt.Prayer = 'Maghrib' THEN pt.IqamahTime END) AS Maghrib_IqamahTime,
				MAX(CASE WHEN pt.Prayer = 'Isha' THEN pt.StartTime END) AS Isha_StartTime,
				MAX(CASE WHEN pt.Prayer = 'Isha' THEN pt.AdhanTime END) AS Isha_AdhanTime,
				MAX(CASE WHEN pt.Prayer = 'Isha' THEN pt.IqamahTime END) AS Isha_IqamahTime,
				MAX(CASE WHEN et.Extra = 'Sunrise' THEN et.CurrentTime END) AS Sunrise_Time
			FROM PrayerTimes pt
			LEFT JOIN ExtraTimes et ON pt.Timetable_ID = et.Timetable_ID AND pt.CurrentDay = et.CurrentDay
			WHERE pt.Timetable_ID = ?
			GROUP BY pt.CurrentDay
			ORDER BY pt.CurrentDay`,
			[masjid.Timetable_ID]
		);
	
		return res.status(200).send
		({
			month: timetable.CurrentMonth,
			year: timetable.CurrentYear,
			prayer_times: prayers
		});
	}
	catch (error)
	{
		console.error(`Error retrieving data of masjid ${id}: ` + error);
		return res.status(500).send(`Error retrieving data of masjid ${id}: ` + error);
	}
});

//#endregion



//#region ========== Edit timetable ==========

function getDaysInMonth(year, month) 
{
	// O'th day of the month is the last day of the previous month
	return new Date(year, month, 0).getDate();
}

// Displays HTML form to edit masjid timetable (front-facing-api-route)
app.get("/:id/timetable/edit", isLoggedIn, requirePermissions((req) => req.user.masjid_id == req.params.id, "Trustee"), async (req, res) =>
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

		const [timetables] = await pool.execute("SELECT * FROM Timetables WHERE ID = ?", [masjid.Timetable_ID]);
		const timetable = timetables[0];
		const days = getDaysInMonth(timetable.CurrentYear, timetable.CurrentMonth);

		const [prayers] = await pool.execute
		(
			`SELECT
				pt.CurrentDay,
				MAX(CASE WHEN pt.Prayer = 'Fajr' THEN pt.StartTime END) AS Fajr_StartTime,
				MAX(CASE WHEN pt.Prayer = 'Fajr' THEN pt.AdhanTime END) AS Fajr_AdhanTime,
				MAX(CASE WHEN pt.Prayer = 'Fajr' THEN pt.IqamahTime END) AS Fajr_IqamahTime,
				MAX(CASE WHEN pt.Prayer = 'Zuhr' THEN pt.StartTime END) AS Zuhr_StartTime,
				MAX(CASE WHEN pt.Prayer = 'Zuhr' THEN pt.AdhanTime END) AS Zuhr_AdhanTime,
				MAX(CASE WHEN pt.Prayer = 'Zuhr' THEN pt.IqamahTime END) AS Zuhr_IqamahTime,
				MAX(CASE WHEN pt.Prayer = 'Asr' THEN pt.StartTime END) AS Asr_StartTime,
				MAX(CASE WHEN pt.Prayer = 'Asr' THEN pt.AdhanTime END) AS Asr_AdhanTime,
				MAX(CASE WHEN pt.Prayer = 'Asr' THEN pt.IqamahTime END) AS Asr_IqamahTime,
				MAX(CASE WHEN pt.Prayer = 'Maghrib' THEN pt.StartTime END) AS Maghrib_StartTime,
				MAX(CASE WHEN pt.Prayer = 'Maghrib' THEN pt.AdhanTime END) AS Maghrib_AdhanTime,
				MAX(CASE WHEN pt.Prayer = 'Maghrib' THEN pt.IqamahTime END) AS Maghrib_IqamahTime,
				MAX(CASE WHEN pt.Prayer = 'Isha' THEN pt.StartTime END) AS Isha_StartTime,
				MAX(CASE WHEN pt.Prayer = 'Isha' THEN pt.AdhanTime END) AS Isha_AdhanTime,
				MAX(CASE WHEN pt.Prayer = 'Isha' THEN pt.IqamahTime END) AS Isha_IqamahTime,
				MAX(CASE WHEN et.Extra = 'Sunrise' THEN et.CurrentTime END) AS Sunrise_Time
			FROM PrayerTimes pt
			LEFT JOIN ExtraTimes et ON pt.Timetable_ID = et.Timetable_ID AND pt.CurrentDay = et.CurrentDay
			WHERE pt.Timetable_ID = ?
			GROUP BY pt.CurrentDay
			ORDER BY pt.CurrentDay`,
			[masjid.Timetable_ID]
		);
	
		return res.render("masjid/timetable",
		{
			id: id,
			days: days,
			month: timetable.CurrentMonth,
			year: timetable.CurrentYear,
			prayers: prayers
		});
	}
	catch (error)
	{
		console.error("Error retrieving data of masjid timetable: " + error);
		return res.status(500).send("Error retrieving data of masjid timetable: " + error);
	}
});

// Updates masjid timetable
app.post("/:id/timetable/edit/", isLoggedIn, requirePermissions((req) => req.user.masjid_id == req.params.id, "Trustee"), async (req, res) =>
{	
	const { id } = req.params;

    const { month, year, prayers } = req.body;

	try
	{
		await executeTransaction(async () => 
		{
			const [masjids] = await pool.execute("SELECT * FROM Masjids WHERE ID = ?", [id]);
			const masjid = masjids[0];
			const timetableID = masjid.Timetable_ID;

			await pool.execute
			(
				`UPDATE Timetables SET
				CurrentMonth = ?,
				CurrentYear = ?
				WHERE ID = ?`,
				[month, year, timetableID]
			);

			prayers.forEach(async data => 
			{
				await pool.execute
				(
					`INSERT INTO PrayerTimes (Timetable_ID, Prayer, CurrentDay, StartTime, AdhanTime, IqamahTime)
            		VALUES ?
            		ON DUPLICATE KEY UPDATE
                	StartTime = VALUES(StartTime),
                	AdhanTime = VALUES(AdhanTime),
                	IqamahTime = VALUES(IqamahTime);`,
					[
						[timetableID, 'Fajr', data.CurrentDay, data.Fajr_StartTime, data.Fajr_AdhanTime, data.Fajr_IqamahTime],
						[timetableID, 'Zuhr', data.currentDay, data.Zuhr_StartTime, data.Zuhr_AdhanTime, data.Zuhr_IqamahTime],
						[timetableID, 'Asr', data.currentDay, data.Asr_StartTime, data.Asr_AdhanTime, data.Asr_IqamahTime],
						[timetableID, 'Maghrib', data.currentDay, data.Maghrib_StartTime, data.Maghrib_AdhanTime, data.Maghrib_IqamahTime],
						[timetableID, 'Isha', data.currentDay, data.Isha_StartTime, data.Isha_AdhanTime, data.Isha_IqamahTime]
					]
				);

				await pool.execute
				(
					`INSERT INTO ExtraTimes (Timetable_ID, Extra, CurrentDay, CurrentTime)
            		VALUES ?
            		ON DUPLICATE KEY UPDATE
                	CurrentTime = VALUES(CurrentTime);`,
					[
						[timetableID, 'Sunrise', data.currentDay, data.Sunrise_Time]
					]
				);
			});
		});

		return res.status(200).send("Masjid timetable updated successfully!");
	}
	catch (error)
	{
		console.error("Error updating masjid timetable: " + error);
		return res.status(500).send("Error updating masjid timetable: " + error);
	}
});

//#endregion



export default app;