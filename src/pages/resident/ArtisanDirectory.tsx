import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Star, MapPin, Filter } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function ArtisanDirectory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  
  const [artisans, setArtisans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ['electrical', 'plumbing', 'generator', 'vehicle', 'hvac', 'locksmith', 'other'];

  useEffect(() => {
    const fetchArtisans = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('artisan_profiles')
        .select(`
          id,
          skill_categories,
          average_rating,
          total_jobs_completed,
          starting_price_min,
          starting_price_max,
          users (
            full_name
          )
        `);
      
      if (data) {
        setArtisans(data.map((a: any) => ({
          id: a.id,
          name: a.users?.full_name || 'Unknown Artisan',
          categories: a.skill_categories || [],
          rating: a.average_rating || 'New',
          jobs: a.total_jobs_completed || 0,
          price: a.starting_price_min ? `₦${a.starting_price_min.toLocaleString()}` : 'Ask for price',
          distance: '1.2km' // Mock distance since PostGIS queries from browser client can be complex without Edge functions
        })));
      }
      setLoading(false);
    };
    
    fetchArtisans();
  }, []);

  const filteredArtisans = artisans.filter(a => {
    if (selectedCategory && !a.categories.includes(selectedCategory)) return false;
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-surface-bright flex flex-col font-sans">
      <header className="px-space-6 py-space-4 flex justify-between items-center bg-white border-b border-surface-variant sticky top-0 z-10">
        <button onClick={() => navigate('/resident/dashboard')} className="p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-primary">Browse Artisans</span>
        <button className="p-2 -mr-2 text-on-surface-variant hover:text-primary transition-colors">
          <Filter className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 p-space-6 flex flex-col max-w-2xl mx-auto w-full gap-space-6">
        
        {/* Search & Filter */}
        <div className="space-y-space-4">
          <div className="relative">
            <Search className="w-5 h-5 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name or keyword..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white border border-surface-variant rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-space-6 px-space-6 md:mx-0 md:px-0">
            <button 
              onClick={() => setSelectedCategory('')}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${!selectedCategory ? 'bg-[#1b4f63] text-white border-[#1b4f63]' : 'bg-white text-on-surface-variant border-surface-variant hover:border-outline-variant'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold capitalize border transition-colors ${selectedCategory === cat ? 'bg-[#1b4f63] text-white border-[#1b4f63]' : 'bg-white text-on-surface-variant border-surface-variant hover:border-outline-variant'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-space-4 flex-1">
          <p className="text-sm font-bold text-on-surface-variant">{filteredArtisans.length} artisans found</p>
          
          {filteredArtisans.map(artisan => (
            <div 
              key={artisan.id}
              onClick={() => navigate(`/resident/artisan/${artisan.id}`)}
              className="bg-white border border-surface-variant rounded-xl p-space-4 flex gap-space-4 cursor-pointer hover:border-primary hover:shadow-md transition-all shadow-sm"
            >
              <div className="w-20 h-20 bg-surface-variant rounded-lg flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 flex items-center justify-center font-bold text-xl text-primary capitalize">
                  {artisan.name.charAt(0)}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-primary truncate max-w-[160px]">{artisan.name}</h3>
                  <div className="flex items-center gap-1 text-sm font-bold text-on-surface">
                    <Star className="w-4 h-4 fill-[#F2C94C] text-[#F2C94C]" />
                    {artisan.rating}
                  </div>
                </div>
                
                <p className="text-xs font-semibold text-[#1b4f63] uppercase tracking-wider mb-2">{artisan.categories?.[0] || 'Artisan'}</p>
                
                <div className="flex justify-between items-end mt-auto">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant font-medium">
                      <MapPin className="w-3.5 h-3.5" /> {artisan.distance} away
                    </div>
                    <div className="text-xs text-on-surface-variant font-medium">
                      {artisan.jobs} jobs completed
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest hidden md:block">Starting At</p>
                    <p className="font-bold text-on-surface text-sm">{artisan.price}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredArtisans.length === 0 && (
            <div className="py-space-12 text-center text-on-surface-variant">
              <Search className="w-12 h-12 outline-variant mx-auto mb-space-4 opacity-50" />
              <p className="font-medium">No artisans match your criteria.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
