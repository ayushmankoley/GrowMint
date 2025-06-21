import React, { useState } from 'react';
import { X, Upload, FileText, Image, Users, Loader2, Globe, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { scrapeWebsite, generateContextSummary, type ScrapedContent } from '../lib/gemini';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: () => void;
}

interface ContextFile {
  id: string;
  type: 'text' | 'image' | 'document' | 'url';
  content: string;
  name: string;
  file?: File;
  scrapedData?: ScrapedContent;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onProjectCreated 
}) => {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [leadSource, setLeadSource] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [urlError, setUrlError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const newFile: ContextFile = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        content: '', // Will be filled after upload
        name: file.name,
        file
      };
      setContextFiles(prev => [...prev, newFile]);
    });
  };

  const addTextContent = () => {
    if (!textContent.trim()) return;
    
    const newContent: ContextFile = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      content: textContent,
      name: `Text content ${contextFiles.filter(f => f.type === 'text').length + 1}`
    };
    setContextFiles(prev => [...prev, newContent]);
    setTextContent('');
  };

  const addUrlContent = async () => {
    if (!urlContent.trim()) return;
    
    setIsScrapingUrl(true);
    setUrlError('');
    
    try {
      // Validate URL format
      new URL(urlContent);
      
      // Scrape the website using Gemini AI
      const scrapedData = await scrapeWebsite(urlContent);
      
      const newContent: ContextFile = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'url',
        content: urlContent,
        name: `${scrapedData.title || 'Website'} - ${scrapedData.metadata.domain}`,
        scrapedData
      };
      
      setContextFiles(prev => [...prev, newContent]);
      setUrlContent('');
      
    } catch (error) {
      console.error('Error scraping URL:', error);
      setUrlError(error instanceof Error ? error.message : 'Failed to scrape website');
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const removeContextFile = (id: string) => {
    setContextFiles(prev => prev.filter(file => file.id !== id));
  };

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `project-files/${fileName}`;

    const { error } = await supabase.storage
      .from('project-files')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a project');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // 1. Create the project in the database
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectName,
          description: description || null,
          priority: priority as 'low' | 'medium' | 'high',
          lead_source: leadSource || null,
          status: 'active',
          progress: 0
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // 2. Upload files and create context entries
      for (const contextFile of contextFiles) {
        let finalContent = contextFile.content;
        let metadata: any = {
          name: contextFile.name,
          original_name: contextFile.file?.name
        };

        // Upload files to Supabase Storage if it's a file
        if (contextFile.file) {
          try {
            finalContent = await uploadFileToSupabase(contextFile.file);
            metadata.file_size = contextFile.file.size;
          } catch (uploadError) {
            console.error('Error uploading file:', uploadError);
            continue;
          }
        }

        // For URLs, store both the URL and scraped data
        if (contextFile.type === 'url' && contextFile.scrapedData) {
          metadata = {
            ...metadata,
            scraped_data: contextFile.scrapedData,
            title: contextFile.scrapedData.title,
            summary: contextFile.scrapedData.summary,
            key_points: contextFile.scrapedData.keyPoints,
            domain: contextFile.scrapedData.metadata.domain,
            word_count: contextFile.scrapedData.metadata.wordCount,
            scraped_at: contextFile.scrapedData.metadata.scrapedAt
          };
        }

        // Insert context into database
        const { error: contextError } = await supabase
          .from('project_context')
          .insert({
            project_id: project.id,
            content_type: contextFile.type,
            content: finalContent,
            metadata
          });

        if (contextError) {
          console.error('Error saving context:', contextError);
        }
      }

      // 3. Generate AI context summary using Gemini API
      try {
        const contextSummary = await generateContextSummary({
          name: projectName,
          description: description || '',
          leadSource: leadSource || '',
          contextFiles: contextFiles
        });
        
        const { error: updateError } = await supabase
          .from('projects')
          .update({ context_summary: contextSummary })
          .eq('id', project.id);

        if (updateError) {
          console.error('Error updating context summary:', updateError);
        }
      } catch (summaryError) {
        console.error('Error generating AI summary:', summaryError);
        // Continue without AI summary - not a blocking error
      }

      // Success - close modal and refresh
      onClose();
      if (onProjectCreated) {
        onProjectCreated();
      }
      
      // Reset form
      setProjectName('');
      setDescription('');
      setPriority('medium');
      setLeadSource('');
      setContextFiles([]);
      setCurrentStep(1);

    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
            <p className="text-gray-600 mt-1">Set up AI-powered lead conversion</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isCreating}
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step <= currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  <div className="mt-2 text-xs font-medium text-center">
                    <span className={step <= currentStep ? 'text-blue-600' : 'text-gray-500'}>
                      {step === 1 ? 'Basic Info' : step === 2 ? 'Upload Context' : 'Review & Create'}
                    </span>
                  </div>
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-1 mx-4 rounded-full transition-colors ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Acme Corp Lead"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the lead or opportunity..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div>
                <label htmlFor="leadSource" className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Source
                </label>
                <input
                  type="text"
                  id="leadSource"
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value)}
                  placeholder="e.g., LinkedIn, referral, website inquiry"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>
          )}

          {/* Step 2: Upload Context */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Context Files</h3>
                <p className="text-gray-600">
                  Add LinkedIn posts, company info, PDFs, or any relevant context to power your AI tools
                </p>
              </div>

              {/* Text Content Input */}
              <div className="border border-gray-300 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-2">Add Text Content</h4>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste LinkedIn posts, bios, notes, or any text content..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addTextContent}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Text
                </button>
              </div>

              {/* URL Input */}
              <div className="border border-gray-300 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Add Website URL</h4>
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    AI-Powered
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Our AI will automatically scrape and analyze the website content to extract key business information
                </p>
                
                <div className="space-y-3">
                  <input
                    type="url"
                    value={urlContent}
                    onChange={(e) => {
                      setUrlContent(e.target.value);
                      setUrlError(''); // Clear error when user starts typing
                    }}
                    placeholder="https://company-website.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isScrapingUrl}
                  />
                  
                  {urlError && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{urlError}</span>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={addUrlContent}
                    disabled={!urlContent.trim() || isScrapingUrl}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isScrapingUrl ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Scraping Website...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4" />
                        <span>Scrape & Add URL</span>
                      </>
                    )}
                  </button>
                  
                  {isScrapingUrl && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-blue-700">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm">AI is analyzing the website content...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                  <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Screenshots</p>
                  <p className="text-xs text-gray-500 mb-3">Profile pics, company logos</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'image')}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                  >
                    Choose Images
                  </label>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Documents</p>
                  <p className="text-xs text-gray-500 mb-3">PDFs, pitch decks, brochures</p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'document')}
                    className="hidden"
                    id="doc-upload"
                  />
                  <label
                    htmlFor="doc-upload"
                    className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                  >
                    Choose Files
                  </label>
                </div>
              </div>

              {/* Added Context Files */}
              {contextFiles.length > 0 && (
                <div className="border border-gray-300 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Added Context ({contextFiles.length})</h4>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {contextFiles.map((file) => (
                      <div key={file.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 mt-0.5">
                              {file.type === 'text' && <FileText className="h-4 w-4 text-blue-600" />}
                              {file.type === 'image' && <Image className="h-4 w-4 text-green-600" />}
                              {file.type === 'document' && <Upload className="h-4 w-4 text-orange-600" />}
                              {file.type === 'url' && <Globe className="h-4 w-4 text-purple-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-medium text-gray-900 truncate">{file.name}</span>
                                {file.type === 'url' && file.scrapedData && (
                                  <span className="inline-flex items-center space-x-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex-shrink-0">
                                    <Sparkles className="h-3 w-3" />
                                    <span>AI Analyzed</span>
                                  </span>
                                )}
                              </div>
                              
                              {/* Show scraped data for URLs with better spacing */}
                              {file.type === 'url' && file.scrapedData && (
                                <div className="mt-2 space-y-2 p-3 bg-white rounded-md border border-gray-100">
                                  <p className="text-xs text-gray-600 leading-relaxed">
                                    {file.scrapedData.summary}
                                  </p>
                                  {file.scrapedData.keyPoints.length > 0 && (
                                    <div className="space-y-1">
                                      <div className="text-xs font-medium text-gray-700">Key Points:</div>
                                      <div className="flex flex-wrap gap-1">
                                        {file.scrapedData.keyPoints.slice(0, 3).map((point, index) => (
                                          <span key={index} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                                            {point.length > 25 ? `${point.substring(0, 25)}...` : point}
                                          </span>
                                        ))}
                                        {file.scrapedData.keyPoints.length > 3 && (
                                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            +{file.scrapedData.keyPoints.length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-3 text-xs text-gray-500 pt-1 border-t border-gray-100">
                                    <span>{file.scrapedData.metadata.domain}</span>
                                    <span>•</span>
                                    <span>{file.scrapedData.metadata.wordCount} words</span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Show content preview for text */}
                              {file.type === 'text' && (
                                <div className="mt-2 p-2 bg-white rounded-md border border-gray-100">
                                  <p className="text-xs text-gray-600 leading-relaxed">
                                    {file.content.length > 150 ? `${file.content.substring(0, 150)}...` : file.content}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeContextFile(file.id)}
                            className="text-red-600 hover:text-red-700 text-sm flex-shrink-0 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Pro Tip</h4>
                    <p className="text-blue-700 text-sm">
                      The more context you provide, the more personalized and effective your AI-generated content will be.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Create */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Your Project</h3>
                <p className="text-gray-600">
                  Confirm your project details and create your project
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Project Name</h4>
                  <p className="text-gray-700">{projectName || 'Not specified'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="text-gray-700">{description || 'No description provided'}</p>
                </div>

                <div className="flex space-x-6">
                  <div>
                    <h4 className="font-medium text-gray-900">Priority</h4>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      priority === 'high' ? 'bg-red-100 text-red-800' :
                      priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Lead Source</h4>
                    <p className="text-gray-700">{leadSource || 'Not specified'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Context Files</h4>
                  <p className="text-gray-700">{contextFiles.length} items added</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 rounded-full p-2">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">What happens next?</h4>
                    <ul className="text-blue-700 text-sm mt-2 space-y-1">
                      <li>• Project created in your dashboard</li>
                      <li>• Context files uploaded and processed</li>
                      <li>• AI analyzes your uploaded context</li>
                      <li>• Ready to create high-converting content</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isCreating}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isCreating}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={currentStep === 1 && !projectName.trim()}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Creating Project...</span>
                    </>
                  ) : (
                    <span>Create Project</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};