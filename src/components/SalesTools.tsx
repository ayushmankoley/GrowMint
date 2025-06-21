import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

const tryGenerateWithFallback = async (prompt: string): Promise<string> => {
  const primaryKey = import.meta.env.VITE_GEMINI_API_KEY;
  const backupKey = import.meta.env.VITE_GEMINI_API_KEY_BACKUP;

  let attempts = 0;
  let lastError = null;

  while (attempts < 3) {
    try {
      const model = createGeminiModel(primaryKey);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      lastError = err;
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
  const [contentCache, setContentCache] = useState<{ [toolId: string]: string }>({});
  const [selectedTool, setSelectedTool] = useState('cold-email');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase.from('projects').select('id, name');
      if (error) {
        console.error('Error fetching projects:', error.message);
      } else {
        setProjects(data);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('selectedProject');
    if (saved) setSelectedProject(saved);
  }, []);

  useEffect(() => {
    setGeneratedContent(contentCache[selectedTool] || '');
    setIsGenerating(false);
  }, [selectedTool]);
  

  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('selectedProject', selectedProject);
    }
  }, [selectedProject]);

  const handleGenerate = async () => {
    if (!selectedProject) {
      alert("Please select a project first.");
      return;
    }
  
    setIsGenerating(true);
    setGeneratedContent('');
  
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', selectedProject)
      .single();
  
    if (error || !project) {
      alert("Failed to fetch project details.");
      setIsGenerating(false);
      return;
    }
  
    const tool = salesTools.find(t => t.id === selectedTool);
    let prompt = '';
  
    if (selectedTool === 'cold-email') {
      prompt = `
  Write a cold outreach email that introduces a product or service to a specific audience. 
  The goal is to generate interest or schedule a demo. 
  The email should be short, persuasive, and sound natural — not robotic or overly formal.
  
  Include the following:
  - A strong subject line that grabs attention
  - A personalized opening line that relates to the reader’s role or challenge
  - A concise explanation of what the product does and how it can help
  - 2–3 value-driven bullet points or benefits
  - A non-pushy call-to-action (such as inviting them to book a quick call or reply if interested)
  
  Keep the tone approachable and professional. 
  Make the email approximately 100–120 words long. 
  Avoid jargon, keep it human, and make it feel like it was written just for the recipient.
  
  Project Info:
  Name: ${project.name}
  Description: ${project.description || 'N/A'}
  Industry: ${project.industry || 'N/A'}
  Target Audience: ${project.target_audience || 'N/A'}
  Goals: ${project.goals || 'N/A'}
  `;
  
    } else if (selectedTool === 'pitch-deck') {
      prompt = `
  Generate a professional 10-slide pitch deck outline for a startup offering the following:
  
  Product/Service: ${project.description || 'N/A'}
  
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
  
  Audience: ${project.target_audience || 'Investors'}  
  Tone: Professional, Confident, Clear
  
  Instructions:
  - Add short bullet points under each slide for easy presentation.
  - Tailor content based on the product and goals.
  - Keep it investor-friendly and logical.
  `;
  
    } else if (selectedTool === 'call-scripts') {
      prompt = `
  Generate a sales call script for a sales representative calling a target like: ${project.target_audience || 'Startup Founder'}.
  
  The call is about introducing the following product/service:
  ${project.description || 'N/A'}
  
  The goals of the call are:
  - Introduce the product
  - Identify pain points
  - Book a follow-up demo
  
  Structure the script to include:
  - Friendly opening
  - Qualifying questions
  - Brief product pitch
  - Objection handling tips
  - Closing lines to schedule a meeting
  
  Keep it conversational, natural, and adaptable for 5–7 minute calls.
  `;
  
    } else if (selectedTool === 'linkedin-outreach') {
      prompt = `
  Generate a thoughtful LinkedIn comment and follow-up DM for engaging a ${project.target_audience || 'startup founder'}.
  
  The goal is to start a professional relationship by providing value or insight, not pitching directly.
  
  Context: The sender represents a company offering:
  ${project.description || 'N/A'}
  
  Tone: helpful, genuine, and tailored to the person’s role or content.
  
  Constraints:
  - Keep the comment under 100 words.
  - Keep the DM under 100 words.
  - Avoid sounding like a template or pitch.
  - Show real engagement and offer to continue the conversation.
  `;
  
    } else if (selectedTool === 'battlecards') {
      prompt = `
  Generate a concise sales battlecard to help a rep respond to objections when selling the following:
  
  Product: ${project.description || 'N/A'}
  Target Audience: ${project.target_audience || 'N/A'}
  
  Include:
  - Key differentiators
  - Common objections & suggested rebuttals
  - 1-line competitive positioning against top 2 competitors
  
  Tone: Sharp, persuasive, and easy to scan.
  Make it tactical and usable during live sales calls.
  `;
  
    } else {
      prompt = `
  You are an AI assistant specialized in sales enablement.
  
  Generate content using the following context:
  
  Project Name: ${project.name}
  Description: ${project.description || 'N/A'}
  Industry: ${project.industry || 'N/A'}
  Target Audience: ${project.target_audience || 'N/A'}
  Goals: ${project.goals || 'N/A'}
  
  Tool Selected: ${tool?.name || selectedTool}
  
  Instructions:
  - Output should be personalized.
  - It should align with the goals and target audience.
  - Format it for maximum clarity and effectiveness.
  
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
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Engine</h1>
        <p className="text-gray-600">AI-powered tools to convert more leads and close more deals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tool Selection */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Tool</h2>
          <div className="space-y-3">
            {salesTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedTool === tool.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
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
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg">
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

                {/* Project Dropdown */}
                <div>
                  <select
                    value={selectedProject ?? ''}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Select a project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {generatedContent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Generated Content</h4>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">Copy</span>
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                      {generatedContent}
                    </pre>
                  </div>

                  <div className="flex space-x-3">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      Use This Content
                    </button>
                    <button 
                      onClick={handleGenerate}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Generate Alternative
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Ready to Generate</h4>
                  <p className="text-gray-600 mb-6">
                    Create a project first, then generate personalized content using AI
                  </p>
                  <button
                    onClick={handleGenerate}
                    className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto"
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
