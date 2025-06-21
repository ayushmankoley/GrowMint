import React, { useState, useEffect } from 'react';
import {
  Repeat, Mail, Globe, SplitSquareVertical, Newspaper, Lightbulb, Zap,
  ArrowRight, Copy, RefreshCw
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';

const marketingTools = [
  {
    id: 'content-repurposer',
    name: 'Content Repurposer',
    description: 'Turn long-form content into micro-content across formats',
    icon: Repeat,
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'marketing-email',
    name: 'Marketing Email',
    description: 'Craft persuasive marketing emails that convert',
    icon: Mail,
    gradient: 'from-pink-500 to-pink-600',
  },
  {
    id: 'seo-assistant',
    name: 'SEO Assistant',
    description: 'Generate keywords, meta tags & SEO outlines',
    icon: Globe,
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'ab-test-ideas',
    name: 'A/B Test Ideas',
    description: 'Suggest A/B variations for copy, layout, and CTAs',
    icon: SplitSquareVertical,
    gradient: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 'newsletter',
    name: 'Newsletter Generator',
    description: 'Create professional, curated email newsletters',
    icon: Newspaper,
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    id: 'campaign-idea',
    name: 'Campaign Idea Generator',
    description: 'Generate creative campaign concepts with CTAs',
    icon: Lightbulb,
    gradient: 'from-orange-500 to-orange-600',
  }
];


const toolHintPlaceholder: { [key: string]: string } = {
  'content-repurposer': 'Add tone or format preferences (optional)',
  'marketing-email': 'Suggest a call-to-action or focus (optional)',
  'seo-assistant': 'Mention keywords or competitors (optional)',
  'ab-test-ideas': 'Suggest what aspect to test (e.g. CTA) (optional)',
  'newsletter': 'Add theme or topic idea (optional)',
  'campaign-idea': 'Suggest a style, target, or channel (optional)',
};

const createGeminiModel = (apiKey: string) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

const tryGenerateWithFallback = async (prompt: string): Promise<string> => {
  const primaryKey = import.meta.env.VITE_GEMINI_API_KEY;
  const backupKey = import.meta.env.VITE_GEMINI_API_KEY_BACKUP;

  let attempts = 0;
  while (attempts < 3) {
    try {
      const model = createGeminiModel(primaryKey);
      const result = await model.generateContent(prompt);
      return (await result.response).text();
    } catch {
      attempts++;
    }
  }

  const backupModel = createGeminiModel(backupKey);
  const result = await backupModel.generateContent(prompt);
  return (await result.response).text();
};

export const MarketingTools: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState('content-repurposer');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentCache, setContentCache] = useState<{ [toolId: string]: string }>({});
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [repurposeInput, setRepurposeInput] = useState('');
  const [userHint, setUserHint] = useState('');
  const [toolSpecificInput, setToolSpecificInput] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projects').select('id, name');
      if (data) setProjects(data);
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('selectedMarketingProject');
    if (saved) setSelectedProject(saved);
  }, []);

  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('selectedMarketingProject', selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    setGeneratedContent(contentCache[selectedTool] || '');
    setIsGenerating(false);
    setUserHint('');
    setRepurposeInput('');
    setToolSpecificInput('');
  }, [selectedTool]);

  const isFormValid = (): boolean => {
    if (!selectedProject) return false;
    
    switch (selectedTool) {
      case 'content-repurposer':
        return repurposeInput.trim() !== '';
      case 'seo-assistant':
      case 'ab-test-ideas':
        return toolSpecificInput.trim() !== '';
      case 'marketing-email':
      case 'newsletter':
      case 'campaign-idea':
        return true;
      default:
        return true;
    }
  };

  const getPromptForTool = (toolId: string): string => {
    const hintText = userHint ? `\n\nUser Suggestion:\n${userHint}` : '';
    const originalText = toolSpecificInput ? `\n\nOriginal Data:\n${toolSpecificInput}` : '';
  
    if (toolId === 'content-repurposer') {
      return `
  You are a senior content strategist tasked with repurposing long-form material into multi-platform assets.
  
  Transform this into:
  1. Tweet thread (3–5 tweets)
  2. LinkedIn post
  3. 100-word teaser email
  4. 3 short video titles
  
  Original Content:
  ${repurposeInput || '[No content provided]'}
  ${hintText}
  ${originalText}
  `;
    }
  
    if (toolId === 'marketing-email') {
      return `
  You are a seasoned email marketing copywriter with expertise in user-centric messaging and persuasive writing for digital products.
  
  Please write a concise, compelling marketing email with the following context:
  
  - Product: [Insert product name and a 1-line description]
  - Audience: [Insert audience type: e.g. startup founders, eCommerce brands, digital marketers]
  - Objective: [Insert goal: e.g. launch announcement, feature promotion, early access invite]
  - Tone: [Insert tone: e.g. friendly, conversational, direct, bold]
  
  The email must include:
  
  1. An eye-catching subject line under 45 characters  
  2. A relatable opening line tied to the reader’s pain point or aspiration  
  3. A 2–3 sentence paragraph introducing the product and its core value  
  4. 2–3 concise bullet points with specific benefits (avoid generalities)  
  5. A clear but soft CTA (e.g., “Check it out”, “See how it works”, “Book a quick demo”)
  
  Important guidelines:
  - Keep the email between **100–130 words max**
  - Write like a real person, not a robot — no filler, no jargon
  - Make it conversational, clean, and valuable
  
  Wrap the email with a natural tone that encourages response or curiosity.
  ${hintText}
  ${originalText}
  `;
    }
  
    if (toolId === 'seo-assistant') {
      return `
  You are a senior SEO strategist and content marketer.
  
  Your task is to analyze the provided webpage content or context and generate key SEO assets that improve discoverability, click-through rates, and on-page relevance.
  
  Please generate:
  
  1. A compelling page title (under 60 characters)  
  2. A meta description (under 155 characters)  
  3. A list of 5–7 target keywords or phrases  
  4. A short H1 headline suggestion (user-friendly, keyword-rich)  
  5. 3–5 content outline headings (H2s) for the page  
  
  Instructions:
  - Prioritize clarity, relevance, and high-intent phrasing  
  - Avoid keyword stuffing or vague suggestions  
  - Write for humans first, then optimize for search engines
  
  ${originalText || '[No original website copy provided]'}
  ${hintText}
  `;
    }
  
    if (toolId === 'ab-test-ideas') {
      return `
  You are a conversion-focused A/B testing strategist with expertise in UX, copywriting, and performance optimization.
  
  Your task is to suggest 3–5 A/B test ideas for improving user engagement, conversions, or clarity based on the provided context.
  
  Please analyze the content or product described and suggest variations for:
  
  - Headlines or CTAs
  - Button placement or styling
  - Hero section layout
  - Messaging angle
  - Offer framing or structure
  
  Each idea should be short (1–2 lines), specific, and clearly explain what is being tested and why.
  
  If original layout, copy, or call-to-action is provided, base your suggestions on that. Otherwise, infer based on common web UX patterns.
  
  Avoid generic advice — tailor suggestions to drive measurable impact.
  ${originalText || '[No layout or CTA provided]'}
  ${hintText}
  `;
    }
  
    if (toolId === 'newsletter') {
      return `
  You are an experienced content strategist and newsletter copywriter.
  
  Your task is to create a professional, engaging newsletter draft based on the following context or theme.
  
  The newsletter should include:
  
  1. A compelling subject line (under 45 characters)  
  2. An opening paragraph that hooks the reader with a relevant insight, question, or narrative (2–3 sentences)  
  3. 2–3 short content sections with subheadings (suggested topics or curated links)  
  4. A clear, friendly CTA encouraging action or engagement (e.g., “Read more”, “Try it now”, “Explore full post”)
  
  Guidelines:
  - Tone: [friendly / conversational / educational / etc.]
  - Write in a natural, approachable style — no fluff or marketing jargon  
  - Length: 150–200 words max  
  - Tailor structure and content to resonate with the audience
  
  ${hintText}
  ${originalText}
  `;
    }
  
    if (toolId === 'campaign-idea') {
      return `
  You are a creative strategist and performance marketer.
  
  Your task is to generate a high-level campaign idea for promoting a product or service to a target audience. The campaign should be creative, relevant, and aligned with marketing goals.
  
  Please provide:
  
  1. A short campaign title  
  2. A 2–3 sentence campaign concept or narrative  
  3. Suggested platform(s) or channels (e.g., Instagram, email, Google Ads, partnerships)  
  4. A key message or hook  
  5. 2–3 example CTAs aligned with the campaign style  
  6. Optional: promotional themes or content formats (e.g., short-form video, UGC, carousel post, influencer collab)
  
  Guidelines:
  - Tailor messaging to the audience and product context  
  - Make it creative but practical — it should feel actionable  
  - Avoid vague advice — make it specific and usable by a growth or marketing team
  
  ${hintText}
  ${originalText}
  `;
    }
  
    return `
  You are an AI assistant. Generate professional content for:
  Tool: ${toolId}
  Audience: marketers or startup teams
  ${hintText}
  ${originalText}
  `;
  };
  
  

  const handleGenerate = async () => {
    if (!isFormValid()) {
      return; 
    }

    setIsGenerating(true);
    setGeneratedContent('');

    const prompt = getPromptForTool(selectedTool);

    try {
      const result = await tryGenerateWithFallback(prompt);
      setGeneratedContent(result);
      setContentCache(prev => ({ ...prev, [selectedTool]: result }));
    } catch {
      alert('AI generation failed.');
    }

    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
  };

  const currentTool = marketingTools.find(t => t.id === selectedTool);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing Engine</h1>
        <p className="text-gray-600">Generate impactful marketing content using AI tools</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tool Selector */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Tool</h2>
          <div className="space-y-3">
            {marketingTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition ${
                    selectedTool === tool.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${tool.gradient}`}>
                      <Icon className="h-5 w-5 text-white" />
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

        {/* Output Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{currentTool?.name}</h3>
                    <p className="text-sm text-gray-600">
                      {selectedProject
                        ? `Project: ${projects.find(p => p.id === selectedProject)?.name}`
                        : 'Select a project to enable AI generation'}
                    </p>
                  </div>
                </div>

                <select
                  value={selectedProject ?? ''}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="" disabled>Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6">
              {/* Main Content Input Areas - Ordered properly */}
              <div className="space-y-6">
                {/* Content Repurposer - Main textarea first */}
                {selectedTool === 'content-repurposer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Paste your blog/article/script<span className='text-red-500 text-[15px] ml-1'><b>*</b></span></label>
                    <textarea
                      rows={6}
                      value={repurposeInput}
                      onChange={(e) => setRepurposeInput(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Paste long-form content here..."
                      required
                    />
                  </div>
                )}

                {/* SEO Assistant - Main textarea first */}
                {selectedTool === 'seo-assistant' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paste the original website copy or page text<span className='text-red-500 text-[15px] ml-1'><b>*</b></span>
                    </label>
                    <textarea
                      rows={4}
                      value={toolSpecificInput}
                      onChange={(e) => setToolSpecificInput(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g. Homepage paragraph or product description..."
                      required
                    />
                  </div>
                )}

                {/* A/B Test Ideas - Main textarea first */}
                {selectedTool === 'ab-test-ideas' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paste your original headline, CTA or layout info<span className='text-red-500 text-[15px] ml-1'><b>*</b></span>
                    </label>
                    <textarea
                      rows={4}
                      value={toolSpecificInput}
                      onChange={(e) => setToolSpecificInput(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g. 'Sign up today', or current form layout..."
                      required
                    />
                  </div>
                )}

                {/* Optional Suggestion Textarea - Always comes after main content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add a suggestion (optional)</label>
                  <textarea
                    rows={3}
                    value={userHint}
                    onChange={(e) => setUserHint(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder={toolHintPlaceholder[selectedTool]}
                  />
                </div>
              </div>

              {/* Generated Content Display */}
              <div className="mt-6">
                {generatedContent ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-medium text-gray-900">Generated Content</h4>
                      <div className="flex space-x-4">
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center space-x-2 text-orange-600 hover:text-orange-700"
                        >
                          <Copy className="h-4 w-4" />
                          <span className="text-sm">Copy</span>
                        </button>
                        <button
                          onClick={handleGenerate}
                          disabled={isGenerating || !isFormValid()}
                          className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Regenerate</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                        {generatedContent}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Ready to Generate</h4>
                    <p className="text-gray-600 mb-6">
                      {!selectedProject 
                        ? 'Select a project to enable AI generation'
                        : !isFormValid()
                        ? 'Fill in the required fields to generate content'
                        : 'Click generate to create your marketing content'
                      }
                    </p>
                    <div className="relative group">
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !isFormValid()}
                        className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform flex items-center space-x-2 mx-auto ${
                          isFormValid() && !isGenerating
                            ? 'bg-gradient-to-r from-orange-600 to-yellow-600 text-white hover:from-orange-700 hover:to-yellow-700 hover:scale-105'
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
                      
                      {/* Tooltip for disabled button */}
                      {!isFormValid() && !isGenerating && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          {!selectedProject ? 'Please select a project first' : 'Please fill the required fields'}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};