



export async function getLocationFromPostcode(postcode)
{
    try 
    {
        const response = await fetch
        (
            `https://api.postcodes.io/postcodes/${postcode}`
        );

        const locationData = await response.json();
        return locationData.result;
    } 
    catch (error) 
    {
        console.error("Location web api failed: ", error);
        return null;
    }
}