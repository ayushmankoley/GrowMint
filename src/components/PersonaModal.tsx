import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, User, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Persona {
  id: string;
  persona_name: string;
  role_title: string;
  company_or_business: string | null;
  industry: string | null;
  description: string | null;
  is_default: boolean;
}

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonaCreated: () => void;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({ isOpen, onClose, onPersonaCreated }) => {
  const { user } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    persona_name: '',
    role_title: '',
    company_or_business: '',
    industry: '',
    description: '',
    is_default: false
  });

  const fetchPersonas = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_personas')
        .select('id, persona_name, role_title, company_or_business, industry, description, is_default')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPersonas(data || []);
    } catch (error) {
      console.error('Error fetching personas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPersonas();
    }
  }, [isOpen, user]);

  const resetForm = () => {
    setFormData({
      persona_name: '',
      role_title: '',
      company_or_business: '',
      industry: '',
      description: '',
      is_default: false
    });
    setIsCreating(false);
    setEditingPersona(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('User not authenticated. Please log in again.');
      return;
    }

    try {
      if (editingPersona) {
        // Update existing persona
        const { error } = await supabase
          .from('user_personas')
          .update(formData)
          .eq('id', editingPersona.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new persona
        const insertData = { ...formData, user_id: user.id };
        
        const { error } = await supabase
          .from('user_personas')
          .insert([insertData]);

        if (error) throw error;
      }

      await fetchPersonas();
      resetForm();
      onPersonaCreated();
    } catch (error) {
      console.error('Error saving persona:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to save persona: ${errorMessage}`);
    }
  };

  const handleEdit = (persona: Persona) => {
    setFormData({
      persona_name: persona.persona_name,
      role_title: persona.role_title,
      company_or_business: persona.company_or_business || '',
      industry: persona.industry || '',
      description: persona.description || '',
      is_default: persona.is_default
    });
    setEditingPersona(persona);
    setIsCreating(true);
  };

  const handleDelete = async (personaId: string) => {
    if (!user) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this persona?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('user_personas')
        .delete()
        .eq('id', personaId)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchPersonas();
    } catch (error) {
      console.error('Error deleting persona:', error);
      alert('Failed to delete persona. Please try again.');
    }
  };

  const handleSetDefault = async (personaId: string) => {
    if (!user) return;

    try {
      // First, unset all defaults
      await supabase
        .from('user_personas')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Then set the selected one as default
      const { error } = await supabase
        .from('user_personas')
        .update({ is_default: true })
        .eq('id', personaId)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchPersonas();
    } catch (error) {
      console.error('Error setting default persona:', error);
      alert('Failed to set default persona. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6" />
              <h2 className="text-2xl font-bold">My Roles & Personas</h2>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Create/Edit Form */}
          {isCreating && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingPersona ? 'Edit Persona' : 'Create New Persona'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Persona Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.persona_name}
                      onChange={(e) => setFormData({ ...formData, persona_name: e.target.value })}
                      placeholder="e.g., Corporate Dev, Cake Baker"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role/Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.role_title}
                      onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                      placeholder="e.g., Software Developer, Business Owner"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company/Business</label>
                    <input
                      type="text"
                      value={formData.company_or_business}
                      onChange={(e) => setFormData({ ...formData, company_or_business: e.target.value })}
                      placeholder="e.g., Google, Sweet Dreams Bakery"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="e.g., Technology, Food & Beverage"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your role and expertise..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="is_default" className="text-sm text-gray-700">
                    Set as default persona
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingPersona ? 'Update Persona' : 'Create Persona'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Personas List */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Personas</h3>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Persona</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : personas.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No personas yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first persona to personalize AI-generated content
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Persona</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personas.map((persona) => (
                <div
                  key={persona.id}
                  className={`border-2 rounded-lg p-4 ${
                    persona.is_default ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        {persona.persona_name}
                        {persona.is_default && (
                          <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">{persona.role_title}</p>
                      {persona.company_or_business && (
                        <p className="text-sm text-gray-500">at {persona.company_or_business}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(persona)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(persona.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {persona.industry && (
                    <p className="text-sm text-gray-500 mb-2">Industry: {persona.industry}</p>
                  )}
                  {persona.description && (
                    <p className="text-sm text-gray-600 mb-3">{persona.description}</p>
                  )}
                  {!persona.is_default && (
                    <button
                      onClick={() => handleSetDefault(persona.id)}
                      className="text-sm text-green-600 hover:text-green-700"
                    >
                      Set as default
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 