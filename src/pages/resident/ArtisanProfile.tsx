import { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, ShieldCheck, Clock, Award, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function ArtisanProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [artisan, setArtisan] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtisan = async () => {
      if (!id) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from('artisan_profiles')
        .select(`
          id,
          bio,
          skill_categories,
          average_rating,
          total_jobs_completed,
          starting_price_min,
          starting_price_max,
          trust_tier,
          verification_status,
          users (
            full_name
          )
        `)
        .eq('id', id)
        .single();
        
      if (data) {
        setArtisan({
          id: data.id,
          name: (data.users as any)?.full_name || 'Unknown Artisan',
          category: data.skill_categories?.[0] || 'general',
          distance: '1.2km', // Mock
          rating: data.average_rating || 'New',
          jobs: data.total_jobs_completed || 0,
          priceMin: data.starting_price_min ? `₦${data.starting_price_min.toLocaleString()}` : 'Ask',
          trustTier: data.trust_tier || 'new',
          verificationStatus: data.verification_status || 'unverified',
          bio: data.bio || 'This artisan hasn\'t added a bio yet.'
        });
      }

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, users!reviews_reviewer_id_fkey(full_name)')
        .eq('artisan_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reviewsData) {
        setReviews(reviewsData.map(r => ({
          id: r.id,
          author: (r.users as any)?.full_name || 'Anonymous',
          rating: r.rating,
          date: new Date(r.created_at).toLocaleDateString(),
          text: r.comment || ''
        })));
      }

      setLoading(false);
    };

    fetchArtisan();
  }, [id]);

  const getTrustBadge = (tier: string) => {
    switch (tier) {
      case 'pro': return <div className="flex items-center gap-1 bg-[#1b4f63] text-white px-2 py-1 rounded text-[10px] font-bold uppercase"><ShieldCheck className="w-3 h-3" /> Triid Pro</div>;
      case 'trusted': return <div className="flex items-center gap-1 bg-surface-variant text-on-surface px-2 py-1 rounded text-[10px] font-bold uppercase"><Award className="w-3 h-3" /> Trusted</div>;
      default: return null;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!artisan) {
    return <div className="min-h-screen flex items-center justify-center">Artisan not found</div>;
  }

  return (
    <div className="min-h-screen bg-surface-bright flex flex-col font-sans">
      <header className="px-space-6 py-space-4 flex justify-between items-center bg-white border-b border-surface-variant sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-primary">Profile</span>
        <div className="w-9" />
      </header>

      <main className="flex-1 overflow-y-auto">
        {/* Profile Header */}
        <section className="bg-white px-space-6 py-space-8 border-b border-surface-variant text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-surface-variant rounded-full flex-shrink-0 relative overflow-hidden mb-space-4 border-4 border-white shadow-sm">
            <div className="absolute inset-0 bg-primary/5 flex items-center justify-center font-bold text-3xl text-primary capitalize">
              {artisan.name.charAt(0)}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-1 justify-center">
            <h1 className="text-2xl font-bold text-primary">{artisan.name}</h1>
            {artisan.verificationStatus === 'verified' && (
              <div className="flex items-center gap-1 text-[#22c55e] text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> ID Verified
              </div>
            )}
          </div>
          <p className="text-sm font-semibold text-[#1b4f63] uppercase tracking-wider mb-space-3">{artisan.category}</p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-space-6">
            {getTrustBadge(artisan.trustTier)}
            <div className="flex items-center gap-1 text-sm font-bold text-on-surface">
              <Star className="w-4 h-4 fill-[#F2C94C] text-[#F2C94C]" />
              {artisan.rating} <span className="text-on-surface-variant font-medium text-xs ml-1">({reviews.length})</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-on-surface-variant">
              <MapPin className="w-4 h-4" /> {artisan.distance}
            </div>
          </div>

          <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
            {artisan.bio}
          </p>
        </section>

        <div className="max-w-2xl mx-auto w-full p-space-6 flex flex-col gap-space-6 pb-32">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-space-4">
            <div className="bg-white border border-surface-variant rounded-xl p-space-4 text-center shadow-sm">
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Jobs Completed</p>
              <p className="text-xl font-bold text-primary">{artisan.jobs}</p>
            </div>
            <div className="bg-white border border-surface-variant rounded-xl p-space-4 text-center shadow-sm">
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Base Pricing</p>
              <p className="text-xl font-bold text-primary">{artisan.priceMin}</p>
            </div>
          </div>

          {/* Reviews */}
          <section>
            <div className="flex justify-between items-end mb-space-4">
              <h3 className="text-lg font-bold text-primary">Recent Reviews</h3>
              <button className="text-xs font-bold text-[#2f6b80] hover:text-primary">See all</button>
            </div>
            <div className="space-y-space-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-white border border-surface-variant rounded-xl p-space-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-on-surface">{review.author}</span>
                    <span className="text-xs text-on-surface-variant font-medium">{review.date}</span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-[#F2C94C] text-[#F2C94C]' : 'text-outline-variant'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Floating Action Menu */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-variant p-space-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-2xl mx-auto flex gap-space-4">
          <button 
            onClick={() => navigate(`/resident/book/${artisan.id}`)}
            className="flex-1 bg-[#1b4f63] text-white py-4 rounded-md font-bold text-sm hover:bg-[#143b4f] transition-all shadow-md flex justify-center items-center gap-2 active:scale-95"
          >
            <Clock className="w-5 h-5" /> Schedule Maintenance
          </button>
        </div>
      </div>
    </div>
  );
}
