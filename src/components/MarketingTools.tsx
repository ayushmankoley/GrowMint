import React, { useState } from 'react';
import { TrendingUp, Calendar, Target, Megaphone, BarChart3, Zap, ArrowRight, Copy, RefreshCw, Globe, Mail, Repeat } from 'lucide-react';

const marketingTools = [
  {
    id: 'ad-copy',
    name: 'Ad Copy Assistant',
    description: 'Generate high-converting ad copy for Google, Meta, and LinkedIn',
    icon: TrendingUp,
    color: 'bg-pink-500',
    gradient: 'from-pink-500 to-pink-600',
    platforms: ['Google Ads', 'Meta (Facebook/Instagram)', 'LinkedIn Ads']
  },
  {
    id: 'content-calendar',
    name: 'Content Calendar Generator',
    description: 'Plan and schedule engaging content across all channels',
    icon: Calendar,
    color: 'bg-cyan-500',
    gradient: 'from-cyan-500 to-cyan-600'
  },
  {
    id: 'newsletter',
    name: 'Newsletter Wizard',
    description: 'Transform updates into conversion-optimized newsletters',
    icon: Mail,
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    id: 'landing-page',
    name: 'Landing Page Writer',
    description: 'Create compelling landing page copy that converts',
    icon: Globe,
    color: 'bg-orange-500',
    gradient: 'from-orange-500 to-orange-600'
  },
  {
    id: 'content-repurposer',
    name: 'Content Repurposer',
    description: 'Transform one piece of content into multiple formats',
    icon: Repeat,
    color: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  {
    id: 'targeting-strategy',
    name: 'Targeting Strategy',
    description: 'Identify and reach your ideal customer segments',
    icon: Target,
    color: 'bg-violet-500',
    gradient: 'from-violet-500 to-violet-600'
  },
  {
    id: 'brand-messaging',
    name: 'Brand Messaging',
    description: 'Develop consistent messaging that resonates with your audience',
    icon: Megaphone,
    color: 'bg-indigo-500',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'performance-analysis',
    name: 'Performance Analysis',
    description: 'Analyze and optimize campaign performance with AI insights',
    icon: BarChart3,
    color: 'bg-teal-500',
    gradient: 'from-teal-500 to-teal-600'
  }
];

export const MarketingTools: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState('ad-copy');
  const [selectedPlatform, setSelectedPlatform] = useState('Google Ads');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    // TODO: Implement AI content generation
    // 1. Get project context from Supabase
    // 2. Call Gemini API with context, tool type, and platform
    // 3. Generate personalized marketing content
    // 4. Save generated content to database
    setTimeout(() => {
      setGeneratedContent('// AI-generated marketing content will appear here based on your project context');
      setIsGenerating(false);
    }, 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
  };

  const currentTool = marketingTools.find(t => t.id === selectedTool);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing Engine</h1>
        <p className="text-gray-600">Scale your marketing campaigns with AI-powered content and strategy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tool Selection */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Tool</h2>
          <div className="space-y-3">
            {marketingTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedTool === tool.id
                      ? 'border-pink-500 bg-pink-50'
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
            <div className="bg-gradient-to-r from-pink-50 to-orange-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-pink-600 to-orange-600 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {currentTool?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {/* TODO: Replace with actual project context */}
                      Select a project to enable AI generation
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-pink-600 to-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-pink-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Platform Selection for Ad Copy */}
              {selectedTool === 'ad-copy' && currentTool?.platforms && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Platform
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {currentTool.platforms.map((platform) => (
                      <button
                        key={platform}
                        onClick={() => setSelectedPlatform(platform)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedPlatform === platform
                            ? 'bg-pink-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="p-6">
              {generatedContent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Generated Content</h4>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center space-x-2 text-pink-600 hover:text-pink-700 transition-colors"
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
                    <button className="flex-1 bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors">
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
                    Create a project first, then generate personalized marketing content using AI
                  </p>
                  <button
                    onClick={handleGenerate}
                    className="bg-gradient-to-r from-pink-600 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-pink-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto"
                  >
                    <span>Generate Content</span>
                    <ArrowRight className="h-5 w-5" />
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