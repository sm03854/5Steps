import express from "express";
import { isLoggedIn, requirePermissions } from "../utilities/permissions.js";
import { hashPassword } from "../utilities/passwordHasher.js";
import { pool, executeTransaction } from "../utilities/database.js";

const app = express.Router();



//#region ========== Create new trustee ==========

// Displays HTML form to enter registration data (front-facing-api-route)
app.get("/new", isLoggedIn, requirePermissions("Admin"), (req, res) =>
{
    return res.render("user/trustee/create");
});

// Register a new trustee into the database
app.post("/new", requirePermissions("Admin"), async (req, res) =>
{	
    const { firstName, lastName, DOB, gender, email, password, trustID } = req.body;
    const passwordHash = await hashPassword(password);
    
    try 
    {
		executeTransaction(async () => 
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
		});

        

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



//#region ========== Get data of all trustees ==========

// Retrieves data of all trustees in the database
app.get("/", async (req, res) =>
{	
	try
	{
		const [trustees] = await pool.execute
		(
			`SELECT Users.ID, FirstName, LastName, DOB, Gender, Email, Trust_ID 
			FROM Users, Trustees
			WHERE Trustees.ID = Users.ID`
		);

		return res.status(200).send(trustees);
	}
	catch (error)
	{
		console.error("Error retrieving data of all trustees in the database: " + error);
		return res.status(500).send("Error retrieving data of all trustees in the database: " + error);
	}
});

//#endregion



//#region ========== Get data of trustee by ID ==========

// Retrieves full data of trustee with 'id' (only viewable by that trustee or an admin)
app.get("/:id/", isLoggedIn, requirePermissions("Trustee", "Admin"), async (req, res) =>
{	
	const { id } = req.params;

	try
	{
		const [trustees] = await pool.execute
		(
			`SELECT *
			FROM Users, Trustees 
			WHERE Trustees.ID = Users.ID AND Users.ID = ?`,
			[id]
		);

		if (trustees.length == 0)
		{
			return res.status(404).send("No trustee exists with id: " + id);
		}
	
		return res.status(200).send(trustees[0]);
	}
	catch (error)
	{
		console.error(`Error retrieving data of trustee ${id}: ` + error);
		return res.status(500).send(`Error retrieving data of trustee ${id}: ` + error);
	}
});

//#endregion



//#region ========== Edit trustee by ID ==========

// Displays HTML form to update trustee user data (front-facing-api-route)
app.get("/:id/edit/", isLoggedIn, requirePermissions("Trustee", "Admin"), async (req, res) =>
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
app.post("/:id/edit/", isLoggedIn, requirePermissions("Trustee", "Admin"), async (req, res) =>
{	
	const { id } = req.params;
	const { firstName, lastName, DOB, gender, email, password, trustID } = req.body;
	const passwordHash = await hashPassword(password);

	try
	{
		executeTransaction(async () =>
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
		});
		
		return res.status(200).send("Trustee data updated successfully!");
	}
	catch (error)
	{
		console.error("Error updating trustee data: " + error);
		return res.status(500).send("Error updating trustee data: " + error);
	}
});

//#endregion



//#region ========== Delete trustee by ID ==========

// Displays HTML form to delete trustee data (front-facing-api-route)
app.get("/:id/delete/", isLoggedIn, requirePermissions("Trustee", "Admin"), async (req, res) =>
{	
    const { id } = req.params;

    try
    {
        const [users] = await pool.execute("SELECT * FROM Users WHERE ID = ?", [id]);

        if (users.length == 0)
        {
            return res.status(404).send("No user exists with id: " + id);
        }
    
        return res.render("user/trustee/delete",
        {
            id: id
        });
    }
    catch (error)
    {
        console.error(`Error retrieving data of trustee ${id}: ` + error);
        return res.status(500).send(`Error retrieving data of trustee ${id}: ` + error);
    }
});

// Delete user data
app.post("/:id/delete/", isLoggedIn, requirePermissions("Trustee", "Admin"), async (req, res) =>
{	
    const { id } = req.params;

    try
    {
		executeTransaction(async () =>
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

			const isTrustee = users[0].Permission === "Trustee";

            if (!isTrustee)
            {
                return res.status(404).send("No trustee exists with id: " + id);
            }

			// Delete account
			await pool.execute
			(
				`DELETE FROM Users WHERE ID = ?`,
				[id]
			);
		});

        return res.status(200).send("Trustee data deleted successfully!");
    }
    catch (error)
    {
        console.error("Error deleting trustee data: " + error);
        return res.status(500).send("Error deleting trustee data: " + error);
    }
});

//#endregion



export default app;