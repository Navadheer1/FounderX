const express = require('express');
const router = express.Router();
const axios = require('axios');

const SYSTEM_PROMPT = `You are FounderX AI, an elite high-execution startup companion, business mentor, and platform Content Assistant.

Your objective is to provide direct, actionable, and highly encouraging advice to founders, co-founders, and investors.

CORE BEHAVIORS & LIMITS:
1. **EXTREME CONCISENESS (CRITICAL)**: Normal conversational replies MUST be limited to a maximum of 3-5 short lines. Do NOT write long paragraphs. Keep layouts airy, clean, and highly readable on small mobile screens.
2. **AI Content Assistant & Milestone Enhancement**: 
   When a user requests to create a post, marketing update, startup announcement, or shares a rough startup update (e.g. "we launched our app" or "hit 10k users"), or when they have uploaded a media file (which will be detailed in their message), you MUST automatically generate a premium milestone update in the following EXACT structured format:
   
   ---START_AUTO_POST---
   TITLE: [A professional, punchy headline]
   DESCRIPTION: [A compelling, traction-focused startup description or narrative. Rewrite any rough text into a premium B2B-engaging post story]
   HASHTAGS: [3-4 startup-focused hashtags, e.g. #BuildingInPublic #Traction #FounderX]
   CTA: [A clear, high-intent call-to-action for investors, customers, or co-founders]
   IMAGE_CONCEPT: [A precise suggested image or visual concept matching the post]
   ---END_AUTO_POST---

   Ensure that when you output this block, you still precede it with a very short conversational intro (1-2 sentences maximum) and keep everything else extremely concise.
3. **FounderX Ecosystem Integration**: Guide them to native platform features and routes when appropriate:
   - Share milestones, news, and pitches: "/" (Community Feed)
   - Match with stage-appropriate angels and VCs: "/investors" (Investors Portal)
   - Showcase a 60-second elevator video pitch: "/watch" (Pitch Watch Feed)
   - Explore and create startup pages: "/startups" (Startup Directory)
   - DM collaborators, peers, and investors: "/messages" (Direct Inbox)
   - Configure credentials, bios, and pitch assets: "/profile" (Founder Profile)
4. **AI Operator Capability**: Remind them they can type simple commands like "Create my startup profile", "Create a post", or "Create startup plan" to activate the **FounderX AI Operator** which automatically collects data and operates the platform for them!

Maintain a professional, energetic, and elite startup operator persona.`;

function getLocalFallbackResponse(userPrompt) {
  const prompt = (userPrompt || '').toLowerCase();
  
  if (prompt.includes('pitch deck') || prompt.includes('pitch')) {
    return `Here is a high-execution Pitch Deck template to convince elite investors:

1. **Title Slide**: Startup name, tagline, founder names.
2. **The Problem**: What painful problem are you solving?
3. **The Solution**: Your product/service and why it's 10x better.
4. **Market Size (TAM/SAM/SOM)**: Total addressable market size.
5. **Product/Demo**: Screenshots or a 60-second video walkthrough.
6. **Business Model**: How do you make money? (e.g., SaaS subscription).
7. **Traction**: Active users, revenue, month-over-month growth.
8. **Competition**: Grid showing why you outcompete existing players.
9. **Go-To-Market**: How you will acquire customers.
10. **The Ask & Use of Funds**: How much you are raising (e.g., $500k) and where it goes.

Would you like me to help write a specific slide? Check out the /investors page to match with angels!`;
  }

  if (prompt.includes('outreach') || prompt.includes('email') || prompt.includes('investor message') || prompt.includes('outreach message')) {
    return `Here is a high-converting cold outreach email template to get VC meetings:

Subject: FounderX [Startup Name] - Solving [Problem] for [Target Market]

Hi [Investor Name],

I've been following your investments in [Industry/Space] and love your recent backing of [Portfolio Company Name].

I'm the founder of [Startup Name]. We are building a [one-sentence product description] that has achieved [mention 1-2 major traction metrics, e.g., $10k MRR / 20% MoM growth / 5,000 active users].

We are raising a [amount, e.g. $500k] seed round to expand our product team and scale customer acquisition. 

Are you open to a brief 10-minute call next Tuesday at 2 PM to see if there's a fit?

Best regards,
[Your Name]
[Startup Website / Pitch Deck Link]

Keep it under 150 words for maximum response rate. Track your investment requests on the /investors page!`;
  }

  if (prompt.includes('startup ideas') || prompt.includes('startup idea') || prompt.includes('business ideas') || prompt.includes('ideas')) {
    return `Here are 5 high-potential startup ideas for 2026:

1. **AI-Powered Local Services Matcher**: B2B platform connecting small businesses with automated quoting, scheduling, and invoicing tailored to local ordinances.
2. **Micro-SaaS for Niche Creator Economists**: A analytics tool for creators selling digital products across multiple platforms (Gumroad, Stan Store, Substack) in one dashboard.
3. **Decentralized Logistics for Small Brands**: A shared-warehousing and local delivery matching tool enabling e-commerce brands to offer same-day shipping.
4. **Automated Compliance for HealthTech Startups**: A software suite that helps early-stage apps quickly gain HIPAA/GDPR compliance.
5. **CleanTech Utility Monitor for Retail**: Real-time energy consumption analyzer helping local storefronts optimize utility bills using smart meters.

Select one and I can help you draft a business outline. Ready to launch? Create a profile on the /startups page!`;
  }

  if (prompt.includes('marketing') || prompt.includes('post') || prompt.includes('social media') || prompt.includes('content')) {
    return `Here is a high-converting marketing post formula for your social channels:

---START_AUTO_POST---
TITLE: We Solved the Biggest Pain Point in [Industry] 🚀
DESCRIPTION: Most businesses struggle with [Pain Point]. Today, we're officially launching our solution to help founders automate it in under 5 minutes. No manual setup. Just instant efficiency.
HASHTAGS: #StartupLaunch #BuildingInPublic #Efficiency #FounderX
CTA: Try it free today and see the difference. Link in bio!
IMAGE_CONCEPT: A screenshot of the dashboard showing a 10x speed boost.
---END_AUTO_POST---

Use this format on the Community Feed at / to share your milestones!`;
  }

  if (prompt.includes('business plan') || prompt.includes('plan') || prompt.includes('outline')) {
    return `Here is a comprehensive 1-Page Lean Business Plan outline:

1. **Problem**: Top 3 problems faced by your target customer.
2. **Customer Segments**: Who are your target buyers?
3. **Unique Value Proposition**: The single, clear message that states why you are different.
4. **Solution**: Top 3 features of your product.
5. **Channels**: How you will reach customers (SEO, cold ads, direct sales).
6. **Revenue Streams**: Subscriptions, transaction fees, ads.
7. **Cost Structure**: Server costs, marketing, salaries.
8. **Key Metrics**: Daily active users, customer acquisition cost, lifetime value.
9. **Unfair Advantage**: Something that cannot be easily copied.

Would you like to deep-dive into any of these sections?`;
  }

  // Default general response matching SYSTEM_PROMPT instructions
  return `Hi! I'm FounderX AI, your startup mentor. 
Whether you're looking to:
- Find investors: visit /investors
- Create/edit a startup page: visit /startups
- Write a pitch deck, outreach message, startup ideas, marketing posts, or business plan outline.

Just let me know what you need help with!`;
}

router.post('/chat', async (req, res) => {
  const { messages, userPrompt } = req.body;
  const groqKey = process.env.GROQ_API_KEY;
  const isInvalidKey = !groqKey || groqKey.trim() === '' || groqKey.includes('your_groq_api_key_here');

  if (isInvalidKey) {
    const fallbackText = getLocalFallbackResponse(userPrompt);
    return res.status(200).json({
      success: true,
      text: fallbackText,
      actions: [
        'Pitch deck template',
        'Investor outreach message',
        'Startup ideas for 2026',
        'Marketing post formula',
        'Business plan outline'
      ]
    });
  }

  try {
    // Format chat logs to OpenAI-compatible format
    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    if (Array.isArray(messages)) {
      // Map history
      const history = messages.slice(-10);
      history.forEach(msg => {
        if (msg.sender === 'ai' && msg.text) {
          formattedMessages.push({ role: 'assistant', content: msg.text });
        } else if (msg.sender === 'user' && msg.text) {
          formattedMessages.push({ role: 'user', content: msg.text });
        }
      });
    }

    if (userPrompt) {
      formattedMessages.push({ role: 'user', content: userPrompt });
    }

    console.log('Forwarding chat completions payload to Groq API...');
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 800
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    
    res.status(200).json({
      success: true,
      text: reply,
      actions: [
        'How do I find investors?',
        'Create a startup plan',
        'Explain FounderX'
      ]
    });

  } catch (error) {
    console.error('Groq Completions Error, falling back to local template response:', error.response?.data || error.message);
    const fallbackText = getLocalFallbackResponse(userPrompt);
    return res.status(200).json({
      success: true,
      text: fallbackText,
      actions: [
        'Pitch deck template',
        'Investor outreach message',
        'Startup ideas for 2026',
        'Marketing post formula',
        'Business plan outline'
      ]
    });
  }
});

module.exports = router;
