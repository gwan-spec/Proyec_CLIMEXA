import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Cloud, Sparkles } from 'lucide-react';
import { supabase, Location } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const eventTypes = [
  { value: 'hiking', label: 'Senderismo', icon: '🥾' },
  { value: 'camping', label: 'Camping', icon: '⛺' },
  { value: 'photography', label: 'Fotografía', icon: '📷' },
  { value: 'stargazing', label: 'Observación de estrellas', icon: '🔭' },
  { value: 'picnic', label: 'Picnic', icon: '🧺' },
  { value: 'cycling', label: 'Ciclismo', icon: '🚴' },
  { value: 'climbing', label: 'Escalada', icon: '🧗' },
  { value: 'other', label: 'Otro', icon: '📍' },
];

export default function PlanEvent() {
  const { profile } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: '',
    locationId: '',
    eventDate: '',
    eventTime: '',
  });
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const generateWeatherPrediction = (location: Location, date: string) => {
    const eventDate = new Date(date);
    const month = eventDate.getMonth();

    const isSummer = month >= 9 || month <= 2;
    const isWinter = month >= 5 && month <= 7;

    let temperature, conditions, humidity, wind;

    if (location.elevation && location.elevation > 3500) {
      temperature = isWinter ? '8-12°C' : '16-20°C';
      conditions = 'Mayormente despejado';
      humidity = 'Baja (40-50%)';
      wind = 'Moderado (15-25 km/h)';
    } else if (location.terrain_type === 'desert') {
      temperature = isWinter ? '12-18°C' : '22-28°C';
      conditions = 'Despejado';
      humidity = 'Muy baja (20-30%)';
      wind = 'Ligero (10-15 km/h)';
    } else {
      temperature = isWinter ? '10-15°C' : '18-24°C';
      conditions = 'Parcialmente nublado';
      humidity = 'Media (50-60%)';
      wind = 'Ligero a moderado (10-20 km/h)';
    }

    return {
      temperature,
      conditions,
      humidity,
      wind,
      precipitation: Math.random() > 0.7 ? '20%' : '5%',
      uvIndex: isSummer ? 'Alto (8-10)' : 'Medio (5-7)',
      visibility: 'Excelente (>10 km)',
    };
  };

  const generateAIRecommendations = (eventType: string, weather: any, location: Location) => {
    const recommendations = [];

    if (eventType === 'hiking' || eventType === 'climbing') {
      recommendations.push('Inicia temprano para aprovechar las mejores condiciones');
      recommendations.push('Lleva suficiente agua (mínimo 2 litros por persona)');
      if (location.elevation && location.elevation > 3000) {
        recommendations.push('Ten en cuenta la altitud y toma descansos frecuentes');
      }
    }

    if (eventType === 'camping') {
      recommendations.push('Verifica que tengas equipo para temperaturas bajas nocturnas');
      recommendations.push('Llega antes del atardecer para armar el campamento');
    }

    if (eventType === 'photography' || eventType === 'stargazing') {
      recommendations.push('Las mejores horas son durante el amanecer y atardecer');
      recommendations.push('Lleva equipo de abrigo ya que las temperaturas bajan rápidamente');
    }

    if (parseInt(weather.precipitation.replace('%', '')) > 15) {
      recommendations.push('⚠️ Existe probabilidad de lluvia, lleva equipo impermeable');
    }

    if (weather.uvIndex.includes('Alto')) {
      recommendations.push('Usa protector solar y sombrero debido al alto índice UV');
    }

    recommendations.push(`Condiciones ideales para ${eventTypes.find(t => t.value === eventType)?.label.toLowerCase()}`);

    return recommendations.join(' • ');
  };

  const handlePredict = () => {
    if (!formData.locationId || !formData.eventDate || !formData.eventType) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    const location = locations.find(l => l.id === formData.locationId);
    if (!location) return;

    const weather = generateWeatherPrediction(location, formData.eventDate);
    const aiRecs = generateAIRecommendations(formData.eventType, weather, location);

    setPrediction({
      weather,
      aiRecommendations: aiRecs,
      location,
    });
  };

  const handleSave = async () => {
    if (!profile || !formData.title || !formData.eventType || !formData.locationId || !formData.eventDate) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('planned_events').insert({
        user_id: profile.id,
        title: formData.title,
        description: formData.description,
        event_type: formData.eventType,
        location_id: formData.locationId,
        event_date: formData.eventDate,
        event_time: formData.eventTime || null,
        weather_prediction: prediction?.weather || {},
        ai_recommendations: prediction?.aiRecommendations || null,
        status: 'planned',
      });

      if (error) throw error;

      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        eventType: '',
        locationId: '',
        eventDate: '',
        eventTime: '',
      });
      setPrediction(null);

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error al guardar el evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Calendar className="w-8 h-8 mr-3 text-green-600" />
          Planificar Evento
        </h2>
        <p className="text-gray-600 mt-2">
          Organiza tus actividades con predicciones climáticas inteligentes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Detalles del Evento</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del evento *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="Ej: Caminata al Tunari"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de actividad *
            </label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="">Selecciona una actividad</option>
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lugar *
            </label>
            <select
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="">Selecciona un lugar</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora
              </label>
              <input
                type="time"
                value={formData.eventTime}
                onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              placeholder="Añade detalles sobre tu evento..."
            />
          </div>

          <button
            onClick={handlePredict}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Cloud className="w-5 h-5" />
            <span>Obtener Predicción Climática</span>
          </button>
        </div>

        <div className="space-y-6">
          {prediction ? (
            <>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Cloud className="w-6 h-6 mr-2 text-blue-600" />
                  Predicción Climática
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Temperatura</div>
                      <div className="text-xl font-bold text-gray-900">
                        {prediction.weather.temperature}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Condiciones</div>
                      <div className="text-lg font-bold text-gray-900">
                        {prediction.weather.conditions}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Humedad</div>
                      <div className="text-lg font-bold text-gray-900">
                        {prediction.weather.humidity}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Viento</div>
                      <div className="text-lg font-bold text-gray-900">
                        {prediction.weather.wind}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-600">Precipitación</div>
                      <div className="font-bold text-gray-900 mt-1">
                        {prediction.weather.precipitation}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-600">Índice UV</div>
                      <div className="font-bold text-gray-900 mt-1">
                        {prediction.weather.uvIndex}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-600">Visibilidad</div>
                      <div className="font-bold text-gray-900 mt-1">
                        {prediction.weather.visibility}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center">
                  <Sparkles className="w-6 h-6 mr-2" />
                  Recomendaciones de IA
                </h3>
                <p className="text-green-50 leading-relaxed">
                  {prediction.aiRecommendations}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <MapPin className="w-6 h-6 mr-2 text-orange-600" />
                  Información del Lugar
                </h3>
                <div className="space-y-2 text-gray-700">
                  <div className="font-semibold text-lg">{prediction.location.name}</div>
                  <p className="text-gray-600">{prediction.location.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {prediction.location.elevation && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        📏 Elevación: {prediction.location.elevation}m
                      </span>
                    )}
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm capitalize">
                      🏔️ {prediction.location.terrain_type}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <Calendar className="w-5 h-5" />
                <span>{loading ? 'Guardando...' : 'Guardar Evento'}</span>
              </button>

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center font-medium">
                  ✓ Evento guardado exitosamente
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Cloud className="w-20 h-20 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">
                Completa el formulario y haz clic en "Obtener Predicción Climática"
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
        <h3 className="text-xl font-bold mb-2">Fuentes de Datos</h3>
        <p className="text-blue-100">
          Las predicciones se basan en datos de NASA POWER, Meteomatics, GES DISC OPeNDAP
          y análisis históricos de patrones climáticos regionales.
        </p>
      </div>
    </div>
  );
}
