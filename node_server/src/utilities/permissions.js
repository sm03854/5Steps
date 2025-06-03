import jwt from 'jsonwebtoken';



//#region Authentication

/**
 * Authenticates a user - checks if they are logged in.
 */
export function isLoggedIn(req, res, next) 
{
    const token = req.cookies.token;

    if (!token)
    {
        // Status code 401: Unauthorised
        return res.status(401).send("Not logged in.");
    }

    try 
    {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user; // user = { id, permission } from api/auth/login route

        next();
    } 
    catch (err) 
    {
        // Status code 403: Forbidden
        return res.status(403).send("Invalid or expired token.");
    }
}

/**
 * Only continues if a user is logged OUT.
 * Helps with /api/auth/login route specifically.
 */
export function isLoggedOut(req, res, next)
{
    const token = req.cookies.token;

    if (token)
    {
        // Status code 401: Unauthorised
        return res.status(401).send("Need to logout.");
    }

    next();
}

//#endregion



//#region User Permissions

/**
 * Checks whether the user has the correct permissions to access a route
 */
export function requirePermissions(...allowedRoles)
{
    return (req, res, next) => 
    {
        if (req.user == null)
        {
            // Status code 401: Unauthorised
            return res.status(401).send("Not logged in.");
        }

        if (req.user.permission != "Admin")
        {
            // ID of user must match ID of request (if user is a member or trustee)       
            if (req.user.id != req.params.id)
            {
                // Status code 403: Forbidden
                return res.status(403).send("Access denied.");
            }
        }

        if (!allowedRoles.includes(req.user.permission)) 
        {
            // Status code 403: Forbidden
            return res.status(403).send("Access denied");
        }

        next();
    }
}

//#endregion