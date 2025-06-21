import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import {
  Mail, FileText, Phone, MessageSquare, Target, Zap,
  ArrowRight, Copy, RefreshCw
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const salesTools = [
  {
    id: 'cold-email',
    name: 'Cold Email Generator',
    description: 'AI-powered personalized cold emails that convert',
    icon: Mail,
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'pitch-deck',
    name: 'Pitch Deck Generator',
    description: 'Create compelling presentations that close deals',
    icon: FileText,
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    id: 'call-scripts',
    name: 'Call Script Generator',
    description: 'Discovery and demo scripts that engage prospects',
    icon: Phone,
    color: 'bg-green-500',
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'linkedin-outreach',
    name: 'LinkedIn Outreach',
    description: 'Thoughtful comments and DMs that build relationships',
    icon: MessageSquare,
    color: 'bg-indigo-500',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'battlecards',
    name: 'Sales Battlecards',
    description: 'Competitive intelligence for handling objections',
    icon: Target,
    color: 'bg-red-500',
    gradient: 'from-red-500 to-red-600'
  }
];

// ---------- GEMINI UTILITY ----------
const createGeminiModel = (apiKey: string) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};


const tryGenerateWithFallback = async (prompt: string): Promise<string> => {
  const primaryKey = import.meta.env.VITE_GEMINI_API_KEY;
  const backupKey = import.meta.env.VITE_GEMINI_API_KEY_BACKUP;

  let attempts = 0;

  while (attempts < 3) {
    try {
      const model = createGeminiModel(primaryKey);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      console.warn(`Gemini primary key failed (attempt ${attempts + 1}):`, err);
      attempts++;
    }
  }

  try {
    console.warn('Switching to Gemini backup API key...');
    const backupModel = createGeminiModel(backupKey);
    const result = await backupModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (backupErr) {
    console.error('Backup Gemini API key also failed:', backupErr);
    throw backupErr;
  }
};

// ---------- MAIN COMPONENT ----------
export const SalesTools: React.FC = () => {
  const { user } = useAuth();
  const [contentCache, setContentCache] = useState<{ [toolId: string]: string }>({});
  const [selectedTool, setSelectedTool] = useState('cold-email');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [userHint, setUserHint] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [regenerationInstructions, setRegenerationInstructions] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user.id);
      if (error) {
        console.error('Error fetching projects:', error.message);
      } else {
        setProjects(data || []);
      }
    };
    fetchProjects();
  }, [user]);

  useEffect(() => {
    const fetchPersonas = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_personas')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      
      if (error) {
        console.error('Error fetching personas:', error.message);
      } else {
        setPersonas(data || []);
        // Auto-select default persona if exists
        const defaultPersona = data?.find(p => p.is_default);
        if (defaultPersona) {
          setSelectedPersona(defaultPersona.id);
        }
      }
    };
    fetchPersonas();
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('selectedSalesProject');
    if (saved) setSelectedProject(saved);
  }, []);

  useEffect(() => {
    setGeneratedContent(contentCache[selectedTool] || '');
    setIsGenerating(false);
    setUserHint('');
  }, [selectedTool]);
  

  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('selectedSalesProject', selectedProject);
    }
  }, [selectedProject]);

  const handleGenerate = async () => {
    if (!selectedProject || !user) {
      alert("Please select a project first.");
      return;
    }
  
    setIsGenerating(true);
    setGeneratedContent('');
  
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', selectedProject)
      .eq('user_id', user.id)
      .single();
  
    if (error || !project) {
      alert("Failed to fetch project details.");
      setIsGenerating(false);
      return;
    }

    // Fetch persona data if selected
    let personaData = null;
    if (selectedPersona) {
      const { data: persona, error: personaError } = await supabase
        .from('user_personas')
        .select('*')
        .eq('id', selectedPersona)
        .eq('user_id', user.id)
        .single();
      
      if (!personaError && persona) {
        personaData = persona;
      }
    }
  
    const tool = salesTools.find(t => t.id === selectedTool);
    const hintText = userHint ? `\n\nUser Suggestion:\n${userHint}` : '';
    
    // Build persona context
    const personaContext = personaData ? `
Your Role Context:
- Name: ${personaData.persona_name}
- Title: ${personaData.role_title}
- Company: ${personaData.company_or_business || 'N/A'}
- Industry: ${personaData.industry || 'N/A'}
- Description: ${personaData.description || 'N/A'}

Please write from the perspective of this role and tailor the content accordingly.
` : '';

    let prompt = '';
  
    if (selectedTool === 'cold-email') {
      prompt = `
GLOBAL RULES:
- Do not use em dashes (—) anywhere, use regular hyphens (-) instead
- Do not use emojis
- Always use a natural, human-like tone
- Do not hallucinate or make up information - only use the provided context
- Do not generate tables - use bullet points or numbered lists instead

Write a cold outreach email that introduces a product or service to a specific audience. 
The goal is to generate interest or schedule a demo. 
The email should be short, persuasive, and sound natural - not robotic or overly formal.

Include the following:
- A strong subject line that grabs attention
- A personalized opening line that relates to the reader's role or challenge
- A concise explanation of what the product does and how it can help
- 2-3 value-driven bullet points or benefits
- A non-pushy call-to-action (such as inviting them to book a quick call or reply if interested)

Keep the tone approachable and professional. 
Make the email approximately 100-120 words long. 
Avoid jargon, keep it human, and make it feel like it was written just for the recipient.

${personaContext}

Project Info:
Name: ${project.name}
Description: ${project.description || 'N/A'}
Lead Source: ${project.lead_source || 'N/A'}
Context Summary: ${project.context_summary || 'N/A'}
Priority: ${project.priority}
${hintText}

Please format your response in clean markdown with proper headers, bullet points, and formatting.
`;
  
    } else if (selectedTool === 'pitch-deck') {
      prompt = `
GLOBAL RULES:
- Do not use em dashes (—) anywhere, use regular hyphens (-) instead
- Do not use emojis
- Always use a natural, human-like tone
- Do not hallucinate or make up information - only use the provided context
- Do not generate tables - use bullet points or numbered lists instead

Generate a professional 10-slide pitch deck outline for a startup offering the following:

Product/Service: ${project.description || 'N/A'}

${personaContext}

The deck should include content for:  
1. Problem  
2. Solution  
3. Product Overview  
4. Market Opportunity  
5. Business Model  
6. Traction  
7. Marketing & Sales Strategy  
8. Competitive Advantage  
9. Team  
10. Ask / Funding Needs

Lead Source: ${project.lead_source || 'General audience'}  
Context: ${project.context_summary || 'Standard startup pitch'}
Tone: Professional, Confident, Clear
${hintText}

Instructions:
- Add short bullet points under each slide for easy presentation.
- Tailor content based on the product and context.
- Keep it investor-friendly and logical.

Please format your response in clean markdown with proper headers, bullet points, and formatting.
`;
  
    } else if (selectedTool === 'call-scripts') {
      prompt = `
GLOBAL RULES:
- Do not use em dashes (—) anywhere, use regular hyphens (-) instead
- Do not use emojis
- Always use a natural, human-like tone
- Do not hallucinate or make up information - only use the provided context
- Do not generate tables - use bullet points or numbered lists instead

You are a senior sales trainer creating a comprehensive sales call script.

Product/Service: ${project.description || 'N/A'}
Additional Context: ${project.context_summary || 'General sales approach'}
Lead Source: ${project.lead_source || 'Various sources'}

${personaContext}

${hintText}

Create a structured call script with the following sections:

## Basic Call Flow (5-7 minutes)

### Opening (30 seconds)
- Brief introduction and purpose
- Permission to continue
- Set expectations

### Discovery (2-3 minutes)
- Key qualifying questions
- Pain point identification
- Current situation assessment

### Presentation (2-3 minutes)
- Brief product overview
- Value proposition alignment
- Relevant benefits based on discovery

### Closing (1-2 minutes)
- Next steps proposal
- Calendar scheduling
- Follow-up confirmation

## Key Points to Cover
- [List 4-5 most important talking points]
- [Include value propositions specific to the product]
- [Mention key differentiators]

## Client Questions & Responses

### Easy Questions (Common Inquiries)
**Q:** [Typical question about pricing/features]
**A:** [Clear, confident response]

**Q:** [Question about implementation/timeline]
**A:** [Practical answer with next steps]

**Q:** [Question about company/credibility]
**A:** [Trust-building response]

### Challenging Questions (Objections & Tough Inquiries)
**Q:** [Price objection or budget concerns]
**A:** [Value-focused response with ROI emphasis]

**Q:** [Competitor comparison question]
**A:** [Diplomatic differentiation response]

**Q:** [Implementation/integration concerns]
**A:** [Risk mitigation and support emphasis]

**Q:** [Decision-making timeline pushback]
**A:** [Urgency creation without being pushy]

## Alternative Approaches
- If prospect is busy: [Quick 2-minute version]
- If highly interested: [Detailed presentation path]
- If skeptical: [Social proof and case study approach]

Keep responses conversational, natural, and adaptable. Focus on value creation and relationship building.

Please format your response in clean markdown with proper headers, bullet points, and formatting.
`;
    } else if (selectedTool === 'linkedin-outreach') {
      prompt = `
GLOBAL RULES:
- Do not use em dashes (—) anywhere, use regular hyphens (-) instead
- Do not use emojis
- Always use a natural, human-like tone
- Do not hallucinate or make up information - only use the provided context
- Do not generate tables - use bullet points or numbered lists instead

Generate a thoughtful LinkedIn comment and follow-up DM for engaging potential customers or partners.

The goal is to start a professional relationship by providing value or insight, not pitching directly.

Context: The sender represents a company offering:
${project.description || 'N/A'}

${personaContext}

Additional Context: ${project.context_summary || 'Professional networking'}
Lead Source Context: ${project.lead_source || 'LinkedIn networking'}
${hintText}

Tone: helpful, genuine, and tailored to the person's role or content.

Constraints:
- Keep the comment under 100 words.
- Keep the DM under 100 words.
- Avoid sounding like a template or pitch.
- Show real engagement and offer to continue the conversation.

Please format your response in clean markdown with proper headers, bullet points, and formatting.
`;
  
    } else if (selectedTool === 'battlecards') {
      prompt = `
GLOBAL RULES:
- Do not use em dashes (—) anywhere, use regular hyphens (-) instead
- Do not use emojis
- Always use a natural, human-like tone
- Do not hallucinate or make up information - only use the provided context
- Do not generate tables - use bullet points or numbered lists instead

Generate a concise sales battlecard to help a rep respond to objections when selling the following:

Product: ${project.description || 'N/A'}
Context: ${project.context_summary || 'General sales scenarios'}
Lead Source: ${project.lead_source || 'Various channels'}

${personaContext}

${hintText}

Include:
- Key differentiators
- Common objections & suggested rebuttals
- 1-line competitive positioning against top 2 competitors

Tone: Sharp, persuasive, and easy to scan.
Make it tactical and usable during live sales calls.

Please format your response in clean markdown with proper headers, bullet points, and formatting.
`;
  
    } else {
      prompt = `
GLOBAL RULES:
- Do not use em dashes (—) anywhere, use regular hyphens (-) instead
- Do not use emojis
- Always use a natural, human-like tone
- Do not hallucinate or make up information - only use the provided context
- Do not generate tables - use bullet points or numbered lists instead

You are an AI assistant specialized in sales enablement.

Generate content using the following context:

Project Name: ${project.name}
Description: ${project.description || 'N/A'}
Lead Source: ${project.lead_source || 'N/A'}
Context Summary: ${project.context_summary || 'N/A'}
Priority: ${project.priority}
Status: ${project.status}

${personaContext}

${hintText}

Tool Selected: ${tool?.name || selectedTool}

Instructions:
- Output should be personalized.
- It should align with the project context and lead source.
- Format it for maximum clarity and effectiveness.

Please format your response in clean markdown with proper headers, bullet points, and formatting.

Return only the generated content.
`;
    }
  
    try {
      const aiResponse = await tryGenerateWithFallback(prompt);
      setGeneratedContent(aiResponse);
      setContentCache(prev => ({ ...prev, [selectedTool]: aiResponse }));
    } catch (err) {
      alert('AI generation failed. Please try again later.');
    }
  
    setIsGenerating(false);
  };
  
  
  
  

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Engine</h1>
        <p className="text-gray-600">AI-powered tools to convert more leads and close more deals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Tool</h2>
          <div className="space-y-3">
          {salesTools.map((tool) => {
  const IconComponent = tool.icon;
  const isSelected = selectedTool === tool.id;
  return (
    <button
  key={tool.id}
  onClick={() => setSelectedTool(tool.id)}
  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
    isSelected
      ? 'bg-[#c2f2aecc] border-green-500'
      : 'bg-white border-green-400'
  }`}
>
  <div className="flex items-start space-x-3">
    <div className={`p-2 rounded-lg bg-gradient-to-r ${tool.gradient}`}>
      <IconComponent className="h-5 w-5 text-white" />
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
      <p className="text-sm text-gray-600">{tool.description}</p>
    </div>
  </div>
</button>

  );
})}

          </div>
        </div>

        {/* Content Generation */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#c2f2aecc] to-teal-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-[#4c912ecc] to-[green] rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {salesTools.find(t => t.id === selectedTool)?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedProject ? `Project: ${projects.find(p => p.id === selectedProject)?.name}` : "Select a project to enable AI generation"}
                    </p>
                  </div>
                </div>

                {/* Project and Persona Dropdowns */}
                <div className="flex space-x-3">
                  {/* Persona Dropdown */}
                  <div>
                    <select
                      value={selectedPersona ?? ''}
                      onChange={(e) => setSelectedPersona(e.target.value || null)}
                      className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#72f839cc]"
                    >
                      <option value="">Select persona (optional)</option>
                      {personas.map(persona => (
                        <option key={persona.id} value={persona.id}>
                          {persona.persona_name} - {persona.role_title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Project Dropdown */}
                  <div>
                    <select
                      value={selectedProject ?? ''}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#72f839cc]"
                    >
                      <option value="" disabled>Select a project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {/* Add suggestion input field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Add a suggestion (optional)</label>
                <textarea
                  rows={3}
                  value={userHint}
                  onChange={(e) => setUserHint(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="e.g., Make it more casual, focus on cost savings, add urgency..."
                />
              </div>

              {generatedContent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Generated Content</h4>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">{isCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkBreaks]}
                        components={{
                          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                          h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-gray-900">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-gray-800">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-medium mb-2 text-gray-800">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-700">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                          code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3">{children}</blockquote>
                        }}
                      >
                        {generatedContent}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={regenerationInstructions}
                        onChange={(e) => setRegenerationInstructions(e.target.value)}
                        placeholder="Add instructions for regeneration (e.g., make it shorter, more formal, etc.)"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <button 
                        onClick={() => {
                          // Add regeneration instructions to userHint and regenerate
                          const originalHint = userHint;
                          if (regenerationInstructions.trim()) {
                            setUserHint(regenerationInstructions);
                          }
                          handleGenerate().then(() => {
                            setUserHint(originalHint); // Restore original hint
                            setRegenerationInstructions(''); // Clear regeneration instructions
                          });
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                      >
                        Generate Alternative
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 border border-green-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-green-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Ready to Generate</h4>
                  <p className="text-gray-600 mb-6">
                    Create a project first, then generate personalized content using AI
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={!selectedProject}
                    className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform flex items-center space-x-2 mx-auto ${
                      selectedProject
                        ? 'bg-gradient-to-r from-green-500 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Content</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
