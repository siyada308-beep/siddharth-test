import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface FilterOptions {
  search: string;
  fileType: string;
  minSize: string;
  maxSize: string;
  dateFrom: string;
  dateTo: string;
}

interface SearchFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  fileTypes: string[];
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ onFilterChange, fileTypes }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    fileType: '',
    minSize: '',
    maxSize: '',
    dateFrom: '',
    dateTo: '',
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Apply filters when debounced search or other filters change
  useEffect(() => {
    onFilterChange({ ...filters, search: debouncedSearch });
  }, [debouncedSearch, filters.fileType, filters.minSize, filters.maxSize, filters.dateFrom, filters.dateTo]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    const emptyFilters: FilterOptions = {
      search: '',
      fileType: '',
      minSize: '',
      maxSize: '',
      dateFrom: '',
      dateTo: '',
    };
    setFilters(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const sizePresets = [
    { label: 'Small (< 1MB)', min: '', max: '1048576' },
    { label: 'Medium (1-10MB)', min: '1048576', max: '10485760' },
    { label: 'Large (> 10MB)', min: '10485760', max: '' },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search files by name..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
            showFilters || hasActiveFilters
              ? 'border-primary-500 text-primary-700 bg-primary-50'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-primary-500 text-white rounded-full px-2 py-0.5 text-xs">
              Active
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Type
              </label>
              <select
                value={filters.fileType}
                onChange={(e) => handleFilterChange('fileType', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">All Types</option>
                {fileTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="To"
                />
              </div>
            </div>
          </div>

          {/* Size Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Size (bytes)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                placeholder="Min size"
                value={filters.minSize}
                onChange={(e) => handleFilterChange('minSize', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <input
                type="number"
                placeholder="Max size"
                value={filters.maxSize}
                onChange={(e) => handleFilterChange('maxSize', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {sizePresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    handleFilterChange('minSize', preset.min);
                    handleFilterChange('maxSize', preset.max);
                  }}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};