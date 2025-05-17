'use client';

import { useState, useEffect } from 'react';
import ChatbotWidget from '../components/chatbot/ChatbotWidget';
import ImageUpload from '@/components/image-upload';
import ComparisonView from '@/components/analysis/comparison-view';

import ImpactMetrics from '../components/analysis/impact-metrics';
import Recommendations from '../components/analysis/recommendations';

export default function DisasterAssessmentPage() {
  const [latestAnalysis, setLatestAnalysis] = useState<any | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  // Handler for when analysis is completed
  const handleAnalysisComplete = (id: string, data: any) => {
    setAnalysisId(id);
    setLatestAnalysis(data);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Disaster Assessment Platform</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          <ImageUpload onAnalysisComplete={handleAnalysisComplete} />

          {latestAnalysis && (
            <>
              <ComparisonView
                preImage={latestAnalysis.images?.pre_image}
                postImage={latestAnalysis.images?.post_image}
                diffImage={latestAnalysis.images?.diff_image}
                combinedImage={latestAnalysis.images?.combined}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImpactMetrics
                  changePercentage={latestAnalysis.change_percentage}
                  impactLevel={latestAnalysis.impact_level}
                  disasterType={latestAnalysis.disaster_type}
                  regionsOfInterest={latestAnalysis.analysis_details?.regions_of_interest || []}
                />

                <Recommendations
                  recommendations={latestAnalysis.recommendations || []}
                  impactLevel={latestAnalysis.impact_level}
                />
              </div>
            </>
          )}
        </div>

        {/* Chatbot Widget - Right Side */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg border p-4 sticky top-4">
            <h2 className="font-bold text-lg mb-4">Disaster Assessment Assistant</h2>
            <p className="text-sm text-gray-600 mb-4">
              Ask questions about disaster assessment methods, tools, and best practices.
              The assistant has access to your analysis results and can provide detailed insights.
            </p>

            <div className="h-[600px]">
              <ChatbotWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
