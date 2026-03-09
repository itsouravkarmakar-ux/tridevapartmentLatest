import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Users, Receipt, AlertCircle } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Owners from './pages/Owners';
import Expenses from './pages/Expenses';
import Defaulters from './pages/Defaulters';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="sidebar glass" style={{ borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0 }}>
      <h1>Tridev<br />Apartment</h1>
      <div className="nav-links">
        <Link to="/" className={`nav-link ${isActive('/')}`}>
          <Home size={20} /> Dashboard
        </Link>
        <Link to="/owners" className={`nav-link ${isActive('/owners')}`}>
          <Users size={20} /> Owners
        </Link>
        <Link to="/expenses" className={`nav-link ${isActive('/expenses')}`}>
          <Receipt size={20} /> Expenses
        </Link>
        <Link to="/defaulters" className={`nav-link ${isActive('/defaulters')}`}>
          <AlertCircle size={20} /> Defaulters
        </Link>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/owners" element={<Owners />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/defaulters" element={<Defaulters />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
