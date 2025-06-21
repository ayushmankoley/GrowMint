import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, Calendar, User, TrendingUp, Target, Mail, FileText, MessageSquare, ExternalLink, Archive, Trash2, Plus, Link, Upload, AlertTriangle, ImageIcon, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'draft' | 'completed';
  created_at: string;
  updated_at: string;
  priority: 'high' | 'medium' | 'low';
  lead_source: string | null;
  progress: number;
  context_summary: string | null;
}

interface ContextFile {
  id: string;
  filename: string;
  file_type: string;
  file_size?: number;
  uploaded_at: string;
  content?: string;
  metadata?: any;
}

interface GeneratedContent {
  id: string;
  tool_type: string;
  content_type: string;
  status: 'generated' | 'customized' | 'approved';
  created_at: string;
  metadata?: any;
}

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onProjectUpdated: () => void;
  onProjectDeleted: () => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  project, 
  onProjectUpdated,
  onProjectDeleted 
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Editable fields
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  useEffect(() => {
    if (project) {
      setEditedProject({ ...project });
      fetchContextFiles();
    }
  }, [project]);

  const fetchContextFiles = async () => {
    if (!project) return;

    try {
      setLoadingContext(true);
      const { data, error } = await supabase
        .from('project_context')
        .select('*')
        .eq('project_id', project.id);

      if (error) {
        console.error('Error fetching context files:', error);
        setContextFiles([]);
        return;
      }

      console.log('Fetched context data:', data); // Debug log

      // Map the data to match our ContextFile interface
      const mappedFiles: ContextFile[] = (data || []).map((item: any) => ({
        id: item.id,
        filename: item.metadata?.name || item.metadata?.original_name || `${item.content_type} content`,
        file_type: item.content_type,
        file_size: item.metadata?.file_size || 0,
        uploaded_at: item.created_at,
        content: item.content,
        metadata: item.metadata
      }));

      console.log('Mapped context files:', mappedFiles); // Debug log
      setContextFiles(mappedFiles);
    } catch (error) {
      console.error('Error fetching context files:', error);
      setContextFiles([]);
    } finally {
      setLoadingContext(false);
    }
  };

  const handleSave = async () => {
    if (!editedProject || !user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: editedProject.name,
          description: editedProject.description,
          priority: editedProject.priority,
          status: editedProject.status,
          lead_source: editedProject.lead_source,
          progress: editedProject.progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedProject.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setIsEditing(false);
      onProjectUpdated();
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !user) return;
    
    setLoading(true);
    try {
      // Delete context files first
      await supabase
        .from('project_context')
        .delete()
        .eq('project_id', project.id);

      // Delete generated content
      await supabase
        .from('generated_content')
        .delete()
        .eq('project_id', project.id);

      // Delete project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
        .eq('user_id', user.id);

      if (error) throw error;

      onProjectDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const deleteContextFile = async (contextId: string) => {
    try {
      const { error } = await supabase
        .from('project_context')
        .delete()
        .eq('id', contextId);

      if (error) throw error;
      
      setContextFiles(prev => prev.filter(f => f.id !== contextId));
    } catch (error) {
      console.error('Error deleting context file:', error);
    }
  };

  const getContextIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <FileText className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'url':
        return <Globe className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatContent = (content: string, type: string, metadata?: any) => {
    if (!content && !metadata) return 'No content';
    
    switch (type) {
      case 'text':
        if (metadata?.preview) {
          return metadata.preview.length > 100 ? metadata.preview.substring(0, 100) + '...' : metadata.preview;
        }
        return content?.length > 100 ? content.substring(0, 100) + '...' : (content || 'No content');
      case 'url':
        if (metadata?.title) {
          return `${metadata.title} (${metadata.domain || 'Website'})`;
        }
        return metadata?.url || content || 'URL content';
      case 'document':
      case 'image':
        if (metadata?.file_size) {
          const size = metadata.file_size;
          if (size < 1024) return `${size} bytes`;
          if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
          return `${(size / (1024 * 1024)).toFixed(1)} MB`;
        }
        return metadata?.original_name || content || 'File content';
      default:
        return content || 'Unknown content';
    }
  };

  if (!isOpen || !project || !editedProject) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Project Details</h2>
              <p className="text-gray-600">View and manage your project</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProject({ ...project });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProject.name}
                    onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{project.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editedProject.description || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Project description..."
                  />
                ) : (
                  <p className="text-gray-700">{project.description || 'No description provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Source
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProject.lead_source || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, lead_source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., LinkedIn, referral, website"
                  />
                ) : (
                  <p className="text-gray-700">{project.lead_source || 'Not specified'}</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  {isEditing ? (
                    <select
                      value={editedProject.status}
                      onChange={(e) => setEditedProject({ ...editedProject, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  {isEditing ? (
                    <select
                      value={editedProject.priority}
                      onChange={(e) => setEditedProject({ ...editedProject, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
                      project.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                      project.priority === 'medium' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                      'bg-green-100 text-green-800 border-green-200'
                    }`}>
                      {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)} Priority
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress ({editedProject.progress}%)
                </label>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editedProject.progress}
                      onChange={(e) => setEditedProject({ ...editedProject, progress: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-teal-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${editedProject.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-teal-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created:</span>
                  <br />
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>
                  <br />
                  {new Date(project.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Context Files */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Context Files ({contextFiles.length})</h3>
            
            {contextFiles.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                {contextFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        file.file_type === 'text' ? 'bg-blue-100 text-blue-600' :
                        file.file_type === 'image' ? 'bg-green-100 text-green-600' :
                        file.file_type === 'document' ? 'bg-orange-100 text-orange-600' :
                        file.file_type === 'url' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {getContextIcon(file.file_type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {file.filename}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatContent(file.content || '', file.file_type, file.metadata)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Added {new Date(file.uploaded_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteContextFile(file.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p>No context files added to this project</p>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900">Danger Zone</h4>
                  <p className="text-red-700 text-sm mt-1">
                    Once you delete a project, there is no going back. This will permanently delete the project and all its associated data.
                  </p>
                  
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete Project
                    </button>
                  ) : (
                    <div className="mt-3 flex items-center space-x-2">
                      <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                      >
                        {loading ? 'Deleting...' : 'Yes, Delete Forever'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 