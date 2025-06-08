import express from "express";
import { isLoggedIn, requirePermissions } from "../utilities/permissions.js";
import { hashPassword } from "../utilities/passwordHasher.js";
import { pool, executeTransaction } from "../utilities/database.js";

const app = express.Router();



//#region ========== Create new admin ==========

// Displays HTML form to enter registration data (front-facing-api-route)
app.get("/new/", isLoggedIn, requirePermissions("Admin"), (req, res) =>
{
    return res.render("user/admin/create");
});

// Register a new admin into the database
app.post("/new/", isLoggedIn, requirePermissions("Admin"), async (req, res) =>
{	
    const { firstName, lastName, DOB, gender, email, password } = req.body;
    const passwordHash = await hashPassword(password);
    
    try 
    {
		await executeTransaction(async () => 
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
		});

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



//#region ========== Get data of all admins ==========

// Retrieves data of all admins in the database
app.get("/", async (req, res) =>
{	
	try
	{
		const [admins] = await pool.execute
		(
			`SELECT Users.ID, FirstName, LastName, DOB, Gender, Email 
			FROM Users, Admins
			WHERE Admins.ID = Users.ID`
		);

		return res.status(200).send(admins);
	}
	catch (error)
	{
		console.error("Error retrieving data of all admins in the database: " + error);
		return res.status(500).send("Error retrieving data of all admins in the database: " + error);
	}
});

//#endregion



//#region ========== Get data of admin by ID ==========

// Retrieves full data of admin with 'id' (only viewable by admins)
app.get("/:id/", isLoggedIn, requirePermissions("Admin"), async (req, res) =>
{	
	const { id } = req.params;

	try
	{
		const [admins] = await pool.execute
		(
			`SELECT *
			FROM Users, Admins 
			WHERE Admins.ID = Users.ID AND Users.ID = ?`,
			[id]
		);

		if (admins.length == 0)
		{
			return res.status(404).send("No admin exists with id: " + id);
		}
	
		return res.status(200).send(admins[0]);
	}
	catch (error)
	{
		console.error(`Error retrieving data of admin ${id}: ` + error);
		return res.status(500).send(`Error retrieving data of admin ${id}: ` + error);
	}
});

//#endregion



//#region ========== Edit admin user ==========

// Displays HTML form to update trustee user data (front-facing-api-route)
app.get("/:id/edit/", isLoggedIn, requirePermissions("Admin"), async (req, res) =>
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
	
		return res.render("user/admin/edit",
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
app.post("/:id/edit/", isLoggedIn, requirePermissions("Admin"), async (req, res) =>
{	
	const { id } = req.params;
	const { firstName, lastName, DOB, gender, email, password } = req.body;
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
		});

		return res.status(200).send("Admin data updated successfully!");
	}
	catch (error)
	{
		console.error("Error updating admin data: " + error);
		return res.status(500).send("Error updating admin data: " + error);
	}
});

//#endregion



//#region ========== Delete admin by ID ==========

// Displays HTML form to delete admin data (front-facing-api-route)
app.get("/:id/delete/", isLoggedIn, requirePermissions("Admin"), async (req, res) =>
{	
    const { id } = req.params;

    try
    {
        const [users] = await pool.execute("SELECT * FROM Users WHERE ID = ?", [id]);

        if (users.length == 0)
        {
            return res.status(404).send("No user exists with id: " + id);
        }
    
        return res.render("user/admin/delete",
        {
            id: id
        });
    }
    catch (error)
    {
        console.error(`Error retrieving data of admin ${id}: ` + error);
        return res.status(500).send(`Error retrieving data of admin ${id}: ` + error);
    }
});

// Delete user data
app.post("/:id/delete/", isLoggedIn, requirePermissions("Admin"), async (req, res) =>
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

			const isAdmin = users[0].Permission === "Admin";

            if (!isAdmin)
            {
                return res.status(404).send("No admin exists with id: " + id);
            }

			// Delete account
			await pool.execute
			(
				`DELETE FROM Users WHERE ID = ?`,
				[id]
			);
		});

        return res.status(200).send("Admin data deleted successfully!");
    }
    catch (error)
    {
        console.error("Error deleting admin data: " + error);
        return res.status(500).send("Error deleting admin data: " + error);
    }
});

//#endregion



export default app;