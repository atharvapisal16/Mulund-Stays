// ProfilePage.jsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Star } from 'lucide-react';
import { userAPI } from '@/services/api';
import { useAuthStore } from '@/context/authStore';
import { PageLoader } from '@/components/common/UI';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuthStore();
  const userId = id === 'me' ? me?._id : id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: () => userAPI.getPublicProfile(userId),
    select: (d) => d?.data,
    enabled: !!userId,
  });

  if (isLoading) return <PageLoader />;
  const p = id === 'me' ? me : profile;

  return (
    <div className="container-page py-12 max-w-2xl">
      <div className="card p-8 text-center">
        <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-4 border-brand-500/30 bg-brand-500/20 flex items-center justify-center">
          {p?.profilePhoto?.url
            ? <img src={p.profilePhoto.url} alt="" className="w-full h-full object-cover" />
            : <span className="text-4xl font-bold text-brand-400">{p?.fullName?.[0]}</span>
          }
        </div>
        <h1 className="text-2xl font-display font-bold text-dark-50 mb-1">{p?.fullName}</h1>
        {p?.isHost && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="badge-brand text-xs">🏠 Host</span>
            {p?.hostStats?.isSuperhost && <span className="badge-brand text-xs">⭐ Superhost</span>}
          </div>
        )}
        <p className="text-dark-400 text-sm mb-4">{p?.bio || 'No bio yet.'}</p>
        <div className="flex justify-center gap-6 text-sm text-dark-400">
          {p?.hostStats?.averageRating > 0 && (
            <div className="flex items-center gap-1"><Star size={14} className="text-amber-400" />{p.hostStats.averageRating} rating</div>
          )}
          <div className="flex items-center gap-1"><Calendar size={14} />Joined {new Date(p?.createdAt || p?.hostStats?.hostSince || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</div>
        </div>
      </div>
    </div>
  );
}
