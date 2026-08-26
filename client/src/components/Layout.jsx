import { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, ScanLine, LogOut, PackageSearch, UserCog } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'New Scan', path: '/scan', icon: <ScanLine size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-navy-800 border-r border-white/5 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
            <ScanLine className="text-electric" /> LabelCheck
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-electric/20 text-electric'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-electric/20 flex items-center justify-center text-electric font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{user?.name}</p>
              <p className="text-slate-400 capitalize text-xs">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Mobile Header (minimal) */}
        <header className="md:hidden h-16 border-b border-white/5 flex items-center justify-between px-4 bg-navy-800">
           <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <ScanLine className="text-electric" size={18} /> LabelCheck
          </h1>
        </header>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
