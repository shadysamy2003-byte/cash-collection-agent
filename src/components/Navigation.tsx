import { NavLink } from 'react-router-dom';
import { navItems } from '../data/mockData';

const Navigation = () => {
  return (
    <nav className="space-y-6 rounded-3xl border border-slate-700/60 bg-slate-950/80 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Navigation</p>
        <p className="mt-1 text-sm text-slate-400">Core cash collection views</p>
      </div>
      <div className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
