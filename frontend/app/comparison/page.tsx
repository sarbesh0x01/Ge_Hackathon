"use client";

import React from "react";
import ImageComparisonTool from "../components/DisasterChatbot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, HelpCircle, LinkIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ImageComparisonPage() {
  // Get the Groq API key from environment variables
  const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || "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";

  // Helpful debugging for environment variables
  console.log("API Key available:", groqApiKey ? "Yes (starts with " + groqApiKey.substring(0, 4) + ")" : "No");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Disaster Image Analysis</h1>
        <p className="text-gray-500">
          Compare before and after disaster images with AI-powered damage assessment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ImageComparisonTool defaultApiKey={groqApiKey} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                How to Use
              </CardTitle>
              <CardDescription>Get the most from the image analyzer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-2 rounded-md border bg-gray-50 text-sm">
                  <div className="font-medium">1. Upload Images</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add before and after disaster images to compare changes
                  </p>
                </div>
                <div className="p-2 rounded-md border bg-gray-50 text-sm">
                  <div className="font-medium">2. Use the Slider</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Drag the slider to compare before and after conditions
                  </p>
                </div>
                <div className="p-2 rounded-md border bg-gray-50 text-sm">
                  <div className="font-medium">3. Run Analysis</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Click &quot;Analyze Changes&quot; for automated damage detection
                  </p>
                </div>
                <div className="p-2 rounded-md border bg-gray-50 text-sm">
                  <div className="font-medium">4. AI Assessment</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Use &quot;AI Analysis&quot; for detailed insights powered by Groq
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-blue-600" />
                Resources for Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <a
                  href="https://www.fema.gov/emergency-managers/risk-management/building-science/hurricanes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-md border hover:bg-gray-50"
                >
                  <span>FEMA Building Assessment</span>
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                </a>
                <a
                  href="https://www.nist.gov/el/materials-and-structural-systems-division-73100/disaster-resilience-73104"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-md border hover:bg-gray-50"
                >
                  <span>NIST Disaster Resilience</span>
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                </a>
                <a
                  href="https://www.groq.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-md border hover:bg-gray-50"
                >
                  <span>Groq API (NLP Provider)</span>
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Important Disclaimer</h3>
            <p className="text-sm text-amber-700 mt-1">
              This image analysis tool provides preliminary automated assessment only. Always consult with qualified structural engineers or disaster assessment professionals for critical infrastructure or safety decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}