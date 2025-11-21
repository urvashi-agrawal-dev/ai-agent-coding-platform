import { useState, useEffect } from 'react';
import { FaTimes, FaTrash, FaFolder } from 'react-icons/fa';
import axios from 'axios';

interface ProjectManagerProps {
  onClose: () => void;
  onLoad: (project: any) => void;
}

export default function ProjectManager({ onClose, onLoad }: ProjectManagerProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/project/list');
      if (response.data.success) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/project/delete/${id}`);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      alert('Failed to delete project');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-surface rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col border border-dark-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-bold text-white">Load Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FaFolder className="text-4xl mx-auto mb-4 opacity-50" />
              <p>No saved projects yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => onLoad(project)}
                  className="bg-dark-bg rounded-lg p-4 border border-dark-border hover:border-accent-blue cursor-pointer transition group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{project.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="capitalize">{project.language}</span>
                        <span>•</span>
                        <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{project.code.split('\n').length} lines</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteProject(project.id, e)}
                      className="text-gray-400 hover:text-accent-red transition opacity-0 group-hover:opacity-100"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="mt-3 bg-dark-surface rounded p-2 max-h-20 overflow-hidden">
                    <pre className="text-xs text-gray-400 font-mono">
                      {project.code.substring(0, 150)}...
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
