import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Routes, Route} from 'react-router-dom';

/* Main in all pages */
import Footer from './components/home/footer/footer.jsx';

/* Pages */
import Home from './components/home/home.jsx';
import About from './components/about/openAbout.jsx';
import LoginForm from './components/login/logInForm/logInForm.jsx';
import SignUp from './components/login/signUpForm/signUpForm.jsx';

/* Games */
import TypeRacer from './components/games/type_racer/type_racer_game.jsx';
import Match from './components/games/match/match_game.jsx';
import FlashcardGame from "./components/games/flashcards/flashcardGame.jsx";

/* Views */
import ClassView from './components/class/classView/classView.jsx';
import SchoolView from './components/school/schoolView/schoolView.jsx';
import NationView from './components/nation/nationView/nationView.jsx';

/* Leaderboards */
import ClassLeaderboard from './components/class/classLeaderboard/classLeaderboard.jsx';
import SchoolLeaderboard from './components/school/schoolLeaderboard/schoolLeaderboard.jsx';
import NationalLeaderboard from './components/nation/nationalLeaderboard/nationalLeaderboard.jsx';

/* Topic List */
import TopicList from './components/topicList/topicList.jsx';

import GameSelect from './components/gameselect/gameSelect.jsx';

const App = () => {
  return (
    <div>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signUp" element={<SignUp />} />
          <Route path="/games/typeracer/:id" element={<TypeRacer />} />
          <Route path="/games/match/:id" element={<Match />} />
          <Route path="/games/flashcards/:id" element={<FlashcardGame />} />
          <Route path="/myclass" element={<ClassView />} />
          <Route path="/myschool" element={<SchoolView />} />
          <Route path="/mynation" element={<NationView />} />
          <Route path="/myclass/leaderboard" element={<ClassLeaderboard />} />
          <Route path="/myschool/leaderboard" element={<SchoolLeaderboard />} />
          <Route path="/mynation/leaderboard" element={<NationalLeaderboard />} />
          <Route path="/mysubjects/:id" element={<TopicList />} />
          <Route path="/selectgame/:id" element={<GameSelect />} />      
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
