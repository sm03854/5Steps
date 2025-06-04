import './signUpForm.css'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import {Link} from 'react-router-dom'
import SignUpImage from '../../../assets/signUpImage.png'
import Navbar from '../../navbar/navbar.jsx'
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";


const signUpForm = () => 
{
    const [name, setName] = useState('');
    const [DOB, setDOB] = useState('');
    const [gender, setGender] = useState('Male');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [type, setType] = useState('Student');
    const [class_id, setClassID] = useState(0);

    const [error, setError] = useState('');

    const navigate = useNavigate();

    const signup = async () => 
    {
        try 
        {
            const response = await fetch(`/api/users/new/`, 
            {
                method: 'POST',
                headers: 
                {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, DOB, gender, username, password, type, class_id }),
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
            <div className="sign-up-image-container">
                <img src={SignUpImage} alt="hands waving hello" className="sign-up-image" />
            </div>
            <div className="sign-up-card">
                <h1 className="text-center log-in-title">Welcome, Sign Up Here!</h1>
                <Form>
                    <Form.Group className="mb-4" controlId="formFullName">
                        <Form.Label className="fs-5">Full Name</Form.Label>
                        <Form.Control type="text" placeholder="Enter Full Name" onChange={(e) => setName(e.target.value)}/>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="formDateOfBirth">
                        <Form.Label className="fs-5">Date of Birth</Form.Label>
                        <Form.Control type="date" placeholder="Date of Birth" onChange={(e) => setDOB(e.target.value)}/>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="formGender">
                        <Form.Label className="fs-5">Gender</Form.Label>
                        <Form.Select name="Gender" aria-label="Default select example" onChange={(e) => setGender(e.target.value)}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="formUsername">
                        <Form.Label className="fs-5">Username</Form.Label>
                        <Form.Control type="text" placeholder="Enter Username" onChange={(e) => setUsername(e.target.value)}/>
                    </Form.Group>
                    
                    <Form.Group className="mb-4" controlId="formPassword">
                        <Form.Label className="fs-5">Password</Form.Label>
                        <Form.Control type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)}/>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="formType">
                        <Form.Label className="fs-5">I am a:</Form.Label>
                        <Form.Select name="Type" aria-label="Default select example" onChange={(e) => setType(e.target.value)}>
                            <option value="Student">Student</option>
                            <option value="Teacher">Teacher</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="formClassId">
                        <Form.Label className="fs-5">Class ID</Form.Label>
                        <Form.Control type="number" placeholder="Enter Class ID" onChange={(e) => setClassID(e.target.value)}/>
                    </Form.Group>

                    <Button onClick={signup} className="w-100">
                        Sign Up
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
