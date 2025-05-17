"use client";

import React from "react";
import ImageComparisonTool from "@/app/components/image-comparison/ImageComparisonTool";

export default function ComparisonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Image Analysis</h1>
        <p className="text-gray-500">
          Compare before and after images to assess disaster impact
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ImageComparisonTool />

        <div className="bg-gray-50 border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-medium">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <span className="text-blue-600 font-medium">1</span>
              </div>
              <h3 className="font-medium mb-1">Upload Images</h3>
              <p className="text-sm text-gray-600">
                Upload before and after images of the same location
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <span className="text-blue-600 font-medium">2</span>
              </div>
              <h3 className="font-medium mb-1">AI Analysis</h3>
              <p className="text-sm text-gray-600">
                Our system detects changes and identifies damage
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <span className="text-blue-600 font-medium">3</span>
              </div>
              <h3 className="font-medium mb-1">Assessment Report</h3>
              <p className="text-sm text-gray-600">
                Get detailed analysis of damage and recommended actions
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              Our advanced AI algorithms compare pixel-by-pixel changes between images to identify areas affected by disasters. The system can detect structural damage, flooding, debris, and environmental changes with high accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
