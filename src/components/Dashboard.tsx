import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
import AstronomicalEvents from './AstronomicalEvents';
import PlanEvent from './PlanEvent';
import LocationRecommender from './LocationRecommender';
import Community from './Community';
import Statistics from './Statistics';
import Home from './Home';

type View = 'home' | 'plan' | 'recommend' | 'community' | 'stats' | 'astro';

export default function Dashboard() {
  const { signOut, profile } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const menuItems = [
    { id: 'home' as View, label: 'Inicio', icon: '🏠' },
    { id: 'astro' as View, label: 'Eventos Astronómicos', icon: '🌙' },
    { id: 'plan' as View, label: 'Planificar Evento', icon: '📅' },
    { id: 'recommend' as View, label: 'Recomendador', icon: '🎯' },
    { id: 'community' as View, label: 'Comunidad', icon: '👥' },
    { id: 'stats' as View, label: 'Estadísticas', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">☁️</div>
              <h1 className="text-2xl font-bold text-blue-900">CLIMEXA</h1>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    currentView === item.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm text-gray-600">
                {profile?.full_name || profile?.email}
              </div>
              <button
                onClick={handleSignOut}
                className="hidden md:flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    currentView === item.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'home' && <Home onNavigate={setCurrentView} />}
        {currentView === 'astro' && <AstronomicalEvents />}
        {currentView === 'plan' && <PlanEvent />}
        {currentView === 'recommend' && <LocationRecommender />}
        {currentView === 'community' && <Community />}
        {currentView === 'stats' && <Statistics />}
      </main>
    </div>
  );
}
