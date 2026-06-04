'use client';

import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';
import { 
  Plus, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  Code, 
  X, 
  ShieldCheck, 
  Edit, 
  Image as ImageIcon,
  Sparkles,
  Users,
  Rocket,
  CheckCircle2,
  Star,
  Zap,
  Clock,
  Target,
  ArrowUpRight,
  Eye,
  Send
} from 'lucide-react';
import FounderScoreCard from '../../../components/score/FounderScoreCard';
import BadgeGenerator from '../../../components/startup/BadgeGenerator';
import VerificationModal from '../../../components/VerificationModal';
import { uploadToCloudinary } from '../../../utils/cloudinary';

// Demo data for founder dashboard
const demoData = {
  analytics: {
    revenue: 45000,
    totalStartups: 1,
    totalProducts: 2,
    startupViews: 1247,
    investorInterest: 42,
    followersGained: 189,
    pitchViews: 234,
    launchPerformance: 87
  },
  startups: [
    {
      _id: '1',
      name: 'Nexus AI',
      oneLinePitch: 'AI-powered pitch deck generator for early-stage startups',
      isVerified: true
    }
  ],
  products: [
    {
      _id: '1',
      name: 'Pitch Deck Pro Template',
      description: 'Professional pitch deck template with AI-powered suggestions',
      price: 49,
      category: 'Templates',
      stock: 100,
      lowStockThreshold: 10,
      isActive: true
    },
    {
      _id: '2',
      name: 'Startup Launch Checklist',
      description: 'Complete 100-point checklist for launching your startup',
      price: 29,
      category: 'Courses',
      stock: 250,
      lowStockThreshold: 20,
      isActive: true
    }
  ],
  orders: [
    {
      _id: '1',
      productId: { name: 'Pitch Deck Pro Template' },
      userId: { name: 'Alex Morgan' },
      totalAmount: 49,
      status: 'Completed'
    },
    {
      _id: '2',
      productId: { name: 'Startup Launch Checklist' },
      userId: { name: 'Jamie Lee' },
      totalAmount: 29,
      status: 'Processing'
    }
  ]
};

const demoScoreData = {
  score: 87,
  tips: [
    'Add more traction metrics to your startup profile',
    'Upload a demo video to increase engagement',
    'Connect with more investors to expand your network'
  ]
};

const founderJourney = [
  { id: 1, title: 'Complete profile', completed: true },
  { id: 2, title: 'Add startup', completed: true },
  { id: 3, title: 'Upload pitch deck', completed: false },
  { id: 4, title: 'Connect with investors', completed: true },
  { id: 5, title: 'Launch first product', completed: true },
  { id: 6, title: 'Get verified', completed: true },
  { id: 7, title: 'Reach 1000 views', completed: false }
];

const aiInsights = [
  'Profiles with startup descriptions get 3x more investor engagement.',
  'AI startups are trending this week.',
  'Your founder score can improve by adding traction metrics.'
];

const founderActivity = [
  { 
    type: 'launch', 
    title: 'Launched Pitch Deck Pro on FounderX Shop', 
    date: new Date(Date.now() - 86400000 * 1), 
    icon: Rocket 
  },
  { 
    type: 'milestone', 
    title: 'Reached 1000 startup views', 
    date: new Date(Date.now() - 86400000 * 3), 
    icon: Target 
  },
  { 
    type: 'interest', 
    title: '42 investors showed interest in your startup', 
    date: new Date(Date.now() - 86400000 * 5), 
    icon: Users 
  },
  { 
    type: 'order', 
    title: 'New order from Alex Morgan', 
    date: new Date(Date.now() - 86400000 * 7), 
    icon: ShoppingBag 
  }
];

// Helper function to get safe image src
const getSafeImageSrc = (src) => {
  if (!src || typeof src !== "string" || src.trim() === "") return null;
  return src;
};

// Founder Journey Component
function FounderJourney() {
  const completed = founderJourney.filter(item => item.completed).length;
  const progress = Math.round((completed / founderJourney.length) * 100);
  
  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Founder Journey
        </h3>
        <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">
          {progress}% Complete
        </span>
      </div>
      
      <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="space-y-2">
        {founderJourney.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.completed ? 'bg-green-500' : 'bg-gray-200'}`}>
              {item.completed && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <span className={`text-sm ${item.completed ? 'text-muted line-through' : 'text-foreground'}`}>
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// AI Insight Panel Component
function AIInsightPanel() {
  const [currentInsight, setCurrentInsight] = useState(0);
  
  return (
    <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 to-white">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">FounderX AI Suggestions</h3>
      </div>
      
      <div className="p-4 bg-white rounded-xl border border-blue-100 mb-3">
        <p className="text-foreground">{aiInsights[currentInsight]}</p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {aiInsights.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentInsight(i)}
              className={`h-2 w-2 rounded-full transition-all ${i === currentInsight ? 'bg-primary w-4' : 'bg-gray-300'}`}
            ></button>
          ))}
        </div>
        <button className="text-primary text-sm font-medium flex items-center gap-1">
          View all insights <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// Startup Analytics Component
function StartupAnalytics({ analytics }) {
  const metricItems = [
    { icon: TrendingUp, label: 'Startup Views', value: analytics.startupViews, color: 'text-primary' },
    { icon: Users, label: 'Investor Interest', value: analytics.investorInterest, color: 'text-green-600' },
    { icon: Users, label: 'Followers', value: analytics.followersGained, color: 'text-purple-600' },
    { icon: Eye, label: 'Pitch Views', value: analytics.pitchViews, color: 'text-blue-600' },
    { icon: Zap, label: 'Launch Score', value: analytics.launchPerformance, color: 'text-yellow-600' }
  ];

  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Startup Analytics
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metricItems.map((item, i) => (
          <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
            <item.icon className={`h-5 w-5 mx-auto mb-2 ${item.color}`} />
            <div className="text-xl font-bold text-foreground">{item.value}</div>
            <div className="text-xs text-muted">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Founder Activity Feed Component
function FounderActivityFeed() {
  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Recent Activity
      </h3>
      
      <div className="space-y-3">
        {founderActivity.map((item, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
              <item.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">{item.title}</p>
              <p className="text-xs text-muted mt-1">
                {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FounderDashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(demoData);
  const [investorInterests, setInvestorInterests] = useState([]);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [scoreData, setScoreData] = useState(demoScoreData);
  const [selectedStartupForBadge, setSelectedStartupForBadge] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationTarget, setVerificationTarget] = useState({ type: 'User', id: null });
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    lowStockThreshold: '',
    startupId: '',
    images: []
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productError, setProductError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (user && token) {
      const fetchDashboardData = async () => {
        try {
          const res = await fetch(`${API_URL}/api/dashboard/founder`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const json = await res.json();
          if (json.success && json.data) {
            setData(prev => ({
              ...prev,
              startups: json.data.startups || prev.startups,
              products: json.data.products || prev.products,
              orders: json.data.orders || prev.orders,
              analytics: {
                ...prev.analytics,
                ...json.data.analytics,
                startupViews: prev.analytics.startupViews,
                followersGained: prev.analytics.followersGained,
                pitchViews: prev.analytics.pitchViews,
                launchPerformance: prev.analytics.launchPerformance
              }
            }));
          }
        } catch (err) {
          console.error('Error fetching dashboard data:', err);
        }
      };

      const fetchInvestorInterests = async () => {
        try {
          setInterestsLoading(true);
          const res = await fetch(`${API_URL}/api/videos/dashboard/investor-interests`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const json = await res.json();
          if (json.success && json.data) {
            setInvestorInterests(json.data);
            setData(prev => ({
              ...prev,
              analytics: {
                ...prev.analytics,
                investorInterest: json.data.length
              }
            }));
          }
        } catch (err) {
          console.error('Error fetching investor interests:', err);
        } finally {
          setInterestsLoading(false);
        }
      };

      fetchDashboardData();
      fetchInvestorInterests();
    }
  }, [user, token, API_URL]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'founder')) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const openNewProductModal = () => {
    const defaultStartupId = data?.startups?.[0]?._id || '';
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      lowStockThreshold: '',
      startupId: defaultStartupId,
      images: []
    });
    setProductError('');
    setProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price != null ? String(product.price) : '',
      category: product.category || '',
      stock: product.stock != null ? String(product.stock) : '',
      lowStockThreshold: product.lowStockThreshold != null ? String(product.lowStockThreshold) : '',
      startupId: product.startupId || '',
      images: product.images || []
    });
    setProductError('');
    setProductModalOpen(true);
  };

  const handleProductChange = (field, value) => {
    setProductForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const result = await uploadToCloudinary(file, 'founderx/products');
      setProductForm((prev) => ({
        ...prev,
        images: prev.images && prev.images.length > 0 ? [...prev.images, result.url] : [result.url]
      }));
    } catch (err) {
      setProductError('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();
    setSavingProduct(true);
    setProductError('');
    try {
      setProductModalOpen(false);
    } catch (err) {
      setProductError('Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-gray-500">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-heading">Founder Mission Control</h1>
            <p className="text-body mt-1">Welcome back, {user?.name}</p>
            {user && !user.isVerified && (
              <button 
                onClick={() => {
                  setVerificationTarget({ type: 'User', id: user._id });
                  setShowVerificationModal(true);
                }}
                className="mt-2 text-sm text-blue-600 hover:underline flex items-center"
              >
                <ShieldCheck className="h-4 w-4 mr-1" />
                Get Verified Founder Badge
              </button>
            )}
          </div>
          <Link href="/startups/create" className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition shadow-sm">
            <Plus className="h-5 w-5 mr-2" />
            New Startup
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 space-y-6">
             {/* Analytics Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-heading">${(data.analytics?.revenue || 0).toLocaleString()}</p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Active Startups</h3>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Package className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-heading">{data.analytics?.totalStartups || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Products</h3>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <Package className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-heading">{data.analytics?.totalProducts || 0}</p>
                </div>
             </div>
             
             <StartupAnalytics analytics={data.analytics} />
             
             {/* Investor Connection Requests */}
             <div className="bg-[#0b0f19] rounded-2xl shadow-xl border border-white/10 p-6 backdrop-blur-md relative overflow-hidden mb-6 text-slate-100">
               {/* Glass glow background effect */}
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
               
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <Users className="h-5 w-5 text-blue-400" />
                     Investor Connection Requests
                   </h2>
                   <p className="text-sm text-slate-400 mt-1">Investors who expressed interest in your FounderTV pitches.</p>
                 </div>
                 <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                   {investorInterests.length} Requests
                 </span>
               </div>

               {interestsLoading ? (
                 <div className="py-10 text-center text-slate-500 text-sm">
                   Loading connection requests...
                 </div>
               ) : investorInterests.length === 0 ? (
                 <div className="py-12 text-center rounded-xl bg-white/5 border border-dashed border-white/5">
                   <Users className="h-8 w-8 mx-auto text-slate-600 mb-3" />
                   <p className="text-slate-400 text-sm">No connection requests yet.</p>
                   <p className="text-xs text-slate-500 mt-1">Upload an engaging pitch video on FounderTV to attract VCs!</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {investorInterests.map((interest) => (
                     <div 
                       key={interest._id} 
                       className="p-5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/[0.08] transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                     >
                       <div className="space-y-2 flex-1">
                         <div className="flex items-center gap-3">
                           <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                             {interest.investorId?.name ? interest.investorId.name[0].toUpperCase() : 'I'}
                           </div>
                           <div>
                             <h4 className="font-bold text-white text-base">
                               {interest.investorId?.name || 'Accredited Investor'}
                             </h4>
                             <p className="text-xs text-blue-400 flex items-center gap-1.5 mt-0.5">
                               <span className="px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20 font-medium">
                                 {interest.investorId?.role === 'investor' ? 'Investor' : 'Accredited VC'}
                               </span>
                               <span>•</span>
                               <span>{interest.investorId?.username ? `@${interest.investorId.username}` : ''}</span>
                             </p>
                           </div>
                         </div>
                         
                         <div className="pl-0 md:pl-12 space-y-1.5">
                           <div className="text-xs text-slate-400">
                             Interested in pitch:{' '}
                             <span className="text-white font-semibold hover:text-blue-400 transition cursor-pointer">
                               {interest.videoId?.title || 'Pitch Video'}
                             </span>
                           </div>
                           
                           <blockquote className="border-l-2 border-blue-500/30 pl-3 py-1 text-sm text-slate-300 bg-white/[0.02] rounded-r-lg italic">
                             "{interest.message}"
                           </blockquote>
                         </div>
                       </div>
                       
                       <div className="flex flex-col items-end gap-3 justify-between">
                         <span className="text-xs text-slate-500">
                           {new Date(interest.createdAt).toLocaleDateString('en-US', { 
                             month: 'short', 
                             day: 'numeric',
                             year: 'numeric'
                           })}
                         </span>
                         
                         {interest.investorId?.email ? (
                           <a 
                             href={`mailto:${interest.investorId.email}?subject=FounderX Connection: ${interest.videoId?.title || 'Startup Pitch'}`}
                             className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-blue-500/20 transition duration-200"
                           >
                             <Send className="h-4 w-4 mr-2" />
                             Contact Investor
                           </a>
                         ) : (
                           <button 
                             disabled 
                             className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 bg-white/5 text-slate-400 text-sm font-semibold rounded-lg border border-white/5 cursor-not-allowed"
                           >
                             No Email Available
                           </button>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>

             <FounderActivityFeed />
          </div>
          
          <div className="space-y-6">
             <FounderScoreCard score={scoreData.score} tips={scoreData.tips} />
             <FounderJourney />
             <AIInsightPanel />
             
             {/* My Startups */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
               <h2 className="text-xl font-bold text-heading mb-6">My Startups</h2>
               <div className="space-y-4">
                 {data.startups.map((startup) => (
                   <div key={startup._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                     <div className="flex items-center">
                       <div className="h-10 w-10 bg-blue-100 rounded-lg mr-4 flex items-center justify-center text-primary font-bold">
                         {(startup.name || '?')[0]}
                       </div>
                       <div>
                         <p className="font-bold text-heading">{startup.name}</p>
                         <p className="text-sm text-body truncate w-48">{startup.oneLinePitch}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-1">
                       <button 
                         onClick={() => setSelectedStartupForBadge(startup)}
                         className="p-2 text-gray-400 hover:text-blue-600 transition"
                         title="Get Embed Badge"
                       >
                         <Code className="h-5 w-5" />
                       </button>
                       {!startup.isVerified && (
                          <button 
                            onClick={() => {
                              setVerificationTarget({ type: 'Startup', id: startup._id });
                              setShowVerificationModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-green-600 transition"
                            title="Get Verified Startup Badge"
                          >
                            <ShieldCheck className="h-5 w-5" />
                          </button>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-heading mb-6">Recent Orders</h2>
            <div className="space-y-4">
              {data.orders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-bold text-heading">{order.productId?.name || 'Unknown Product'}</p>
                    <p className="text-sm text-body">Ordered by {order.userId?.name || 'Unknown User'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">${order.totalAmount}</p>
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-heading flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                My Products
              </h2>
              <p className="text-sm text-body mt-1">Manage products linked to your startups.</p>
            </div>
            <button
              onClick={openNewProductModal}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add product
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.products.map((product) => (
              <div key={product._id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-heading line-clamp-2">{product.name}</p>
                    <p className="text-xs text-body mt-1 line-clamp-2">{product.description}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">${product.price}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Stock: {product.stock}</span>
                  <span>Threshold: {product.lowStockThreshold}</span>
                  <span className={product.isActive ? 'text-green-600' : 'text-gray-400'}>
                    {product.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => openEditProductModal(product)}
                    className="inline-flex items-center text-xs text-gray-700 hover:text-primary"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {productModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl relative">
            <button
              onClick={() => setProductModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6">
              <h3 className="text-lg font-bold text-heading mb-1">
                {editingProduct ? 'Edit product' : 'Add new product'}
              </h3>
              <p className="text-sm text-body mb-4">
                Products appear in the Shop and on your startup profiles.
              </p>
              {productError && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {productError}
                </div>
              )}
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Startup</label>
                  <select
                    value={productForm.startupId}
                    onChange={(e) => handleProductChange('startupId', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">Select startup</option>
                    {data.startups &&
                      data.startups.map((startup) => (
                        <option key={startup._id} value={startup._id}>
                          {startup.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => handleProductChange('name', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => handleProductChange('description', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => handleProductChange('price', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={productForm.category}
                      onChange={(e) => handleProductChange('category', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Images</label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-700 cursor-pointer hover:border-primary hover:text-primary">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      {uploadingImage ? 'Uploading...' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="px-3 py-2 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                    disabled={savingProduct}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="px-4 py-2 text-xs rounded-lg bg-primary text-white font-semibold hover:bg-blue-600 transition disabled:opacity-60"
                  >
                    {savingProduct ? 'Saving...' : 'Save product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Badge Modal */}
      {selectedStartupForBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setSelectedStartupForBadge(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="p-6">
              <BadgeGenerator 
                startupId={selectedStartupForBadge._id} 
                slug={selectedStartupForBadge.slug || selectedStartupForBadge._id} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      <VerificationModal 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)}
        targetType={verificationTarget.type}
        targetId={verificationTarget.id}
      />
    </div>
  );
}
