"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ResultDisplayProps {
  beforeImage: string;
  afterImage: string;
  results: any;
  onReset: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  beforeImage,
  afterImage,
  results,
  onReset
}) => {
  const [selectedTab, setSelectedTab] = useState("overlay");

  const renderDetectedChanges = () => {
    const categories = {
      buildingDamage: { title: "Building Damage", color: "bg-red-500" },
      roadDamage: { title: "Road Damage", color: "bg-amber-500" },
      floodedAreas: { title: "Flooded Areas", color: "bg-blue-500" },
      vegetationLoss: { title: "Vegetation Loss", color: "bg-green-500" }
    };

    return (
      <div className="space-y-4">
        {Object.entries(results).map(([category, items]: [string, any]) => (
          <Card key={category} className="overflow-hidden">
            <div className={`${categories[category as keyof typeof categories].color} h-2`} />
            <CardContent className="pt-4">
              <h3 className="font-medium text-base mb-2">
                {categories[category as keyof typeof categories].title}
              </h3>
              <div>
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center py-1 border-b last:border-0">
                    <div className="flex items-center">
                      <Badge variant={item.confidence > 0.9 ? "default" : "outline"} className="mr-2">
                        {Math.round(item.confidence * 100)}%
                      </Badge>
                      <span>{item.severity || item.waterDepth || item.area}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      ID: {item.id}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderOverlayImage = () => {
    // In a real implementation, this would be an actual overlay image
    // For now, we'll use the after image with a semi-transparent red overlay
    return (
      <div className="relative">
        <img
          src={afterImage}
          alt="After disaster with damage overlay"
          className="w-full h-auto"
        />
        <div className="absolute inset-0 bg-red-500 opacity-30 pointer-events-none"></div>

        {/* Example annotation markers */}
        {results.buildingDamage.map((item: any) => (
          <div
            key={item.id}
            className="absolute bg-red-500 border-2 border-white rounded-full flex items-center justify-center w-6 h-6 text-white text-xs font-bold"
            style={{
              left: `${item.coordinates[0] / 10}%`,
              top: `${item.coordinates[1] / 10}%`,
            }}
          >
            {item.id}
          </div>
        ))}

        {results.floodedAreas.map((item: any) => (
          <div
            key={item.id}
            className="absolute bg-blue-500 border-2 border-white rounded-full flex items-center justify-center w-6 h-6 text-white text-xs font-bold"
            style={{
              left: `${item.coordinates[0] / 10}%`,
              top: `${item.coordinates[1] / 10}%`,
            }}
          >
            {item.id}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Alert variant="success" className="mb-4">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Analysis Complete</AlertTitle>
        <AlertDescription>
          We've detected several areas of damage in the post-disaster image.
        </AlertDescription>
      </Alert>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overlay">Damage Overlay</TabsTrigger>
          <TabsTrigger value="comparison">Side by Side</TabsTrigger>
          <TabsTrigger value="details">Detailed Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overlay" className="pt-4">
          {renderOverlayImage()}
        </TabsContent>

        <TabsContent value="comparison" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Before Disaster</h3>
              <img
                src={beforeImage}
                alt="Before disaster"
                className="w-full h-auto border rounded-md"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">After Disaster</h3>
              <img
                src={afterImage}
                alt="After disaster"
                className="w-full h-auto border rounded-md"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="pt-4">
          {renderDetectedChanges()}
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={onReset}>
          Start New Analysis
        </Button>
        <Button>
          Generate Full Report
        </Button>
      </div>
    </div>
  );
};

export default ResultDisplay;
