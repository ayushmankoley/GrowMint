import React, { useState } from 'react';
import { Mail, FileText, Phone, MessageSquare, Target, Zap, ArrowRight, Copy, RefreshCw } from 'lucide-react';

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

export const SalesTools: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState('cold-email');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    // TODO: Implement AI content generation
    // 1. Get project context from Supabase
    // 2. Call Gemini API with context and tool type
    // 3. Generate personalized content
    // 4. Save generated content to database
    setTimeout(() => {
      setGeneratedContent('// AI-generated content will appear here based on your project context');
      setIsGenerating(false);
    }, 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {salesTools.find(t => t.id === selectedTool)?.name}
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
                  className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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