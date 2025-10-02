import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fileService } from '../services/fileService';
import { CircleStackIcon, DocumentDuplicateIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

export const StorageStats: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['storageStats'],
    queryFn: fileService.getStorageStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-white shadow sm:rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      name: 'Storage Efficiency',
      value: `${stats.savings_percentage}%`,
      description: `${stats.space_saved_mb} MB saved`,
      icon: ArrowTrendingDownIcon,
      color: 'green',
    },
    {
      name: 'Total Files',
      value: stats.total_files_uploaded,
      description: `${stats.unique_files_stored} unique files`,
      icon: DocumentDuplicateIcon,
      color: 'blue',
    },
    {
      name: 'Storage Used',
      value: `${stats.actual_size_mb} MB`,
      description: `of ${stats.total_size_mb} MB uploaded`,
      icon: CircleStackIcon,
      color: 'purple',
    },
  ];

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Storage Statistics</h2>
        <span className="text-xs text-gray-500">
          Updated: {new Date(stats.last_updated).toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            green: 'bg-green-100 text-green-600',
            blue: 'bg-blue-100 text-blue-600',
            purple: 'bg-purple-100 text-purple-600',
          };

          return (
            <div
              key={stat.name}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {stats.space_saved > 0 && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ArrowTrendingDownIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">
                <strong>Deduplication Active:</strong> By detecting duplicate files, you've saved{' '}
                <strong>{stats.space_saved_mb} MB</strong> of storage space (
                {stats.savings_percentage}% reduction)!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};