import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Plus, Send, Loader2, Trash2, Edit3, 
  ChevronLeft, ChevronRight,
  Bot, Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

interface Project {
  id: string;
  name: string;
  description: string | null;
  lead_source: string | null;
  context_summary: string | null;
  priority: string;
  status: string;
}

interface ProjectContext {
  id: string;
  project_id: string;
  content_type: 'text' | 'image' | 'document' | 'url';
  content: string;
  metadata: any;
  created_at: string;
}

interface Persona {
  id: string;
  persona_name: string;
  role_title: string;
  company_or_business: string | null;
  industry: string | null;
  description: string | null;
}

interface Conversation {
  id: string;
  title: string;
  project_id: string;
  persona_id: string | null;
  created_at: string;
  updated_at: string;
  project?: Project;
  persona?: Persona;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Gemini utility functions
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
      return (await result.response).text();
    } catch {
      attempts++;
    }
  }

  const backupModel = createGeminiModel(backupKey);
  const result = await backupModel.generateContent(prompt);
  return (await result.response).text();
};

export const ContextEngine: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [projectContexts, setProjectContexts] = useState<ProjectContext[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversationTitle, setConversationTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingContext, setLoadingContext] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchPersonas();
      fetchConversations();
    }
  }, [user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const fetchProjects = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
  };

  const fetchPersonas = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_personas')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    
    if (error) {
      console.error('Error fetching personas:', error);
    } else {
      setPersonas(data || []);
      // Auto-select default persona
      const defaultPersona = data?.find(p => p.is_default);
      if (defaultPersona) {
        setSelectedPersona(defaultPersona.id);
      }
    }
  };

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          projects!conversations_project_id_fkey (
            id, name, description, lead_source, context_summary, priority, status
          ),
          user_personas!conversations_persona_id_fkey (
            id, persona_name, role_title, company_or_business, industry, description
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      const conversationsWithRelations = data?.map(conv => ({
        ...conv,
        project: conv.projects,
        persona: conv.user_personas
      })) || [];
      
      setConversations(conversationsWithRelations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
  };

  const fetchProjectContext = async (projectId: string) => {
    try {
      setLoadingContext(true);
      const { data, error } = await supabase
        .from('project_context')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setProjectContexts(data || []);
    } catch (error) {
      console.error('Error fetching project context:', error);
      setProjectContexts([]);
    } finally {
      setLoadingContext(false);
    }
  };

  const fetchProjectDetails = async (projectId: string): Promise<Project | null> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching project details:', error);
      return null;
    }
  };

  const createConversation = async () => {
    if (!user || !selectedProject || !conversationTitle.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{
          user_id: user.id,
          project_id: selectedProject,
          persona_id: selectedPersona,
          title: conversationTitle.trim()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchConversations();
      setCurrentConversation(data);
      setMessages([]);
      // Fetch project context for the new conversation
      await fetchProjectContext(selectedProject);
      setConversationTitle('');
      setIsCreatingConversation(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation. Please try again.');
    }
  };

  const updateConversationTitle = async (conversationId: string, newTitle: string) => {
    if (!user || !newTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle.trim() })
        .eq('id', conversationId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await fetchConversations();
      setEditingTitle(null);
    } catch (error) {
      console.error('Error updating conversation title:', error);
      alert('Failed to update conversation title.');
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!user) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this conversation?');
    if (!confirmDelete) return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await fetchConversations();
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation.');
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    // If conversation doesn't have project data but has project_id, fetch it
    if (conversation.project_id && !conversation.project) {
      const projectDetails = await fetchProjectDetails(conversation.project_id);
      if (projectDetails) {
        conversation.project = projectDetails;
      }
    }
    
    setCurrentConversation(conversation);
    fetchMessages(conversation.id);
    if (conversation.project_id) {
      await fetchProjectContext(conversation.project_id);
    }
  };

  const buildProjectContextString = (contexts: ProjectContext[]): string => {
    if (contexts.length === 0) return '';

    let contextString = '\nDetailed Project Context:\n';
    
    contexts.forEach((context, index) => {
      contextString += `\n--- Context Item ${index + 1} (${context.content_type.toUpperCase()}) ---\n`;
      
      if (context.content_type === 'text') {
        contextString += `Content: ${context.content}\n`;
      } else if (context.content_type === 'url' && context.metadata?.scraped_data) {
        const scraped = context.metadata.scraped_data;
        contextString += `Website: ${context.content}\n`;
        contextString += `Title: ${scraped.title || 'N/A'}\n`;
        contextString += `Summary: ${scraped.summary || 'N/A'}\n`;
        if (scraped.keyPoints && scraped.keyPoints.length > 0) {
          contextString += `Key Points: ${scraped.keyPoints.join(', ')}\n`;
        }
        if (scraped.businessInfo) {
          contextString += `Business Info: ${scraped.businessInfo}\n`;
        }
      } else if (context.content_type === 'document' || context.content_type === 'image') {
        contextString += `File: ${context.metadata?.name || 'Unknown file'}\n`;
        if (context.metadata?.original_name) {
          contextString += `Original Name: ${context.metadata.original_name}\n`;
        }
      }
    });
    
    return contextString;
  };

  const buildAIPrompt = (userMessage: string, conversation: Conversation, chatHistory: Message[]): string => {
    const project = conversation.project;
    const persona = conversation.persona;
    
    // Build persona context
    const personaContext = persona ? `
Your Role Context:
- Name: ${persona.persona_name}
- Title: ${persona.role_title}
- Company: ${persona.company_or_business || 'N/A'}
- Industry: ${persona.industry || 'N/A'}
- Description: ${persona.description || 'N/A'}

Please respond from the perspective of this role and tailor your advice accordingly.
` : '';

    // Build project context with detailed information
    const projectContextString = buildProjectContextString(projectContexts);
    
    // Handle case where project details might be missing but we have project context
    let projectContext = '';
    if (project) {
      projectContext = `
Project Overview:
- Name: ${project.name}
- Description: ${project.description || 'N/A'}
- Lead Source: ${project.lead_source || 'N/A'}
- Priority: ${project.priority}
- Status: ${project.status}
- AI Summary: ${project.context_summary || 'N/A'}

${projectContextString}
`;
    } else if (projectContexts.length > 0) {
      // If we have project context but no project details, use the context
      projectContext = `
Project Information:
- Project ID: ${conversation.project_id || 'N/A'}
- Note: Basic project details are not available, but detailed context is provided below

${projectContextString}
`;
    }

    // Determine project name for reference
    const projectName = project?.name || (projectContexts.length > 0 ? 'Project' : 'Unknown Project');

    // Build chat history
    const historyContext = chatHistory.length > 0 ? `
Previous Conversation:
${chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
` : '';

    return `
CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. You MUST ONLY use information from the provided project context below
2. DO NOT make up, invent, or hallucinate any information not explicitly provided
3. If the project context doesn't contain relevant information, say so explicitly
4. DO NOT reference any projects, companies, or details not mentioned in the context
5. ALWAYS reference the actual project name: "${projectName}"
6. Do not use em dashes (—) anywhere, use regular hyphens (-) instead
7. Do not use emojis
8. Always use a natural, human-like tone
9. Do not generate tables - use bullet points or numbered lists instead
10. Be helpful and provide actionable advice based ONLY on the provided context

You are an intelligent business advisor helping with project-related questions. You have access to specific context about this project. You must base your responses EXCLUSIVELY on the information provided below.

${personaContext}

PROJECT INFORMATION (USE ONLY THIS INFORMATION):
${projectContext}

${historyContext}

STRICT REQUIREMENT: Your response must be based entirely on the project information provided above. If the context doesn't contain enough information to answer the question, explicitly state that the available project context is insufficient.

Current User Message: ${userMessage}

Provide a response using ONLY the project information provided above. Reference the actual project name "${projectName}" and use only the details from the project context.
`;
  };

  const sendMessage = async () => {
    if (!user || !currentConversation || !newMessage.trim()) return;
    
    // Check if context is still loading
    if (loadingContext) {
      alert('Please wait for project context to load before sending a message.');
      return;
    }
    
    // Ensure project context is loaded for this conversation
    if (currentConversation.project_id && projectContexts.length === 0) {
      await fetchProjectContext(currentConversation.project_id);
    }
    
    const userMessage = newMessage.trim();
    setNewMessage('');
    setIsGenerating(true);
    
    try {
      // Save user message
      const { error: userError } = await supabase
        .from('messages')
        .insert([{
          conversation_id: currentConversation.id,
          role: 'user',
          content: userMessage
        }]);
      
      if (userError) throw userError;
      
      // Generate AI response
      const prompt = buildAIPrompt(userMessage, currentConversation, messages);
      const aiResponse = await tryGenerateWithFallback(prompt);
      
      // Save AI response
      const { error: aiError } = await supabase
        .from('messages')
        .insert([{
          conversation_id: currentConversation.id,
          role: 'assistant',
          content: aiResponse
        }]);
      
      if (aiError) throw aiError;
      
      // Refresh messages
      await fetchMessages(currentConversation.id);
      await fetchConversations(); // Update conversation list with new timestamp
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-19 h-[95vh] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Context Engine</h1>
        <p className="text-gray-600">Intelligent conversations about your projects with AI</p>
      </div>

      <div className="flex-1 flex bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} border-r border-gray-200 transition-all duration-300 overflow-hidden`}>
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setIsCreatingConversation(true)}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Conversation</span>
            </button>
          </div>

          <div className="p-4 overflow-y-auto h-full">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                      currentConversation?.id === conversation.id
                        ? 'bg-green-100 border border-green-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={async () => await selectConversation(conversation)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {editingTitle === conversation.id ? (
                          <input
                            type="text"
                            defaultValue={conversation.title}
                            className="w-full text-sm font-medium bg-transparent border-none outline-none"
                            onBlur={(e) => updateConversationTitle(conversation.id, e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateConversationTitle(conversation.id, (e.target as HTMLInputElement).value);
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.title}
                          </h4>
                        )}
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.project?.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(conversation.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTitle(conversation.id);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conversation.id);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-400 hover:text-gray-600"
              >
                {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              {currentConversation && (
                <div>
                  <h3 className="font-semibold text-gray-900">{currentConversation.title}</h3>
                  <p className="text-sm text-gray-500">
                    {currentConversation.project?.name}
                    {currentConversation.persona && ` • ${currentConversation.persona.persona_name}`}
                    {loadingContext ? ' • Loading context...' : projectContexts.length > 0 ? ` • ${projectContexts.length} context items` : ' • No context items'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef}>
            {currentConversation ? (
              <>
                {/* Context Warning */}
                {!loadingContext && projectContexts.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-400 rounded-full flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-yellow-800">No project context available</p>
                        <p className="text-xs text-yellow-700">
                          This project doesn't have any uploaded context (documents, URLs, text). 
                          The AI will provide general advice but won't have specific project details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                    <p className="text-gray-500">
                      Ask questions about your project, get strategic advice, or brainstorm ideas.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-3xl rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {message.role === 'assistant' && (
                              <Bot className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              {message.role === 'assistant' ? (
                                <div className="prose prose-sm max-w-none">
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkBreaks]}
                                    components={{
                                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                      h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-900">{children}</h1>,
                                      h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-gray-800">{children}</h2>,
                                      h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-gray-800">{children}</h3>,
                                      ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                                      li: ({ children }) => <li className="text-gray-700">{children}</li>,
                                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                      code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                                    }}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap">{message.content}</p>
                              )}
                            </div>
                            {message.role === 'assistant' && (
                              <button
                                onClick={() => copyToClipboard(message.content)}
                                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="text-xs opacity-70 mt-2">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg p-4 flex items-center space-x-2">
                          <Bot className="h-5 w-5 text-gray-500" />
                          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                          <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">
                  Choose an existing conversation or create a new one to start chatting.
                </p>
              </div>
            )}
          </div>

          {/* Input Area */}
          {currentConversation && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about your project..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={1}
                  disabled={isGenerating}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isGenerating}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Conversation Modal */}
      {isCreatingConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New Conversation</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProject ?? ''}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persona (optional)
                  </label>
                  <select
                    value={selectedPersona ?? ''}
                    onChange={(e) => setSelectedPersona(e.target.value || null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">No specific persona</option>
                    {personas.map(persona => (
                      <option key={persona.id} value={persona.id}>
                        {persona.persona_name} - {persona.role_title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conversation Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={conversationTitle}
                    onChange={(e) => setConversationTitle(e.target.value)}
                    placeholder="e.g., Pitch Questions Discussion"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={createConversation}
                  disabled={!selectedProject || !conversationTitle.trim()}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Conversation
                </button>
                <button
                  onClick={() => {
                    setIsCreatingConversation(false);
                    setConversationTitle('');
                    setSelectedProject(null);
                    setSelectedPersona(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
