import './logInForm.css'
import {Link} from 'react-router-dom'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import LogInImage from '../../../assets/logInImage.png'
import Navbar from '../../navbar/navbar.jsx'
import { useState } from "react";
import { useNavigate } from 'react-router-dom';

const LoginForm = () => 
{
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const { enableNotification } = useNotification();

    const login = async () => 
    {
        try 
        {
            const response = await fetch(`/api/auth/login/`, 
            {
                method: 'POST',
                headers: 
                {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
      
            if (response.status != 200) 
            {
                throw new Error('Login failed');
            }

            enableNotification("Login successful", `Welcome back ${username}!`);
            navigate('/');
        }
        catch (err) 
        {
            setError("Invalid username or password. Please try again.");
        }
    }
    
    return (
        <div className="log-in-wrapper">
            <Navbar />
            <div className="log-in-image-container">
                <img src={LogInImage} alt="two high fives" className="log-in-image" />
            </div>
            <div className="log-in-card">
                <Form>
                    <Form.Group className="mb-4" controlId="formUsername">
                        <Form.Label className="fs-5">Username</Form.Label>
                        <Form.Control type="text" placeholder="Enter Username" onChange={(e) => setUsername(e.target.value)}/>
                    </Form.Group>
                    
                    <Form.Group className="mb-4" controlId="formPassword">
                        <Form.Label className="fs-5">Password</Form.Label>
                        <Form.Control type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)}/>
                    </Form.Group>

                    <Button onClick={login} className="w-100">
                        Log In
                    </Button>

                    <p className="text-center mt-3">
                        Don't have an account? <Link to="/signup" className="text-decoration-none log-in-link">Sign up</Link>
                    </p>
                </Form>

                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
        </div>
    )
}

export default LoginForm;