import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Users, Receipt, AlertCircle, LogIn, LogOut, KeyRound, ClipboardList } from 'lucide-react';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Owners from './pages/Owners';
import Expenses from './pages/Expenses';
import Defaulters from './pages/Defaulters';
import ActionItems from './pages/ActionItems';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';

const Sidebar = ({ isAdmin, showLogin, handleLogout, showChangePassword }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="sidebar">
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 800 }}>
        Tridev Apartment
      </h1>
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
          <AlertCircle size={20} /> Defaulters List
        </Link>
        <Link to="/actions" className={`nav-link ${isActive('/actions')}`}>
          <ClipboardList size={20} /> Action Items
        </Link>
      </div>

      <div className="nav-actions" style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {isAdmin ? (
          <>
            <button className="nav-link" onClick={showChangePassword} style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <KeyRound size={20} /> Change Password
            </button>
            <button className="nav-link" onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--danger)' }}>
              <LogOut size={20} /> Logout Admin
            </button>
          </>
        ) : (
          <button className="nav-link" onClick={showLogin} style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
            <LogIn size={20} /> Admin Login
          </button>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPwdUi, setShowPwdUi] = useState(false);

  useEffect(() => {
    // Check if logged in on load
    const token = localStorage.getItem('token');
    if (token) setIsAdmin(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAdmin(false);
  };

  return (
    <BrowserRouter>
      {showLogin && <Login onLoginSuccess={() => { setIsAdmin(true); setShowLogin(false); }} onClose={() => setShowLogin(false)} />}
      {showPwdUi && <ChangePassword onClose={() => setShowPwdUi(false)} />}

      <div className="app-container">
        <Sidebar isAdmin={isAdmin} showLogin={() => setShowLogin(true)} handleLogout={handleLogout} showChangePassword={() => setShowPwdUi(true)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard isAdmin={isAdmin} />} />
            <Route path="/owners" element={<Owners isAdmin={isAdmin} />} />
            <Route path="/expenses" element={<Expenses isAdmin={isAdmin} />} />
            <Route path="/defaulters" element={<Defaulters isAdmin={isAdmin} />} />
            <Route path="/actions" element={<ActionItems isAdmin={isAdmin} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
