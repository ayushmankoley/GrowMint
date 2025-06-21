import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, TrendingUp, Mail, FileText } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectDetailsModal } from './ProjectDetailsModal';
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

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalProjects: 0,
    avgProgress: 0
  });

  // Fetch projects from Supabase
  const fetchProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
      
      // Calculate stats
      const activeCount = data?.filter(p => p.status === 'active').length || 0;
      const totalCount = data?.length || 0;
      const avgProgress = totalCount > 0 
        ? Math.round((data?.reduce((sum, p) => sum + p.progress, 0) || 0) / totalCount)
        : 0;

      setStats({
        activeProjects: activeCount,
        totalProjects: totalCount,
        avgProgress
      });

    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleProjectCreated = () => {
    fetchProjects(); // Refresh the project list
  };

  const handleProjectUpdated = () => {
    fetchProjects(); // Refresh the project list
    setIsDetailsModalOpen(false);
  };

  const handleProjectDeleted = () => {
    fetchProjects(); // Refresh the project list
    setIsDetailsModalOpen(false);
    setSelectedProject(null);
  };

  // Project card actions
  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
    );
    
    if (confirmDelete) {
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

        fetchProjects(); // Refresh the project list
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const handleArchiveProject = async (project: Project) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchProjects(); // Refresh the project list
    } catch (error) {
      console.error('Error archiving project:', error);
      alert('Failed to archive project. Please try again.');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your sales and marketing projects</p>
          </div>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>New Project</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              {stats.activeProjects === 0 ? 'No active projects' : `${stats.totalProjects - stats.activeProjects} completed`}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
              <div className="bg-teal-100 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              {stats.totalProjects === 0 ? 'Create your first project' : 'All time'}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgProgress}%</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <Mail className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              {stats.totalProjects === 0 ? 'No data yet' : 'Across all projects'}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => {
                    const created = new Date(p.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-2">New projects</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      {stats.totalProjects > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={{
                ...project,
                createdAt: new Date(project.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }),
                lastActivity: new Date(project.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }),
                tools: [] // TODO: Add tools tracking
              }}
              onViewDetails={handleViewDetails}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onArchive={handleArchiveProject}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
          </h3>
          <p className="text-gray-500 mb-4">
            {projects.length === 0 
              ? 'Create your first project to start converting leads with AI'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {projects.length === 0 && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      <ProjectDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        project={selectedProject}
        onProjectUpdated={handleProjectUpdated}
        onProjectDeleted={handleProjectDeleted}
      />
    </div>
  );
};