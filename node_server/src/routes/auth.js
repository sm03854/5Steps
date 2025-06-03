import express from "express";
import jwt from 'jsonwebtoken';
import { passwordHashMatches } from "../utilities/passwordHasher.js";
import { pool } from "../utilities/database.js";
import { isLoggedIn, isLoggedOut } from "../utilities/permissions.js";

const app = express.Router();



//#region ========== Login as user ==========

// Displays HTML form to enter login data (front-facing-api-route)
// Must be logged out to login, so as to not overwrite any previous session data
// of currently logged-in user
app.get("/login/", isLoggedOut, (req, res) =>
{
    res.render("auth/login");
});

// Login to user account
app.post("/login/", isLoggedOut, async (req, res) =>
{	
    const { email, password } = req.body;
    
    try 
    {
        // Get user from Users table
        const [userResult] = await pool.execute
        (
            `SELECT ID, PasswordHash, Permission FROM Users WHERE Email = ?`,
            [email]
        );

        if (userResult.length == 0)
        {
            return res.status(401).send("Email or password was incorrect. Try again.");
        }

        const user = userResult[0];
        const passwordMatches = await passwordHashMatches(password, user.PasswordHash);
    
        if (!passwordMatches)
        {
            return res.status(401).send("Password was incorrect. Try again.");
        }

        const token = jwt.sign
        (
            {
                id: user.ID,
                permission: user.Permission,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Use a cookie to store login info
        res.cookie("token", token, 
        {
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        return res.status(200).send("Login successful!");
    } 
    catch (error)
    {
        console.error("Error logging in: " + error);
        return res.status(500).send("Error logging in: " + error);
    }
});

//#endregion



//#region ========== Logout as user ==========

// Displays HTML form to logout (front-facing-api-route)
// Must already be logged in to logout, so authenticateToken enforces that.
app.get("/logout/", isLoggedIn, (req, res) =>
{
    res.render("auth/logout");
});

// Login to user account
app.post("/logout/", isLoggedIn, async (req, res) =>
{	
    res.clearCookie("token");
    return res.status(200).send("Logout successful!");
});

//#endregion



export default app;