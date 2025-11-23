import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Workspace from './components/Workspace';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<Workspace />} />
      </Routes>
    </Router>
  );
}

export default App;
