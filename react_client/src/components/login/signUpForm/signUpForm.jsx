import './signUpForm.css'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import {Link} from 'react-router-dom'
import Navbar from '../../navbar/navbar.jsx'
import { useNavigate } from 'react-router-dom';
import { useState } from "react";
import MasjidSearch from "./masjidSearch.jsx";



const signUpForm = () => 
{
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [DOB, setDOB] = useState('');
    const [gender, setGender] = useState('Male');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [masjidID, setMasjidID] = useState(0);

    const [error, setError] = useState('');

    const navigate = useNavigate();

    const signup = async () => 
    {
        try 
        {
            const response = await fetch(`/api/members/new/`, 
            {
                method: 'POST',
                headers: 
                {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ firstName, lastName, DOB, gender, email, password, masjidID }),
                credentials: 'include'
            });
      
            if (response.status != 201) 
            {
                throw new Error(response.statusText);
            }

            navigate('/login');
        }
        catch (err) 
        {
            setError("Invalid user details: " + err.message + ". Please try again.");
        }
    }

    return (
        <div className="sign-up-wrapper">
            <Navbar />
            <div className="sign-up-card">
                <h1 className="text-center log-in-title">Welcome, Sign Up Here!</h1>
                <Form>
                    <Form.Group className="mb-4" controlId="formFirstName">
                        <Form.Label className="fs-5">First Name</Form.Label>
                        <Form.Control type="text" placeholder="Enter your first name" onChange={(e) => setFirstName(e.target.value)}/>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="formLastName">
                        <Form.Label className="fs-5">Last Name</Form.Label>
                        <Form.Control type="text" placeholder="Enter your last name" onChange={(e) => setLastName(e.target.value)}/>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="formDateOfBirth">
                        <Form.Label className="fs-5">Date of Birth</Form.Label>
                        <Form.Control type="date" placeholder="Select your date of birth" onChange={(e) => setDOB(e.target.value)}/>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="formGender">
                        <Form.Label className="fs-5">Gender</Form.Label>
                        <Form.Select name="Gender" aria-label="Default select example" onChange={(e) => setGender(e.target.value)}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="formEmail">
                        <Form.Label className="fs-5">Email</Form.Label>
                        <Form.Control type="text" placeholder="Enter your email address" onChange={(e) => setEmail(e.target.value)}/>
                    </Form.Group>
                    
                    <Form.Group className="mb-4" controlId="formPassword">
                        <Form.Label className="fs-5">Password</Form.Label>
                        <Form.Control type="password" placeholder="Enter your password" onChange={(e) => setPassword(e.target.value)}/>
                    </Form.Group>

                    <MasjidSearch onMasjidSelect={(id) => setMasjidID(id)} />

                    <Button onClick={signup} className="w-100">
                        Sign Up (will redirect you to login)
                    </Button>

                    <p className="text-center mt-3">
                        Already have an account? <Link to="/login" className="text-decoration-none log-in-link">Log In</Link>
                    </p>
                </Form>

                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
        </div>
    )
}



export default signUpForm
