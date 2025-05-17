'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, ChevronUp, ChevronDown, BarChart, Eye, Download, AlertTriangle } from 'lucide-react';
import Dropzone from 'react-dropzone';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ImageUploadProps {
  onAnalysisComplete?: (analysisId: string, data: any) => void;
}

export default function ImageUpload({ onAnalysisComplete }: ImageUploadProps) {
  const [preImage, setPreImage] = useState<File | null>(null);
  const [postImage, setPostImage] = useState<File | null>(null);
  const [preImagePreview, setPreImagePreview] = useState<string | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'images' | 'results'>('images');

  const resultRef = useRef<HTMLDivElement>(null);

  const handleDrop = useCallback((acceptedFiles: File[], type: 'pre' | 'post') => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    // Set the file
    if (type === 'pre') {
      setPreImage(file);
      setPreImagePreview(URL.createObjectURL(file));
    } else {
      setPostImage(file);
      setPostImagePreview(URL.createObjectURL(file));
    }

    // Clear any previous error
    setError(null);
  }, []);

  const handleAnalyze = async () => {
    if (!preImage || !postImage) {
      setError('Please upload both pre and post-disaster images.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pre_image', preImage);
      formData.append('post_image', postImage);

      // You can add optional analysis parameters
      const options = {
        threshold: 30,
        target_size: [400, 400]
      };
      formData.append('options', JSON.stringify(options));

      const response = await fetch(`${API_BASE_URL}/api/chatbot/analysis/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze images');
      }

      const data = await response.json();
      setAnalysisResults(data);
      setActiveTab('results');

      // Notify parent component
      if (onAnalysisComplete) {
        onAnalysisComplete(data.analysis_id, data);
      }

      // Scroll to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error('Error analyzing images:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during analysis');
    } finally {
      setIsUploading(false);
    }
  };

  const clearImages = () => {
    // Revoke object URLs to avoid memory leaks
    if (preImagePreview) URL.revokeObjectURL(preImagePreview);
    if (postImagePreview) URL.revokeObjectURL(postImagePreview);

    setPreImage(null);
    setPostImage(null);
    setPreImagePreview(null);
    setPostImagePreview(null);
    setAnalysisResults(null);
    setError(null);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const downloadResults = () => {
    if (!analysisResults) return;

    const dataStr = JSON.stringify(analysisResults, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const downloadLink = document.createElement('a');
    downloadLink.href = dataUri;
    downloadLink.download = `disaster_analysis_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Render impact level badge with appropriate color
  const renderImpactBadge = (level: string) => {
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';

    if (level === 'High') {
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
    } else if (level === 'Medium') {
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
    } else if (level === 'Low') {
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
    }

    return (
      <span className={`${bgColor} ${textColor} px-2 py-1 rounded text-sm font-medium`}>
        {level}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
      {/* Header */}
      <div className="bg-blue-50 p-3 border-b flex justify-between items-center">
        <h3 className="font-medium">Disaster Image Analysis</h3>
        <button
          onClick={toggleExpanded}
          className="p-1 rounded hover:bg-gray-100"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div>
          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`flex-1 py-2 px-4 ${activeTab === 'images' ? 'bg-gray-100 font-medium' : 'bg-white'}`}
              onClick={() => setActiveTab('images')}
            >
              Upload Images
            </button>
            <button
              className={`flex-1 py-2 px-4 ${activeTab === 'results' ? 'bg-gray-100 font-medium' : 'bg-white'} ${!analysisResults ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => analysisResults && setActiveTab('results')}
              disabled={!analysisResults}
            >
              Analysis Results
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'images' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Pre-Disaster Image Dropzone */}
                  <div>
                    <p className="text-sm font-medium mb-2">Pre-Disaster Image</p>
                    <Dropzone onDrop={(files) => handleDrop(files, 'pre')}>
                      {({ getRootProps, getInputProps }) => (
                        <div
                          {...getRootProps()}
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 ${preImage ? 'border-blue-300' : 'border-gray-300'}`}
                        >
                          <input {...getInputProps()} />
                          {preImagePreview ? (
                            <div className="relative">
                              <img
                                src={preImagePreview}
                                alt="Pre-disaster preview"
                                className="max-h-48 mx-auto"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreImage(null);
                                  setPreImagePreview(null);
                                }}
                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="py-4">
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <p className="mt-2 text-sm text-gray-500">Drop pre-disaster image here, or click to select</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Dropzone>
                  </div>

                  {/* Post-Disaster Image Dropzone */}
                  <div>
                    <p className="text-sm font-medium mb-2">Post-Disaster Image</p>
                    <Dropzone onDrop={(files) => handleDrop(files, 'post')}>
                      {({ getRootProps, getInputProps }) => (
                        <div
                          {...getRootProps()}
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 ${postImage ? 'border-blue-300' : 'border-gray-300'}`}
                        >
                          <input {...getInputProps()} />
                          {postImagePreview ? (
                            <div className="relative">
                              <img
                                src={postImagePreview}
                                alt="Post-disaster preview"
                                className="max-h-48 mx-auto"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPostImage(null);
                                  setPostImagePreview(null);
                                }}
                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="py-4">
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <p className="mt-2 text-sm text-gray-500">Drop post-disaster image here, or click to select</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Dropzone>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between">
                  <button
                    onClick={clearImages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={isUploading || (!preImage && !postImage)}
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleAnalyze}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    disabled={isUploading || !preImage || !postImage}
                  >
                    {isUploading ? 'Analyzing...' : 'Analyze Images'}
                  </button>
                </div>
              </>
            ) : (
              <div ref={resultRef}>
                {analysisResults ? (
                  <div>
                    {/* Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Analysis Summary</h4>
                        <button
                          onClick={downloadResults}
                          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                        >
                          <Download size={14} className="mr-1" />
                          Download
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Impact Level</p>
                          <div className="mt-1">
                            {renderImpactBadge(analysisResults.impact_level)}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Change Percentage</p>
                          <p className="font-medium">{analysisResults.change_percentage}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Disaster Type</p>
                          <p className="font-medium">
                            {analysisResults.disaster_type
                              ? analysisResults.disaster_type.charAt(0).toUpperCase() + analysisResults.disaster_type.slice(1)
                              : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Images */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Comparison View</h4>
                      {analysisResults.images?.combined ? (
                        <div className="text-center p-2 border rounded-lg">
                          <img
                            src={`data:image/png;base64,${analysisResults.images.combined}`}
                            alt="Comparison of pre and post disaster"
                            className="max-w-full mx-auto"
                          />
                          <div className="flex justify-center text-sm mt-2 text-gray-500 space-x-4">
                            <span>Pre-Disaster</span>
                            <span>Post-Disaster</span>
                            <span>Difference</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No comparison image available</p>
                      )}
                    </div>

                    {/* Recommendations */}
                    {analysisResults.recommendations && analysisResults.recommendations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {analysisResults.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="text-gray-700">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Regions of Interest */}
                    {analysisResults.analysis_details?.regions_of_interest &&
                      analysisResults.analysis_details.regions_of_interest.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Regions of Interest</h4>
                          <div className="bg-gray-50 rounded-lg p-3 text-sm">
                            <table className="min-w-full">
                              <thead>
                                <tr>
                                  <th className="text-left py-2">Region</th>
                                  <th className="text-left py-2">Severity</th>
                                  <th className="text-left py-2">Area (px²)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {analysisResults.analysis_details.regions_of_interest.map((roi: any, index: number) => (
                                  <tr key={index} className="border-t border-gray-200">
                                    <td className="py-2">Region {roi.id}</td>
                                    <td className="py-2">
                                      {renderImpactBadge(roi.severity)}
                                    </td>
                                    <td className="py-2">{roi.area}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No analysis results available yet. Upload and analyze images to see results.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
