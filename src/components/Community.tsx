import { useState, useEffect } from 'react';
import { Users, Star, MessageSquare, MapPin, Calendar } from 'lucide-react';
import { supabase, Location, LocationReview } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type ReviewWithProfile = LocationReview & {
  profiles: {
    full_name: string;
    email: string;
  };
};

export default function Community() {
  const { profile } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    visitDate: '',
    weatherConditions: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedLocation]);

  const loadData = async () => {
    try {
      const { data: locData } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      if (locData) setLocations(locData);

      let query = supabase
        .from('location_reviews')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false });

      if (selectedLocation) {
        query = query.eq('location_id', selectedLocation);
      }

      const { data: reviewData } = await query;
      if (reviewData) setReviews(reviewData as ReviewWithProfile[]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile || !selectedLocation) {
      alert('Por favor selecciona un lugar');
      return;
    }

    try {
      const { error } = await supabase.from('location_reviews').insert({
        location_id: selectedLocation,
        user_id: profile.id,
        rating: formData.rating,
        comment: formData.comment,
        visit_date: formData.visitDate || null,
        weather_conditions: formData.weatherConditions || null,
        photos: [],
      });

      if (error) throw error;

      setFormData({
        rating: 5,
        comment: '',
        visitDate: '',
        weatherConditions: '',
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Error al guardar la reseña');
    }
  };

  const getLocationStats = (locationId: string) => {
    const locationReviews = reviews.filter(r => r.location_id === locationId);
    const avgRating = locationReviews.length > 0
      ? locationReviews.reduce((sum, r) => sum + r.rating, 0) / locationReviews.length
      : 0;

    return {
      count: locationReviews.length,
      avgRating: avgRating.toFixed(1),
    };
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Users className="w-8 h-8 mr-3 text-purple-600" />
          Comunidad
        </h2>
        <p className="text-gray-600 mt-2">
          Comparte experiencias y lee opiniones de otros usuarios sobre los lugares
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por lugar
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="">Todos los lugares</option>
              {locations.map(loc => {
                const stats = getLocationStats(loc.id);
                return (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({stats.count} reseñas, ⭐ {stats.avgRating})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <MessageSquare className="w-5 h-5" />
              <span>{showForm ? 'Cancelar' : 'Escribir Reseña'}</span>
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 p-6 bg-purple-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lugar *
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="">Selecciona un lugar</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calificación *
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= formData.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentario *
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                rows={4}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                placeholder="Comparte tu experiencia..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de visita
                </label>
                <input
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condiciones climáticas
                </label>
                <input
                  type="text"
                  value={formData.weatherConditions}
                  onChange={(e) => setFormData({ ...formData, weatherConditions: e.target.value })}
                  placeholder="Soleado, frío..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Publicar Reseña
            </button>
          </form>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">
            {selectedLocation
              ? 'No hay reseñas para este lugar aún. ¡Sé el primero en escribir una!'
              : 'No hay reseñas aún. ¡Comparte tu experiencia!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const location = locations.find(l => l.id === review.location_id);
            return (
              <div key={review.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {review.profiles.full_name?.[0] || review.profiles.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {review.profiles.full_name || review.profiles.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </div>
                      </div>
                    </div>

                    {location && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1 text-orange-600" />
                        {location.name}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-1">
                    {renderStars(review.rating)}
                  </div>
                </div>

                <p className="text-gray-700 mb-3">{review.comment}</p>

                <div className="flex flex-wrap gap-3 text-sm">
                  {review.visit_date && (
                    <span className="flex items-center text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      <Calendar className="w-4 h-4 mr-1" />
                      Visitado: {formatDate(review.visit_date)}
                    </span>
                  )}
                  {review.weather_conditions && (
                    <span className="flex items-center text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                      ☁️ {review.weather_conditions}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
