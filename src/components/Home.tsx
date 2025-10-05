import { useEffect, useState } from 'react';
import { Cloud, Calendar, MapPin, Users, TrendingUp, Moon } from 'lucide-react';
import { supabase, AstronomicalEvent, PlannedEvent } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type HomeProps = {
  onNavigate: (view: 'home' | 'plan' | 'recommend' | 'community' | 'stats' | 'astro') => void;
};

export default function Home({ onNavigate }: HomeProps) {
  const { profile } = useAuth();
  const [upcomingAstroEvents, setUpcomingAstroEvents] = useState<AstronomicalEvent[]>([]);
  const [upcomingPlannedEvents, setUpcomingPlannedEvents] = useState<PlannedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const now = new Date().toISOString();

      const { data: astroData } = await supabase
        .from('astronomical_events')
        .select('*')
        .gte('event_date', now)
        .order('event_date', { ascending: true })
        .limit(3);

      if (astroData) setUpcomingAstroEvents(astroData);

      if (profile) {
        const { data: plannedData } = await supabase
          .from('planned_events')
          .select('*')
          .eq('user_id', profile.id)
          .gte('event_date', now.split('T')[0])
          .order('event_date', { ascending: true })
          .limit(3);

        if (plannedData) setUpcomingPlannedEvents(plannedData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      full_moon: '🌕',
      new_moon: '🌑',
      eclipse: '🌘',
      meteor_shower: '🌠',
      supermoon: '🌝',
    };
    return icons[type] || '🌙';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">
          Bienvenido, {profile?.full_name || 'Usuario'}
        </h2>
        <p className="text-blue-100 text-lg">
          Planifica tus actividades con predicciones climáticas inteligentes y observa eventos astronómicos únicos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => onNavigate('astro')}
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <Moon className="w-10 h-10 text-blue-600" />
            <span className="text-2xl group-hover:scale-110 transition-transform">🌙</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Eventos Astronómicos</h3>
          <p className="text-gray-600">
            Descubre lunas llenas, eclipses y lluvias de meteoros próximas
          </p>
        </button>

        <button
          onClick={() => onNavigate('plan')}
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500 text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-10 h-10 text-green-600" />
            <span className="text-2xl group-hover:scale-110 transition-transform">📅</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Planificar Evento</h3>
          <p className="text-gray-600">
            Organiza actividades con predicciones climáticas precisas
          </p>
        </button>

        <button
          onClick={() => onNavigate('recommend')}
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-500 text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <MapPin className="w-10 h-10 text-orange-600" />
            <span className="text-2xl group-hover:scale-110 transition-transform">🎯</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Recomendador Inteligente</h3>
          <p className="text-gray-600">
            Encuentra los mejores lugares y fechas para tus actividades
          </p>
        </button>

        <button
          onClick={() => onNavigate('community')}
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500 text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-10 h-10 text-purple-600" />
            <span className="text-2xl group-hover:scale-110 transition-transform">👥</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Comunidad</h3>
          <p className="text-gray-600">
            Comparte experiencias y lee opiniones de otros usuarios
          </p>
        </button>

        <button
          onClick={() => onNavigate('stats')}
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-teal-500 text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-10 h-10 text-teal-600" />
            <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Estadísticas Climáticas</h3>
          <p className="text-gray-600">
            Consulta datos históricos y patrones meteorológicos
          </p>
        </button>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl p-6 shadow-md text-white">
          <div className="flex items-center justify-between mb-4">
            <Cloud className="w-10 h-10" />
            <span className="text-2xl">☁️</span>
          </div>
          <h3 className="text-xl font-bold mb-2">Datos en Tiempo Real</h3>
          <p className="text-blue-100">
            Integrado con NASA, servicios meteorológicos y datos satelitales
          </p>
        </div>
      </div>

      {upcomingAstroEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <Moon className="w-6 h-6 mr-2 text-blue-600" />
              Próximos Eventos Astronómicos
            </h3>
            <button
              onClick={() => onNavigate('astro')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Ver todos →
            </button>
          </div>
          <div className="space-y-4">
            {upcomingAstroEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="text-4xl">{getEventIcon(event.event_type)}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{event.title}</h4>
                  <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>📅 {formatDate(event.event_date)}</span>
                    <span>👁️ Visibilidad: {event.visibility_percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingPlannedEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-green-600" />
              Tus Próximos Eventos
            </h3>
            <button
              onClick={() => onNavigate('plan')}
              className="text-green-600 hover:text-green-700 font-medium text-sm"
            >
              Ver todos →
            </button>
          </div>
          <div className="space-y-4">
            {upcomingPlannedEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-shadow"
              >
                <h4 className="font-bold text-gray-900">{event.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>📅 {formatDate(event.event_date)}</span>
                  <span className="capitalize">🎯 {event.event_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
