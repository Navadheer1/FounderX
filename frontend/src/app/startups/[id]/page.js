'use client';

import { useState } from 'react';
import Navbar from '../../../components/Navbar';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  ExternalLink, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  Rocket,
  ShieldCheck,
  Zap,
  Clock,
  Eye
} from 'lucide-react';

// Demo startup data
const demoStartup = {
  _id: '1',
  name: 'Nexus AI',
  tagline: 'AI-powered pitch deck generator for early-stage startups',
  oneLinePitch: 'We help founders create professional pitch decks in minutes using AI',
  industry: 'AI/ML',
  stage: 'Seed',
  logo: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20modern%20AI%20startup%20logo%2C%20blue%20and%20white%2C%20clean%20design&image_size=square',
  verified: true,
  raisingFunds: true,
  website: 'https://nexus-ai.example.com',
  metrics: {
    followers: 1247,
    monthlyGrowth: 24,
    activeUsers: 3421,
    revenue: 45000,
    fundingRaised: 2000000,
    investorInterest: 42,
    upvotes: 892
  },
  productImages: [
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20AI%20pitch%20deck%20template%20preview%2C%20blue%20and%20white%2C%20clean%20design&image_size=square',
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20dashboard%20interface%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  ],
  features: [
    'AI-powered template suggestions',
    'Real-time pitch deck analytics',
    'Investor feedback simulator',
    'Collaboration tools for teams',
    'Export to PDF and PowerPoint'
  ],
  story: {
    problem: 'Founders spend weeks creating pitch decks that investors don\'t read',
    solution: 'AI helps create professional pitch decks in minutes, not weeks',
    vision: 'To become the standard way startups fundraise globally',
    market: '$100B+ global venture capital market',
    whyNow: 'AI technology is now advanced enough to create high-quality content automatically'
  },
  founders: [
    {
      name: 'Sarah Chen',
      role: 'CEO & Founder',
      bio: 'Ex-Google AI engineer with 10+ years of experience in machine learning',
      avatar: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20asian%20female%20founder%2C%20headshot%2C%20neutral%20background&image_size=square'
    },
    {
      name: 'James Wilson',
      role: 'CTO & Co-founder',
      bio: 'Full-stack developer and startup veteran who has built 3 previous products',
      avatar: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20white%20male%20founder%2C%20headshot%2C%20neutral%20background&image_size=square'
    }
  ],
  funding: {
    stage: 'Seed',
    seekingAmount: 2000000,
    useOfFunds: '40% Product, 30% Marketing, 30% Team'
  },
  activity: [
    { type: 'launch', title: 'Launched on Product Hunt', date: new Date(Date.now() - 86400000 * 3) },
    { type: 'funding', title: 'Raised $2M seed round', date: new Date(Date.now() - 86400000 * 30) },
    { type: 'update', title: 'Reached 1000 active users', date: new Date(Date.now() - 86400000 * 14) }
  ],
  aiInsights: {
    score: 87,
    strengths: [
      'Strong founding team with relevant experience',
      'Clear product-market fit signals',
      'Growing user base with 24% MoM growth',
      'Addressing a large and growing market'
    ],
    risks: [
      'Competition from established players',
      'Revenue still early stage',
      'Need to prove long-term retention'
    ],
    nextMoves: [
      'Focus on user retention metrics',
      'Prepare for Series A in 12-18 months',
      'Expand to enterprise customers'
    ]
  }
};

// Helper function to get safe image src
const getSafeImageSrc = (src) => {
  if (!src || typeof src !== "string" || src.trim() === "") return null;
  return src;
};

// Startup Header Component
function StartupHeader({ startup }) {
  const logoSrc = getSafeImageSrc(startup.logo);
  
  return (
    <div className="card p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="h-20 w-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-blue-50 bg-white">
          {logoSrc ? (
            <img src={logoSrc} alt={startup.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-blue-50 flex items-center justify-center text-primary font-bold text-3xl">
              {startup.name.charAt(0)}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{startup.name}</h1>
            {startup.verified && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-primary text-xs font-bold rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            )}
            {startup.raisingFunds && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
                <DollarSign className="h-3 w-3" />
                Raising Funds
              </span>
            )}
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
              {startup.stage}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
              {startup.industry}
            </span>
          </div>
          
          <p className="text-lg text-muted mb-4">{startup.tagline}</p>
          
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary flex items-center gap-1">
              <Users className="h-4 w-4" />
              Follow
            </button>
            <button className="btn-secondary flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Investor Interested
            </button>
            <a 
              href={startup.website} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-secondary flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Startup Metrics Component
function StartupMetrics({ metrics }) {
  const metricItems = [
    { icon: Users, label: 'Followers', value: metrics.followers.toLocaleString() },
    { icon: TrendingUp, label: 'Monthly Growth', value: `${metrics.monthlyGrowth}%`, color: 'text-green-600' },
    { icon: Users, label: 'Active Users', value: metrics.activeUsers.toLocaleString() },
    { icon: DollarSign, label: 'Revenue', value: `$${(metrics.revenue / 1000).toFixed(0)}K` },
    { icon: DollarSign, label: 'Funding Raised', value: `$${(metrics.fundingRaised / 1000000).toFixed(1)}M` },
    { icon: Users, label: 'Investor Interest', value: metrics.investorInterest },
    { icon: TrendingUp, label: 'Upvotes', value: metrics.upvotes.toLocaleString() }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
      {metricItems.map((item, i) => (
        <div key={i} className="card p-4 text-center">
          <item.icon className={`h-5 w-5 mx-auto mb-2 ${item.color || 'text-primary'}`} />
          <div className="text-xl font-bold text-foreground">{item.value}</div>
          <div className="text-xs text-muted">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// Product Showcase Component
function ProductShowcase({ startup }) {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Eye className="h-5 w-5 text-primary" />
        Product Showcase
      </h2>
      
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {startup.productImages.map((img, i) => {
          const imgSrc = getSafeImageSrc(img);
          return (
            <div key={i} className="rounded-xl overflow-hidden">
              {imgSrc && <img src={imgSrc} alt={`Product ${i + 1}`} className="w-full h-auto" />}
            </div>
          );
        })}
      </div>
      
      <h3 className="text-lg font-bold text-foreground mb-3">Key Features</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {startup.features.map((feature, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Startup Story Component
function StartupStory({ story }) {
  const sections = [
    { title: 'Problem', content: story.problem },
    { title: 'Solution', content: story.solution },
    { title: 'Vision', content: story.vision },
    { title: 'Market', content: story.market },
    { title: 'Why Now', content: story.whyNow }
  ];

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Startup Story</h2>
      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i}>
            <h3 className="font-bold text-foreground mb-1">{section.title}</h3>
            <p className="text-muted text-sm">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Founder Section Component
function FounderSection({ founders }) {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        Founding Team
      </h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {founders.map((founder, i) => {
          const avatarSrc = getSafeImageSrc(founder.avatar);
          return (
            <div key={i} className="p-4 bg-gray-50 rounded-xl flex items-start gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 bg-blue-50">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={founder.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary font-bold text-xl">
                    {founder.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground">{founder.name}</h4>
                <p className="text-sm text-primary font-medium mb-2">{founder.role}</p>
                <p className="text-sm text-muted">{founder.bio}</p>
                <div className="mt-3">
                  <button className="btn-secondary px-4 py-1.5 text-xs flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Message Founder
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Investor Panel Component
function InvestorPanel({ funding }) {
  return (
    <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 to-white">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        Investor Information
      </h2>
      
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-white rounded-xl">
          <div className="text-sm text-muted mb-1">Stage</div>
          <div className="text-xl font-bold text-foreground">{funding.stage}</div>
        </div>
        <div className="p-4 bg-white rounded-xl">
          <div className="text-sm text-muted mb-1">Seeking</div>
          <div className="text-xl font-bold text-primary">
            ${(funding.seekingAmount / 1000000).toFixed(1)}M
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl">
          <div className="text-sm text-muted mb-1">Use of Funds</div>
          <div className="text-sm font-medium text-foreground">{funding.useOfFunds}</div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary flex items-center gap-1">
          <Eye className="h-4 w-4" />
          View Pitch Deck
        </button>
        <button className="btn-secondary flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          Request Intro
        </button>
      </div>
    </div>
  );
}

// Startup Activity Feed Component
function StartupActivityFeed({ activity }) {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Recent Activity
      </h2>
      
      <div className="space-y-3">
        {activity.map((item, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3">
            <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {item.type === 'launch' && <Rocket className="h-4 w-4 text-purple-600" />}
                {item.type === 'funding' && <DollarSign className="h-4 w-4 text-green-600" />}
                {item.type === 'update' && <TrendingUp className="h-4 w-4 text-primary" />}
                <span className="font-medium text-foreground">{item.title}</span>
              </div>
              <div className="text-xs text-muted mt-1">
                {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// AI Startup Insights Component
function AIStartupInsights({ insights }) {
  return (
    <div className="card p-6 bg-gradient-to-br from-purple-50 to-white">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-600" />
        FounderX AI Analysis
      </h2>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
          {insights.score}
        </div>
        <div>
          <div className="text-lg font-bold text-foreground">AI Score</div>
          <div className="text-sm text-muted">Out of 100</div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <h3 className="text-sm font-bold text-green-600 mb-2 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Strengths
          </h3>
          <ul className="space-y-1">
            {insights.strengths.map((strength, i) => (
              <li key={i} className="text-sm text-muted flex items-start gap-1">
                <span className="text-green-600 mt-1">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-sm font-bold text-yellow-600 mb-2 flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            Risks
          </h3>
          <ul className="space-y-1">
            {insights.risks.map((risk, i) => (
              <li key={i} className="text-sm text-muted flex items-start gap-1">
                <span className="text-yellow-600 mt-1">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-1">
            <Zap className="h-4 w-4" />
            Next Steps
          </h3>
          <ul className="space-y-1">
            {insights.nextMoves.map((move, i) => (
              <li key={i} className="text-sm text-muted flex items-start gap-1">
                <span className="text-primary mt-1">•</span>
                {move}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function StartupDetailPage({ params }) {
  const [startup] = useState(demoStartup);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StartupHeader startup={startup} />
        <StartupMetrics metrics={startup.metrics} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ProductShowcase startup={startup} />
            <StartupStory story={startup.story} />
            <FounderSection founders={startup.founders} />
            <StartupActivityFeed activity={startup.activity} />
          </div>
          
          <div className="space-y-6">
            <InvestorPanel funding={startup.funding} />
            <AIStartupInsights insights={startup.aiInsights} />
          </div>
        </div>
      </main>
    </div>
  );
}
