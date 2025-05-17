"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUploader from "./ImageUploader";
import ResultDisplay from "./ResultDisplay";
import { mockImageAnalysis } from "@/app/lib/mockData";

const ImageComparisonTool: React.FC = () => {
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("upload");

  const handleBeforeImageUpload = (imageUrl: string) => {
    setBeforeImage(imageUrl);
  };

  const handleAfterImageUpload = (imageUrl: string) => {
    setAfterImage(imageUrl);
  };

  const handleAnalyze = () => {
    if (!beforeImage || !afterImage) {
      alert("Please upload both before and after images");
      return;
    }

    setIsAnalyzing(true);

    // Simulate API call to backend for image comparison
    setTimeout(() => {
      // Using mock data for now, later this will come from our Python backend
      setResults(mockImageAnalysis.analysisResults);
      setIsAnalyzing(false);
      setActiveTab("results");
    }, 2500);
  };

  const handleReset = () => {
    setBeforeImage(null);
    setAfterImage(null);
    setResults(null);
    setActiveTab("upload");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Disaster Image Comparison</CardTitle>
        <CardDescription>
          Upload before and after images to analyze disaster impact
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload Images</TabsTrigger>
            <TabsTrigger value="compare" disabled={!beforeImage || !afterImage}>
              Compare
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!results}>
              Analysis Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Before Disaster</h3>
                <ImageUploader
                  onImageUpload={handleBeforeImageUpload}
                  currentImage={beforeImage}
                />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">After Disaster</h3>
                <ImageUploader
                  onImageUpload={handleAfterImageUpload}
                  currentImage={afterImage}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                onClick={handleAnalyze}
                disabled={!beforeImage || !afterImage}
              >
                Analyze Images
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="compare">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Before Disaster</h3>
                {beforeImage && (
                  <div className="border rounded-md overflow-hidden">
                    <img
                      src={beforeImage}
                      alt="Before disaster"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">After Disaster</h3>
                {afterImage && (
                  <div className="border rounded-md overflow-hidden">
                    <img
                      src={afterImage}
                      alt="After disaster"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Differences"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="results">
            {results && (
              <ResultDisplay
                beforeImage={beforeImage!}
                afterImage={afterImage!}
                results={results}
                onReset={handleReset}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImageComparisonTool;
