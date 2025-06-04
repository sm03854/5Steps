import 'bootstrap/dist/css/bootstrap.min.css';
import {Routes, Route} from 'react-router-dom';

/* Main in all pages */
import Footer from './components/home/footer/footer.jsx';

/* Pages */
import Home from './components/home/home.jsx';
import About from './components/about/openAbout.jsx';
import LoginForm from './components/login/logInForm/logInForm.jsx';
import SignUp from './components/login/signUpForm/signUpForm.jsx';

const App = () => {
  return (
    <div>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signUp" element={<SignUp />} />  
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
