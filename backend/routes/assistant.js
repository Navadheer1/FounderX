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

router.post('/chat', async (req, res) => {
  try {
    const { messages, userPrompt } = req.body;
    
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(500).json({ success: false, error: 'Groq API Key not configured on server' });
    }

    // Format chat logs to OpenAI-compatible format
    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    if (Array.isArray(messages)) {
      // Map frontend logs (sender: 'ai' | 'user') to OpenAI roles (role: 'assistant' | 'user')
      // Cap history at last 10 messages for performance and boundary efficiency
      const history = messages.slice(-10);
      history.forEach(msg => {
        if (msg.sender === 'ai' && msg.text) {
          formattedMessages.push({ role: 'assistant', content: msg.text });
        } else if (msg.sender === 'user' && msg.text) {
          formattedMessages.push({ role: 'user', content: msg.text });
        }
      });
    }

    // Append the latest user prompt if not already present in logs
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
      // Provide dynamic quick suggestion button labels based on the context
      actions: [
        'How do I find investors?',
        'Create a startup plan',
        'Explain FounderX'
      ]
    });

  } catch (error) {
    console.error('Groq Completions Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve AI completion',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
