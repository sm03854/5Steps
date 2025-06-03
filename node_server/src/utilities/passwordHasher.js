import hasher from "hashy";



/**
 * Generates password hash for a given string using the BCrypt hashing algorithm.
 */
async function hashPassword(password)
{
    const hash = await hasher.hash(password);
    return hash;
}

/**
 * Returns true if the given hash was generated from the given password.
 */
async function passwordHashMatches(password, hash)
{
    const matches = await hasher.verify(password, hash);
    return matches;
}



export { hashPassword, passwordHashMatches };
