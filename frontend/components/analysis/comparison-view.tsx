'use client';

import { Eye, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface ComparisonViewProps {
  preImage?: string;
  postImage?: string;
  diffImage?: string;
  combinedImage?: string;
}

export default function ComparisonView({
  preImage,
  postImage,
  diffImage,
  combinedImage
}: ComparisonViewProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'combined' | 'separate'>('combined');

  // If no images, show placeholder
  if (!preImage && !postImage && !diffImage && !combinedImage) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
        <h3 className="font-medium flex items-center">
          <Eye size={18} className="mr-2" />
          Comparison View
        </h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'combined' | 'separate')}
              className="border rounded px-2 py-1 bg-white text-sm"
            >
              <option value="combined">Combined View</option>
              <option value="separate">Separate Views</option>
            </select>
          </div>
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
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {viewMode === 'combined' ? (
            <div className="text-center">
              {combinedImage ? (
                <>
                  <div className="border rounded-lg p-2">
                    <img
                      src={`data:image/png;base64,${combinedImage}`}
                      alt="Combined view of pre, post, and difference"
                      className="max-w-full mx-auto"
                    />
                  </div>
                  <div className="flex justify-center text-sm mt-3 text-gray-500 space-x-8">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-blue-200 mr-1 inline-block"></span>
                      Pre-Disaster
                    </span>
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-green-200 mr-1 inline-block"></span>
                      Post-Disaster
                    </span>
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-red-200 mr-1 inline-block"></span>
                      Difference
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 italic">Combined view not available</div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="font-medium mb-2">Pre-Disaster</p>
                {preImage ? (
                  <div className="border rounded-lg p-2">
                    <img
                      src={`data:image/png;base64,${preImage}`}
                      alt="Pre-disaster image"
                      className="max-w-full mx-auto"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    Not available
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="font-medium mb-2">Post-Disaster</p>
                {postImage ? (
                  <div className="border rounded-lg p-2">
                    <img
                      src={`data:image/png;base64,${postImage}`}
                      alt="Post-disaster image"
                      className="max-w-full mx-auto"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    Not available
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="font-medium mb-2">Difference Map</p>
                {diffImage ? (
                  <div className="border rounded-lg p-2">
                    <img
                      src={`data:image/png;base64,${diffImage}`}
                      alt="Difference map"
                      className="max-w-full mx-auto"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    Not available
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p>
              <span className="font-medium">Tip:</span> The difference map highlights areas of change between the pre and post-disaster images.
              Brighter areas indicate more significant changes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
