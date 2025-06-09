import './signUpForm.css'
import Form from 'react-bootstrap/Form'
import { useState, useEffect } from 'react';



const MasjidSearch = ({ onMasjidSelect }) =>
{
    const [name, setName] = useState('');
    const [masjids, setMasjids] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => 
    {
        const delayDebounce = setTimeout(() => 
        {
            if (name.length > 0) 
            {
                fetch(`/api/masjids/search?name=${encodeURIComponent(name)}`)
                .then(res => res.json())
                .then(data => 
                {
                    setMasjids(data);
                    setShowDropdown(true);
                });
            } 
            else 
            {
                setMasjids([]);
                setShowDropdown(false);
            }
        }, 300); // debounce: 300ms

        return () => clearTimeout(delayDebounce);
    }, [name]);

    const handleSelect = (masjid) => 
    {
        setName(masjid.FullName);
        onMasjidSelect(masjid.ID);

        setShowDropdown(false);
    };

    return (
        <Form.Group className="mb-4" controlId="formLastName">
            <Form.Label className="fs-5">Local Masjid</Form.Label>
            <Form.Control type="text" placeholder="Search your local Masjid by name" value={name} onChange={(e) => setName(e.target.value)}/>

            {showDropdown && masjids.length > 0 && 
            (
                <ul className="absolute left-0 right-0 z-10 mt-1 bg-white border rounded shadow">
                    {masjids.map((masjid) => 
                    (
                        <li key={masjid.ID} className="p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSelect(masjid)}>
                            {masjid.FullName} ({masjid.AddressLine})
                        </li>
                    ))}
                </ul>
            )}
        </Form.Group>
    );
}


export default MasjidSearch;