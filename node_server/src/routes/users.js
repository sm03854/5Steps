import express from "express";
import { isLoggedIn, requirePermissions } from "../utilities/permissions.js";
import { hashPassword } from "../utilities/passwordHasher.js";
import { pool } from "../utilities/database.js";

const app = express.Router();



//#region ========== Create new user ==========



//#region ========== Create new member user ==========

// Displays HTML form to enter registration data (front-facing-api-route)
app.get("/members/new", (req, res) =>
{
    return res.render("user/member/create");
});

// Register a new member into the database
app.post("/members/new", async (req, res) =>
{	
    const { firstName, lastName, DOB, gender, email, password, masjidID } = req.body;
    const passwordHash = await hashPassword(password);
    
    try 
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
			(ID, Masjid_ID, Statistics_ID) VALUES (?, ?)`,
			[userInsertID, masjidID, statisticsInsertID]
		);

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



//#region ========== Create new trustee user ==========

// Displays HTML form to enter registration data (front-facing-api-route)
app.get("/trustees/new", requirePermissions("Admin"), (req, res) =>
{
    return res.render("user/trustee/create");
});

// Register a new trustee into the database
app.post("/trustees/new", requirePermissions("Admin"), async (req, res) =>
{	
    const { firstName, lastName, DOB, gender, email, password, trustID } = req.body;
    const passwordHash = await hashPassword(password);
    
    try 
    {
        // Insert new user into Users table
        const [userResult] = await pool.execute
        (
            `INSERT INTO Users 
            (FirstName, LastName, DOB, Gender, Email, PasswordHash, Permission)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, DOB, gender, email, passwordHash, "Trustee"]
        );
		const userInsertID = userResult.insertId;

		// User is a trustee so insert trustee data
		await pool.execute
		(
			`INSERT INTO Trustees
			(ID, Trust_ID) VALUES (?, ?)`,
			[userInsertID, trustID]
		);

		// Status code 201: Created
		return res.status(201).send(`New trustee registered successfully!`);
    } 
    catch (error)
    {
        console.error(`Error registering a new trustee: ` + error);
        return res.status(500).send(`Error registering a new trustee: ` + error);
    }
});

//#endregion



//#region ========== Create new admin user ==========

// Displays HTML form to enter registration data (front-facing-api-route)
app.get("/admins/new", requirePermissions("Admin"), (req, res) =>
{
    return res.render("user/admin/create");
});

// Register a new admin into the database
app.post("/admins/new", requirePermissions("Admin"), async (req, res) =>
{	
    const { firstName, lastName, DOB, gender, email, password } = req.body;
    const passwordHash = await hashPassword(password);
    
    try 
    {
        // Insert new user into Users table
        const [userResult] = await pool.execute
        (
            `INSERT INTO Users 
            (FirstName, LastName, DOB, Gender, Email, PasswordHash, Permission)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, DOB, gender, email, passwordHash, "Admin"]
        );
		const userInsertID = userResult.insertId;

		// User is an admin so insert admin data
		await pool.execute
		(
			`INSERT INTO Admins
			(ID) VALUES (?)`,
			[userInsertID]
		);

		// Status code 201: Created
		return res.status(201).send(`New admin registered successfully!`);
    } 
    catch (error)
    {
        console.error(`Error registering a new admin: ` + error);
        return res.status(500).send(`Error registering a new admin: ` + error);
    }
});

//#endregion



//#endregion



//#region ========== Get data of user/s ==========

// Retrieves data (except contact info) of all users in the database
app.get("/", async (req, res) =>
{	
	try
	{
		const [users] = await pool.execute('SELECT FirstName, LastName, DOB, Gender FROM Users');
		return res.status(200).send(users);
	}
	catch (error)
	{
		console.error("Error retrieving data of all users in the database: " + error);
		return res.status(500).send("Error retrieving data of all users in the database: " + error);
	}
});

// Retrieves data (except contact info) of user with 'id' (only visible to that user)
app.get("/:id/", async (req, res) =>
{	
	const { id } = req.params;

	try
	{
		const [users] = await pool.execute("SELECT FirstName, LastName, DOB, Gender FROM Users WHERE ID = ?", [id]);

		if (users.length == 0)
		{
			return res.status(404).send("No user exists with id: " + id);
		}
	
		return res.status(200).send(users[0]);
	}
	catch (error)
	{
		console.error(`Error retrieving data of user ${id}: ` + error);
		return res.status(500).send(`Error retrieving data of user ${id}: ` + error);
	}
});

//#endregion



//#region ========== Edit user ==========



//#region ========== Edit member user ==========

// Displays HTML form to update member user data (front-facing-api-route)
app.get("/members/:id/edit/", isLoggedIn, requirePermissions("Member", "Admin"), async (req, res) =>
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

// Updates user data
app.post("/members/:id/edit/", isLoggedIn, requirePermissions("Member", "Admin"), async (req, res) =>
{	
	const { id } = req.params;
	const { firstName, lastName, DOB, gender, email, password, masjidID } = req.body;
	const passwordHash = await hashPassword(password);

	try
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
	
		return res.status(200).send("Member data updated successfully!");
	}
	catch (error)
	{
		console.error("Error updating member data: " + error);
		return res.status(500).send("Error updating member data: " + error);
	}
});

//#endregion



//#region ========== Edit trustee user ==========

// Displays HTML form to update trustee user data (front-facing-api-route)
app.get("/trustees/:id/edit/", isLoggedIn, requirePermissions("Trustee", "Admin"), async (req, res) =>
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

		const [trustees] = await pool.execute("SELECT * FROM Trustees WHERE ID = ?", [id]);

		if (trustees.length == 0)
		{
			return res.status(404).send("No trustee exists with id: " + id);
		}
	
		const trustee = trustees[0];

		 // Converts date to "YYYY-MM-DD" format so it can be displayed in html
		const userDOB = new Date(user.DOB);
		const formattedDOB = userDOB.toISOString().split('T')[0];
	
		return res.render("user/trustee/edit",
		{
			id: id,
			firstName: user.FirstName,
			lastName: user.LastName,
			DOB: formattedDOB,
			gender: user.Gender,
			email: user.Email,
			trustID: trustee.Trust_ID,
		});
	}
	catch (error)
	{
		console.error("Error retrieving data of currently logged-in trustee user: " + error);
		return res.status(500).send("Error retrieving data of currently logged-in trustee user: " + error);
	}
});

// Updates user data
app.post("/members/:id/edit/", isLoggedIn, requirePermissions("Trustee", "Admin"), async (req, res) =>
{	
	const { id } = req.params;
	const { firstName, lastName, DOB, gender, email, password, trustID } = req.body;
	const passwordHash = await hashPassword(password);

	try
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
			`UPDATE Trustees SET
			Trust_ID = ?
			WHERE ID = ?`,
			[trustID, id]
		);
	
		return res.status(200).send("Trustee data updated successfully!");
	}
	catch (error)
	{
		console.error("Error updating trustee data: " + error);
		return res.status(500).send("Error updating trustee data: " + error);
	}
});

//#endregion



//#region ========== Edit admin user ==========

// Displays HTML form to update trustee user data (front-facing-api-route)
app.get("/admins/:id/edit/", isLoggedIn, requirePermissions("Admin"), async (req, res) =>
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

		 // Converts date to "YYYY-MM-DD" format so it can be displayed in html
		const userDOB = new Date(user.DOB);
		const formattedDOB = userDOB.toISOString().split('T')[0];
	
		return res.render("user/trustee/edit",
		{
			id: id,
			firstName: user.FirstName,
			lastName: user.LastName,
			DOB: formattedDOB,
			gender: user.Gender,
			email: user.Email
		});
	}
	catch (error)
	{
		console.error("Error retrieving data of currently logged-in trustee user: " + error);
		return res.status(500).send("Error retrieving data of currently logged-in trustee user: " + error);
	}
});

// Updates user data
app.post("/members/:id/edit/", isLoggedIn, requirePermissions("Admin"), async (req, res) =>
{	
	const { id } = req.params;
	const { firstName, lastName, DOB, gender, email, password } = req.body;
	const passwordHash = await hashPassword(password);

	try
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
	
		return res.status(200).send("Admin data updated successfully!");
	}
	catch (error)
	{
		console.error("Error updating admin data: " + error);
		return res.status(500).send("Error updating admin data: " + error);
	}
});

//#endregion



//#endregion



//#region ========== Delete user ==========

// Displays HTML form to delete user data (front-facing-api-route)
app.get("/:id/delete/", isLoggedIn, requirePermissions("Member", "Trustee", "Admin"), async (req, res) =>
{	
    const { id } = req.params;

    try
    {
        const [users] = await pool.execute("SELECT * FROM Users WHERE ID = ?", [id]);

        if (users.length == 0)
        {
            return res.status(404).send("No user exists with id: " + id);
        }
    
        return res.render("user/delete",
        {
            id: id
        });
    }
    catch (error)
    {
        console.error(`Error retrieving data of user ${id}: ` + error);
        return res.status(500).send(`Error retrieving data of user ${id}: ` + error);
    }
});

// Delete user data
app.post("/:id/delete/", isLoggedIn, requirePermissions("Member", "Trustee", "Admin"), async (req, res) =>
{	
    const { id } = req.params;

    try
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
		let statisticsID = -1;

		if (isMember)
		{
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
		}

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
		if (isMember)
		{
			await pool.execute
			(
				`DELETE FROM UserStatistics WHERE ID = ?`,
				[statisticsID]
			);
		}
    
        return res.status(200).send("User data deleted successfully!");
    }
    catch (error)
    {
        console.error("Error deleting user data: " + error);
        return res.status(500).send("Error deleting user data: " + error);
    }
});

//#endregion



export default app;