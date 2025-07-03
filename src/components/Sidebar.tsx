import React, { useState } from 'react';
import { Search, Filter, FileText, File, Table, Globe, X } from 'lucide-react';

interface FilterOptions {
  fileTypes: {
    PDF: boolean;
    DOCX: boolean;
    XLSX: boolean;
    Web: boolean;
  };
  keyword: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFiltersChange: (filters: FilterOptions) => void;
  filters: FilterOptions;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onFiltersChange, filters }) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handleFileTypeChange = (type: keyof FilterOptions['fileTypes']) => {
    const newFilters = {
      ...localFilters,
      fileTypes: {
        ...localFilters.fileTypes,
        [type]: !localFilters.fileTypes[type]
      }
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleKeywordChange = (keyword: string) => {
    const newFilters = {
      ...localFilters,
      keyword
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      fileTypes: { PDF: true, DOCX: true, XLSX: true, Web: true },
      keyword: ''
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-4 h-4" />;
      case 'DOCX': return <File className="w-4 h-4" />;
      case 'XLSX': return <Table className="w-4 h-4" />;
      case 'Web': return <Globe className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-purple-900/95 to-indigo-900/95 backdrop-blur-md border-r border-purple-500/20 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-purple-300" />
            <h2 className="text-lg font-bold text-white">Search Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-purple-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Keyword Search */}
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-3">
              Keyword Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="text"
                value={localFilters.keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                placeholder="Search in documents..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* File Type Filters */}
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-3">
              Document Types
            </label>
            <div className="space-y-3">
              {Object.entries(localFilters.fileTypes).map(([type, checked]) => (
                <label
                  key={type}
                  className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleFileTypeChange(type as keyof FilterOptions['fileTypes'])}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <div className="flex items-center gap-2 text-purple-200">
                    {getFileTypeIcon(type)}
                    <span className="text-sm font-medium">{type} Files</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <div className="pt-4 border-t border-purple-500/20">
            <button
              onClick={clearAllFilters}
              className="w-full px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 rounded-lg transition-colors text-sm font-medium"
            >
              Clear All Filters
            </button>
          </div>

          {/* Filter Summary */}
          <div className="p-3 bg-white/5 rounded-lg">
            <h3 className="text-xs font-medium text-purple-200 mb-2">Active Filters</h3>
            <div className="space-y-1 text-xs text-purple-300">
              <div>
                Types: {Object.entries(localFilters.fileTypes)
                  .filter(([, checked]) => checked)
                  .map(([type]) => type)
                  .join(', ') || 'None'}
              </div>
              {localFilters.keyword && (
                <div>Keyword: "{localFilters.keyword}"</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;