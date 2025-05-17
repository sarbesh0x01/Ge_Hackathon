'use client';

import { Lightbulb, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface RecommendationsProps {
  recommendations: string[];
  impactLevel: string;
}

export default function Recommendations({ recommendations, impactLevel }: RecommendationsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get appropriate background color based on impact level
  const getBgColor = () => {
    switch (impactLevel.toLowerCase()) {
      case 'high':
        return 'bg-red-50';
      case 'medium':
        return 'bg-yellow-50';
      case 'low':
        return 'bg-green-50';
      default:
        return 'bg-blue-50';
    }
  };

  // Get appropriate text color based on impact level
  const getTextColor = () => {
    switch (impactLevel.toLowerCase()) {
      case 'high':
        return 'text-red-700';
      case 'medium':
        return 'text-yellow-700';
      case 'low':
        return 'text-green-700';
      default:
        return 'text-blue-700';
    }
  };

  // Get priority based on recommendation order
  const getPriority = (index: number) => {
    if (index === 0) return 'Immediate';
    if (index === 1) return 'High';
    if (index === 2) return 'Medium';
    return 'Standard';
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Immediate':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
        <h3 className="font-medium flex items-center">
          <Lightbulb size={18} className="mr-2" />
          Recommendations
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
          {recommendations && recommendations.length > 0 ? (
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${getBgColor()} ${getTextColor()} mb-4`}>
                <p className="text-sm font-medium">
                  {impactLevel === 'High'
                    ? 'Critical actions needed to address severe impact'
                    : impactLevel === 'Medium'
                      ? 'Important actions to mitigate significant damage'
                      : 'Recommended actions for minor impact areas'}
                </p>
              </div>

              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start border-b pb-2 last:border-0 last:pb-0">
                  <div className="mr-3 mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(getPriority(index))}`}>
                      {getPriority(index)}
                    </span>
                  </div>
                  <p className="flex-1 text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic p-4 text-center">
              No recommendations available for this analysis.
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            <p>Recommendations are prioritized based on urgency and potential impact. Implementation should be coordinated with local authorities and disaster management teams.</p>
          </div>
        </div>
      )}
    </div>
  );
}
