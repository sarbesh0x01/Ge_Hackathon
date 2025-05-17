'use client';

import { BarChart, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface ImpactMetricsProps {
  changePercentage: number;
  impactLevel: string;
  disasterType: string;
  regionsOfInterest: any[];
}

export default function ImpactMetrics({
  changePercentage,
  impactLevel,
  disasterType,
  regionsOfInterest
}: ImpactMetricsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Generate impact level colors
  const getImpactColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format disaster type
  const formatDisasterType = (type: string) => {
    if (!type || type === 'unknown') return 'Unknown';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
        <h3 className="font-medium flex items-center">
          <BarChart size={18} className="mr-2" />
          Impact Metrics
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronDown
            size={18}
            className={`transform transition-transform ${isExpanded ? '' : '-rotate-90'}`}
          />
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Change Percentage</p>
              <div className="flex items-center">
                <div className="h-2 bg-gray-200 rounded-full w-full mr-2">
                  <div
                    className="h-2 bg-blue-600 rounded-full"
                    style={{ width: `${Math.min(changePercentage, 100)}%` }}
                  ></div>
                </div>
                <span className="font-semibold">{changePercentage}%</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Impact Level</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getImpactColor(impactLevel)}`}>
                {impactLevel}
              </span>
            </div>
          </div>

          {/* Additional metrics */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Disaster Type</p>
              <p className="font-medium">{formatDisasterType(disasterType)}</p>
            </div>

            {regionsOfInterest && regionsOfInterest.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Regions of Interest</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-1 pr-4">Region</th>
                        <th className="py-1 pr-4">Severity</th>
                        <th className="py-1">Area (px²)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionsOfInterest.map((region, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="py-2 pr-4">Region {region.id}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getImpactColor(region.severity)}`}>
                              {region.severity}
                            </span>
                          </td>
                          <td className="py-2">{region.area}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 border-t pt-4">
            <p className="text-xs text-gray-500 mb-2">Impact Level Legend</p>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                <span className="text-xs">High</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></span>
                <span className="text-xs">Medium</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                <span className="text-xs">Low</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
