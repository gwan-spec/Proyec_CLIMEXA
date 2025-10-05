import { useEffect, useState } from 'react';
import { Moon, Eye, MapPin, Clock, Star } from 'lucide-react';
import { supabase, AstronomicalEvent, Location } from '../lib/supabase';

export default function AstronomicalEvents() {
  const [events, setEvents] = useState<AstronomicalEvent[]>([]);
  const [locations, setLocations] = useState<Record<string, Location>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    loadEvents();
    loadLocations();
  }, [filter]);

  const loadEvents = async () => {
    try {
      let query = supabase
        .from('astronomical_events')
        .select('*')
        .order('event_date', { ascending: filter !== 'past' });

      if (filter === 'upcoming') {
        query = query.gte('event_date', new Date().toISOString());
      } else if (filter === 'past') {
        query = query.lt('event_date', new Date().toISOString());
      }

      const { data } = await query;
      if (data) setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const { data } = await supabase.from('locations').select('*');
      if (data) {
        const locMap: Record<string, Location> = {};
        data.forEach(loc => locMap[loc.id] = loc);
        setLocations(locMap);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      full_moon: '🌕',
      new_moon: '🌑',
      eclipse: '🌘',
      meteor_shower: '🌠',
      supermoon: '🌝',
      conjunction: '🪐',
    };
    return icons[type] || '🌙';
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      full_moon: 'from-yellow-400 to-orange-400',
      new_moon: 'from-gray-700 to-gray-900',
      eclipse: 'from-red-500 to-orange-600',
      meteor_shower: 'from-blue-500 to-purple-600',
      supermoon: 'from-yellow-300 to-yellow-500',
      conjunction: 'from-indigo-500 to-purple-500',
    };
    return colors[type] || 'from-blue-500 to-cyan-500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <Moon className="w-8 h-8 mr-3 text-blue-600" />
            Eventos Astronómicos
          </h2>
          <p className="text-gray-600 mt-2">
            Observa fenómenos celestes únicos con predicciones de visibilidad
          </p>
        </div>
      </div>

      <div className="flex space-x-2 bg-white rounded-lg p-1 shadow-sm w-fit">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-md transition-all ${
            filter === 'upcoming'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Próximos
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md transition-all ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded-md transition-all ${
            filter === 'past'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Pasados
        </button>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No hay eventos astronómicos registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
            >
              <div className={`bg-gradient-to-r ${getEventColor(event.event_type)} p-6 text-white`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-5xl">{getEventIcon(event.event_type)}</span>
                    <div>
                      <h3 className="text-2xl font-bold">{event.title}</h3>
                      <p className="text-white/90 text-sm mt-1 capitalize">
                        {event.event_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                    <div className="text-2xl font-bold">{event.visibility_percentage}%</div>
                    <div className="text-xs">Visibilidad</div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-700">{event.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start space-x-2">
                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Fecha y Hora</div>
                      <div className="text-gray-600">{formatDate(event.event_date)}</div>
                    </div>
                  </div>

                  {event.best_viewing_time && (
                    <div className="flex items-start space-x-2">
                      <Eye className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">Mejor Horario</div>
                        <div className="text-gray-600">{event.best_viewing_time}</div>
                      </div>
                    </div>
                  )}
                </div>

                {event.recommended_location_id && locations[event.recommended_location_id] && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">Lugar Recomendado</div>
                        <div className="text-gray-700">
                          {locations[event.recommended_location_id].name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {locations[event.recommended_location_id].description}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {event.recommendations && (
                  <div className="space-y-3">
                    {event.recommendations.items && event.recommendations.items.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <span className="mr-2">💡</span>
                          Recomendaciones
                        </h4>
                        <ul className="space-y-1">
                          {event.recommendations.items.map((item, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start">
                              <span className="mr-2 text-blue-600">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {event.recommendations.what_to_bring && event.recommendations.what_to_bring.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <span className="mr-2">🎒</span>
                          Qué Llevar
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {event.recommendations.what_to_bring.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
        <h3 className="text-xl font-bold mb-2 flex items-center">
          <Star className="w-6 h-6 mr-2" />
          Datos Astronómicos Verificados
        </h3>
        <p className="text-blue-100">
          La información de eventos astronómicos se basa en datos de NASA Worldview,
          GES DISC y sistemas de predicción de visibilidad satelital para garantizar
          observaciones óptimas.
        </p>
      </div>
    </div>
  );
}
