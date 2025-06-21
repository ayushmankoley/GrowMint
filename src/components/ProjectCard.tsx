import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Calendar, TrendingUp, Mail, FileText, MessageSquare, Target, Clock, Edit3, Trash2, Eye, Archive, ExternalLink } from 'lucide-react';

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
  // Additional display properties
  createdAt?: string;
  lastActivity?: string;
  tools?: string[];
}

interface ProjectCardProps {
  project: Project;
  onViewDetails: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onArchive?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onViewDetails, 
  onEdit, 
  onDelete,
  onArchive 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getToolIcon = (tool: string) => {
    switch (tool.toLowerCase()) {
      case 'cold email': return <Mail className="h-4 w-4" />;
      case 'pitch deck': return <FileText className="h-4 w-4" />;
      case 'linkedin': return <MessageSquare className="h-4 w-4" />;
      case 'battlecards': return <Target className="h-4 w-4" />;
      case 'ad campaign': return <TrendingUp className="h-4 w-4" />;
      case 'content calendar': return <Calendar className="h-4 w-4" />;
      case 'call scripts': return <MessageSquare className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on dropdown or its trigger
    if ((e.target as HTMLElement).closest('.dropdown-trigger') || 
        (e.target as HTMLElement).closest('.dropdown-menu')) {
      return;
    }
    onViewDetails(project);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMenuAction = (action: () => void) => {
    action();
    setIsDropdownOpen(false);
  };

  // Use created_at and updated_at if createdAt and lastActivity are not provided
  const displayCreatedAt = project.createdAt || new Date(project.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const displayLastActivity = project.lastActivity || new Date(project.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const displayTools = project.tools || [];

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group overflow-hidden cursor-pointer relative"
      onClick={handleCardClick}
    >
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {project.description || 'No description provided'}
            </p>
          </div>
          
          {/* Dropdown Menu */}
          <div className="relative dropdown-trigger" ref={dropdownRef}>
            <button 
              onClick={handleDropdownClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => handleMenuAction(() => onViewDetails(project))}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
                
                <button
                  onClick={() => handleMenuAction(() => onEdit(project))}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Project</span>
                </button>

                <button
                  onClick={() => handleMenuAction(() => window.open(`/sales?project=${project.id}`, '_blank'))}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open in Sales</span>
                </button>

                <button
                  onClick={() => handleMenuAction(() => window.open(`/marketing?project=${project.id}`, '_blank'))}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open in Marketing</span>
                </button>

                <hr className="my-1" />

                {onArchive && (
                  <button
                    onClick={() => handleMenuAction(() => onArchive(project))}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Archive className="h-4 w-4" />
                    <span>Archive</span>
                  </button>
                )}

                <button
                  onClick={() => handleMenuAction(() => onDelete(project))}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex items-center space-x-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(project.priority)}`}>
            {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)} Priority
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Tools Used */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Active Tools</p>
          <div className="flex flex-wrap gap-2">
            {displayTools.length > 0 ? (
              displayTools.map((tool, index) => (
                <div key={index} className="flex items-center space-x-1 bg-gray-100 rounded-full px-3 py-1">
                  {getToolIcon(tool)}
                  <span className="text-xs text-gray-700">{tool}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-gray-500">No tools assigned yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Created {displayCreatedAt}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Updated {displayLastActivity}</span>
          </div>
        </div>
      </div>

      {/* Hover overlay for better UX */}
      <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"></div>
    </div>
  );
};