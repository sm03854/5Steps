import './navbar.css'
import { Link } from 'react-router-dom'
import logo from '../../../assets/embraceedlogo.png'



const navbar = () => 
{
  return (
    <nav className="navbar-container">
      <img src={logo} alt="EmbraceEd Logo" className="logo" />
      <h1 style={{color:'#A16FDD'}}>5Steps</h1>
      <ul>
        <li><Link to="/" className="navigation-buttons">Home</Link></li>
        <li><Link to="/about" className="navigation-buttons">About</Link></li>
        <li><Link to="/login"><button className="login-button">Log in</button></Link></li>
      </ul>
    </nav>
  )
}



export default navbar

