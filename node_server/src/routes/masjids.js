import express from "express";
import { pool } from "../utilities/database.js";

const app = express.Router();



//#region ========== Search Masjids by name ==========

// Retrieves all Masjids with similar names to 'name' parameter
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