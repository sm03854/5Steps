import express from "express";
import { isLoggedIn, requirePermissions } from "../utilities/permissions.js";
import { hashPassword } from "../utilities/passwordHasher.js";
import { pool, executeTransaction } from "../utilities/database.js";

const app = express.Router();



//#region ========== Create new member ==========

// Displays HTML form to enter registration data (front-facing-api-route)
app.get("/new/", (req, res) =>
{
    return res.render("user/member/create");
});

// Register a new member into the database
app.post("/new/", async (req, res) =>
{	
    const { firstName, lastName, DOB, gender, email, password, masjidID } = req.body;
    const passwordHash = await hashPassword(password);
    
    try 
    {
		await executeTransaction(async () =>
		{
			// Insert new user into Users table
			const [userResult] = await pool.execute
			(
				`INSERT INTO Users 
				(FirstName, LastName, DOB, Gender, Email, PasswordHash)
				VALUES (?, ?, ?, ?, ?, ?)`,
				[firstName, lastName, DOB, gender, email, passwordHash]
			);
			const userInsertID = userResult.insertId;

			// Create new user statistics entry
			const [statisticsResult] = await pool.execute(`INSERT INTO UserStatistics () VALUES ()`);
			const statisticsInsertID = statisticsResult.insertId;

			// User is also a member so insert member data
			await pool.execute
			(
				`INSERT INTO Members
				(ID, Masjid_ID, Statistics_ID) VALUES (?, ?, ?)`,
				[userInsertID, masjidID, statisticsInsertID]
			);
		});

		// Status code 201: Created
		return res.status(201).send("New member registered successfully!");
    } 
    catch (error)
    {
        console.error("Error registering a new member: " + error);
        return res.status(500).send("Error registering a new member: " + error);
    }
});

//#endregion



//#region ========== Get data of all members ==========

// Retrieves data (except contact info) of all members in the database
app.get("/", async (req, res) =>
{	
	try
	{
		const [members] = await pool.execute
		(
			`SELECT Users.ID, FirstName, LastName, DOB, Gender, Masjid_ID 
			FROM Users, Members 
			WHERE Members.ID = Users.ID`
		);

		return res.status(200).send(members);
	}
	catch (error)
	{
		console.error("Error retrieving data of all members in the database: " + error);
		return res.status(500).send("Error retrieving data of all members in the database: " + error);
	}
});

//#endregion



//#region ========== Get data of member by ID ==========

// Retrieves full data of member with 'id' (only viewable by that member or an admin)
app.get("/:id/", isLoggedIn, requirePermissions((req) => req.user.id == req.params.id, "Member"), async (req, res) =>
{	
	const { id } = req.params;

	try
	{
		const [members] = await pool.execute
		(
			`SELECT *
			FROM Users, Members 
			WHERE Members.ID = Users.ID AND Users.ID = ?`,
			[id]
		);

		if (members.length == 0)
		{
			return res.status(404).send("No member exists with id: " + id);
		}
	
		return res.status(200).send(members[0]);
	}
	catch (error)
	{
		console.error(`Error retrieving data of member ${id}: ` + error);
		return res.status(500).send(`Error retrieving data of member ${id}: ` + error);
	}
});

//#endregion



//#region ========== Edit member by ID ==========

// Displays HTML form to update member user data (front-facing-api-route)
app.get("/:id/edit/", isLoggedIn, requirePermissions((req) => req.user.id == req.params.id, "Member"), async (req, res) =>
{	
	const { id } = req.params;

	try
	{
		const [users] = await pool.execute("SELECT * FROM Users WHERE ID = ?", [id]);

		if (users.length == 0)
		{
			return res.status(404).send("No user exists with id: " + id);
		}

		const user = users[0];

		const [members] = await pool.execute("SELECT * FROM Members WHERE ID = ?", [id]);

		if (members.length == 0)
		{
			return res.status(404).send("No member exists with id: " + id);
		}
	
		const member = members[0];

		 // Converts date to "YYYY-MM-DD" format so it can be displayed in html
		const userDOB = new Date(user.DOB);
		const formattedDOB = userDOB.toISOString().split('T')[0];
	
		return res.render("user/member/edit",
		{
			id: id,
			firstName: user.FirstName,
			lastName: user.LastName,
			DOB: formattedDOB,
			gender: user.Gender,
			email: user.Email,
			masjidID: member.Masjid_ID,
		});
	}
	catch (error)
	{
		console.error("Error retrieving data of currently logged-in member user: " + error);
		return res.status(500).send("Error retrieving data of currently logged-in member user: " + error);
	}
});

// Updates member data
app.post("/:id/edit/", isLoggedIn, requirePermissions((req) => req.user.id == req.params.id, "Member"), async (req, res) =>
{	
	const { id } = req.params;
	const { firstName, lastName, DOB, gender, email, password, masjidID } = req.body;
	const passwordHash = await hashPassword(password);

	try
	{
		await executeTransaction(async () =>
		{
			await pool.execute
			(
				`UPDATE Users SET
				FirstName = ?,
				LastName = ?,
				DOB = ?,
				Gender = ?,
				Email = ?,
				PasswordHash = ?
				WHERE ID = ?`,
				[firstName, lastName, DOB, gender, email, passwordHash, id]
			);

			await pool.execute
			(
				`UPDATE Members SET
				Masjid_ID = ?
				WHERE ID = ?`,
				[masjidID, id]
			);
		});

		return res.status(200).send("Member data updated successfully!");
	}
	catch (error)
	{
		console.error("Error updating member data: " + error);
		return res.status(500).send("Error updating member data: " + error);
	}
});

//#endregion



//#region ========== Delete member by ID ==========

// Displays HTML form to delete member data (front-facing-api-route)
app.get("/:id/delete/", isLoggedIn, requirePermissions((req) => req.user.id == req.params.id, "Member"), async (req, res) =>
{	
    const { id } = req.params;

    try
    {
        const [users] = await pool.execute("SELECT * FROM Users WHERE ID = ?", [id]);

        if (users.length == 0)
        {
            return res.status(404).send("No user exists with id: " + id);
        }
    
        return res.render("user/member/delete",
        {
            id: id
        });
    }
    catch (error)
    {
        console.error(`Error retrieving data of member ${id}: ` + error);
        return res.status(500).send(`Error retrieving data of member ${id}: ` + error);
    }
});

// Delete member data
app.post("/:id/delete/", isLoggedIn, requirePermissions((req) => req.user.id == req.params.id, "Member"), async (req, res) =>
{	
    const { id } = req.params;

    try
    {
		await executeTransaction(async () =>
		{
			const [users] = await pool.execute
			(
				`SELECT Permission FROM Users WHERE ID = ?`,
				[id]
			);

			if (users.length == 0)
			{
				return res.status(404).send("No user exists with id: " + id);
			}

			const isMember = users[0].Permission === "Member";

            if (!isMember)
            {
                return res.status(404).send("No member exists with id: " + id);
            }

			let statisticsID = -1;

            const [members] = await pool.execute
            (
                `SELECT Statistics_ID FROM Members WHERE ID = ?`,
                [id]
            );

            if (members.length == 0)
            {
                return res.status(404).send("No member exists with id: " + id);
            }

            statisticsID = members[0].Statistics_ID;

			// Delete account
			await pool.execute
			(
				`DELETE FROM Users WHERE ID = ?`,
				[id]
			);

			// Delete user statistics (if it exists)
			// This delete must occur after deleting the account
			// because of the ON DELETE RESTRICT constraint in the
			// Members table
            await pool.execute
            (
                `DELETE FROM UserStatistics WHERE ID = ?`,
                [statisticsID]
            );
		});

        return res.status(200).send("Member data deleted successfully!");
    }
    catch (error)
    {
        console.error("Error deleting member data: " + error);
        return res.status(500).send("Error deleting member data: " + error);
    }
});

//#endregion



//#region ========== Get prayer statistics of member by ID ==========

// Retrieves prayer statistics of member with 'id' at a 'date' for a certain 'prayer' (only viewable by that member or an admin)
app.get("/:id/:date/:prayer/stats", isLoggedIn, requirePermissions((req) => req.user.id == req.params.id, "Member"), async (req, res) =>
{	
	const { id, date, prayer } = req.params;

	try
	{
		const [members] = await pool.execute
		(
			`SELECT Statistics_ID 
			FROM Members 
			WHERE Members.ID = ?`,
			[id]
		);

		if (members.length == 0)
		{
			return res.status(404).send("No member exists with id: " + id);
		}

		const statsID = members[0].Statistics_ID;

		const [dailyStatistics] = await pool.execute
		(
			`SELECT ID
			FROM DailyUserStatistics 
			WHERE Statistics_ID = ? AND CurrentDate = ?`,
			[statsID, date]
		);

		if (dailyStatistics.length == 0)
		{
			return res.status(404).send("No daily user statistics for date: " + date);
		}

		const dailyStatsID = dailyStatistics[0].ID;

		const [prayerStatistics] = await pool.execute
		(
			`SELECT Prayer, Attended, Steps
			FROM PrayerUserStatistics 
			WHERE Statistics_ID = ? AND Prayer = ?`,
			[dailyStatsID, prayer]
		);

		if (prayerStatistics.length == 0)
		{
			return res.status(404).send("No prayer user statistics for prayer: " + prayer);
		}
	
		return res.status(200).send(prayerStatistics[0]);
	}
	catch (error)
	{
		console.error(`Error retrieving prayer statistics of member ${id} at date ${date} for prayer ${prayer}: ` + error);
		return res.status(500).send(`Error retrieving prayer statistics of member ${id} at date ${date} for prayer ${prayer}: ` + error);
	}
});

//#endregion



//#region ========== Log prayer statistics of member by ID ==========

// Displays HTML form to update member user data (front-facing-api-route)
app.get("/:id/:date/:prayer/log", isLoggedIn, requirePermissions((req) => req.user.id == req.params.id, "Member"), async (req, res) =>
{	
	const { id, date, prayer } = req.params;

	try
	{
		return res.render("user/member/log_prayers",
		{
			id: id,
			date: date,
			prayer: prayer
		});
	}
	catch (error)
	{
		console.error("Error retrieving prayer statistics data of currently logged-in member user: " + error);
		return res.status(500).send("Error retrieving prayer statistics data of currently logged-in member user: " + error);
	}
});

// Logs prayer statistics (steps) of member with 'id' at a 'date' for a certain 'prayer' (only viewable by that member or an admin)
app.post("/:id/:date/:prayer/log", isLoggedIn, requirePermissions((req) => req.user.id == req.params.id, "Member"), async (req, res) =>
{	
	const { id, date, prayer } = req.params;
	const { attended, steps } = req.body;

	try
	{
		const [members] = await pool.execute
		(
			`SELECT Statistics_ID 
			FROM Members 
			WHERE Members.ID = ?`,
			[id]
		);

		if (members.length == 0)
		{
			return res.status(404).send("No member exists with id: " + id);
		}

		const statsID = members[0].Statistics_ID;

		const [dailyStatistics] = await pool.execute
		(
			`SELECT ID
			FROM DailyUserStatistics 
			WHERE Statistics_ID = ? AND CurrentDate = ?`,
			[statsID, date]
		);

		if (dailyStatistics.length == 0)
		{
			return res.status(404).send("No daily user statistics for date: " + date);
		}

		const dailyStatsID = dailyStatistics[0].ID;
		
		const didAttend = attended === "true";

		await pool.execute
		(
			`INSERT INTO PrayerUserStatistics
			(Statistics_ID, Prayer, Attended, Steps)
			VALUES (?, ?, ?, ?)
			ON DUPLICATE KEY UPDATE
    		Attended = VALUES(Attended),
    		Steps = VALUES(Steps)`,
			[dailyStatsID, prayer, didAttend, steps]
		);
	
		return res.status(201).send("Logged prayer statistics successfully.");
	}
	catch (error)
	{
		console.error(`Error logging prayer statistics of member ${id} at date ${date} for prayer ${prayer}: ` + error);
		return res.status(500).send(`Error logging prayer statistics of member ${id} at date ${date} for prayer ${prayer}: ` + error);
	}
});

//#endregion



export default app;