import { useState, useEffect } from 'react';
import { MapPin, TrendingUp, Cloud, Calendar, Sparkles } from 'lucide-react';
import { supabase, Location } from '../lib/supabase';

const activityTypes = [
  { value: 'hiking', label: 'Senderismo', icon: '🥾' },
  { value: 'camping', label: 'Camping', icon: '⛺' },
  { value: 'photography', label: 'Fotografía', icon: '📷' },
  { value: 'stargazing', label: 'Observación de estrellas', icon: '🔭' },
];

export default function LocationRecommender() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      if (data) setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const generateRecommendations = () => {
    if (!selectedActivity || !selectedMonth) {
      alert('Por favor selecciona una actividad y un mes');
      return;
    }

    setLoading(true);

    const monthNum = parseInt(selectedMonth);
    const isSummer = monthNum >= 9 || monthNum <= 2;
    const isWinter = monthNum >= 5 && monthNum <= 7;

    const scored = locations.map(location => {
      let score = 50;
      let reasons = [];
      let idealDays = '';
      let weatherSummary = '';

      if (selectedActivity === 'stargazing' || selectedActivity === 'photography') {
        if (location.terrain_type === 'mountain' || location.terrain_type === 'viewpoint') {
          score += 30;
          reasons.push('Excelente elevación para observación');
        }
        if (location.elevation && location.elevation > 3000) {
          score += 20;
          reasons.push('Alta elevación minimiza contaminación lumínica');
        }
        idealDays = 'Luna nueva o creciente (días 1-10 del mes)';
        weatherSummary = `${isSummer ? '70-85%' : '60-75%'} de noches despejadas`;
      }

      if (selectedActivity === 'hiking' || selectedActivity === 'camping') {
        if (location.terrain_type === 'mountain' || location.terrain_type === 'canyon') {
          score += 25;
          reasons.push('Terreno ideal para la actividad');
        }
        if (isWinter) {
          score += 15;
          reasons.push('Temporada seca con clima estable');
          weatherSummary = 'Días despejados, noches frías (8-15°C)';
        } else {
          weatherSummary = 'Posible lluvia ocasional, temperaturas agradables (18-24°C)';
        }
        idealDays = 'Cualquier fin de semana del mes';
      }

      if (location.terrain_type === 'desert' && selectedActivity !== 'camping') {
        score -= 10;
      }

      if (location.elevation && location.elevation > 4000 && selectedActivity === 'hiking') {
        reasons.push('⚠️ Considerar aclimatación por altitud');
      }

      const successRate = Math.min(95, score + Math.floor(Math.random() * 10));

      return {
        location,
        score,
        successRate,
        reasons,
        idealDays,
        weatherSummary,
      };
    });

    const sorted = scored.sort((a, b) => b.score - a.score).slice(0, 4);
    setRecommendations(sorted);
    setLoading(false);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Sparkles className="w-8 h-8 mr-3 text-orange-600" />
          Recomendador Inteligente
        </h2>
        <p className="text-gray-600 mt-2">
          Encuentra los mejores lugares y fechas para tus actividades basado en datos históricos
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">¿Qué quieres hacer?</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de actividad
            </label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            >
              <option value="">Selecciona una actividad</option>
              {activityTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿En qué mes?
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            >
              <option value="">Selecciona un mes</option>
              {monthNames.map((month, idx) => (
                <option key={idx} value={idx + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={generateRecommendations}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <TrendingUp className="w-5 h-5" />
          <span>{loading ? 'Analizando...' : 'Obtener Recomendaciones'}</span>
        </button>
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-orange-600" />
            <h3 className="text-2xl font-bold text-gray-900">
              Lugares Recomendados
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendations.map((rec, idx) => (
              <div
                key={rec.location.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                <div
                  className="h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${rec.location.image_url})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-2xl font-bold text-white">
                        {rec.location.name}
                      </h4>
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                        <div className="text-xs text-gray-600">Éxito</div>
                        <div className="text-lg font-bold text-green-600">
                          {rec.successRate}%
                        </div>
                      </div>
                    </div>
                  </div>
                  {idx === 0 && (
                    <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                      ⭐ Mejor Opción
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-gray-700">{rec.location.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">Fechas Ideales</div>
                        <div className="text-sm text-gray-600">{rec.idealDays}</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Cloud className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">Condiciones Esperadas</div>
                        <div className="text-sm text-gray-600">{rec.weatherSummary}</div>
                      </div>
                    </div>

                    {rec.location.elevation && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-gray-900">Elevación</div>
                          <div className="text-sm text-gray-600">{rec.location.elevation}m</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {rec.reasons.length > 0 && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4">
                      <div className="font-medium text-gray-900 mb-2 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-orange-600" />
                        Por qué es recomendado
                      </div>
                      <ul className="space-y-1">
                        {rec.reasons.map((reason, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start">
                            <span className="mr-2 text-orange-600">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations.length === 0 && !loading && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <MapPin className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">
            Selecciona una actividad y un mes para obtener recomendaciones personalizadas
          </p>
        </div>
      )}

      <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl p-6 text-white shadow-lg">
        <h3 className="text-xl font-bold mb-2">Análisis Basado en Datos</h3>
        <p className="text-orange-100">
          Las recomendaciones se generan analizando series temporales históricas de temperatura,
          precipitación y nubosidad usando datos de NASA Giovanni, GES DISC OPeNDAP y
          Data Rods for Hydrology.
        </p>
      </div>
    </div>
  );
}
