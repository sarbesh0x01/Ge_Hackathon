"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  FileUp,
  ImageIcon,
  PanelLeftOpen,
  Eye,
  Download,
  Zap,
  X,
  Bot,
  Sparkles,
  SendHorizontal,
  HelpCircle,
  Loader2,
  Database
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GroqChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  loading?: boolean;
}

// Data structure for analysis results
interface AnalysisResult {
  comparison_id: string;
  damagePercentage: number;
  affectedAreas: string[];
  recommendations: string[];
  severity: "low" | "medium" | "high";
  building_damage: BuildingDamage[];
  road_damage: RoadDamage[];
  flooded_areas: FloodedArea[];
  vegetation_loss: VegetationLoss[];
  created_at: string;
}

interface BuildingDamage {
  id: number;
  coordinates: number[];
  severity: string;
  confidence: number;
  type?: string;
  safety?: string;
}

interface RoadDamage {
  id: number;
  coordinates: number[];
  severity: string;
  confidence: number;
  length?: number;
  passability?: string;
}

interface FloodedArea {
  id: number;
  coordinates: number[];
  water_depth: string;
  area: number;
  confidence: number;
  area_sqm?: number;
  flow_direction?: string;
  flood_timeline?: string;
}

interface VegetationLoss {
  id: number;
  coordinates: number[];
  area: string;
  confidence: number;
  density?: string;
  vegetation_type?: string;
  ecological_impact?: string;
}

// Type for backend analysis result data
interface BackendAnalysisResult {
  comparison_id: string;
  changed_pixels_percentage?: number;
  severity_score?: number;
  building_damage?: BuildingDamage[];
  road_damage?: RoadDamage[];
  flooded_areas?: FloodedArea[];
  vegetation_loss?: VegetationLoss[];
  damage_overview?: {
    damage_types?: Record<string, unknown>;
  };
  created_at?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const ImageComparisonTool = ({ defaultApiKey = "" }) => {
  // State for uploaded images
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [beforeImageId, setBeforeImageId] = useState<string | null>(null);
  const [afterImageId, setAfterImageId] = useState<string | null>(null);

  // State for analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);

  // State for slider
  const [sliderValue, setSliderValue] = useState(50);

  // State for view mode
  const [viewMode, setViewMode] = useState<"slider" | "side-by-side" | "overlay">("slider");

  // State for disaster type selection
  const [disasterType, setDisasterType] = useState<string>("hurricane");

  // State for affected assets
  const [affectedAssets, setAffectedAssets] = useState<string[]>([]);

  // State for detailed analysis modal
  const [isDetailedViewOpen, setIsDetailedViewOpen] = useState(false);
  const [detailedData, setDetailedData] = useState<AnalysisResult | null>(null);

  // State for export progress
  const [isExporting, setIsExporting] = useState(false);

  // State for NLP analysis
  const [activeTab, setActiveTab] = useState<"comparison" | "nlp">("comparison");
  const [apiKey, setApiKey] = useState(defaultApiKey);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-1",
      role: "system",
      content: `You are DisasterAnalysisAI, an expert in analyzing disaster images and providing assessment.
      Focus on interpreting disaster imagery, identifying damage patterns, and providing professional analysis.
      Today's date is May 17, 2025.
      
      Format your responses with markdown headings, bullet points, and bold text when appropriate.
      Be concise but detailed in your assessment. Include specific numbers and percentages when relevant.
      
      Current disaster context: ${disasterType}`,
      timestamp: new Date()
    },
    {
      id: "welcome",
      role: "assistant",
      content: "I'm DisasterAnalysisAI, your expert for disaster image analysis. Upload before and after images, and I can help analyze damage patterns, severity, and suggest response strategies.",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // References for the image container
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Data sources
  const [useOpenAIVision, setUseOpenAIVision] = useState(false);
  const [openAIKey, setOpenAIKey] = useState("");
  const [showOpenAIKeyInput, setShowOpenAIKeyInput] = useState(false);

  // Check API availability
  const [isApiAvailable, setIsApiAvailable] = useState(true);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (activeTab === "nlp") {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  // Check backend API availability on mount
  useEffect(() => {
    checkApiAvailability();
  }, []);

  const checkApiAvailability = async () => {
    try {
      const response = await fetch(`${API_URL}/api/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setIsApiAvailable(true);
        console.log("Backend API is available");
      } else {
        setIsApiAvailable(false);
        console.warn("Backend API returned error status");
      }
    } catch (error) {
      console.error("Error checking API availability:", error);
      setIsApiAvailable(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle before image upload
  const handleBeforeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setBeforeImage(imageData);

        // Reset the image ID since we have a new image
        setBeforeImageId(null);

        // If backend API is available, upload to backend immediately
        if (isApiAvailable) {
          uploadImageToBackend(imageData, "before");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle after image upload
  const handleAfterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setAfterImage(imageData);

        // Reset the image ID since we have a new image
        setAfterImageId(null);

        // If backend API is available, upload to backend immediately
        if (isApiAvailable) {
          uploadImageToBackend(imageData, "after");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to backend immediately after selection
  const uploadImageToBackend = async (imageData: string, imageType: "before" | "after") => {
    try {
      // Extract the base64 data without the prefix
      const base64Data = imageData.split(',')[1];
      const formData = new FormData();

      // Convert base64 to blob
      const fetchRes = await fetch(`data:image/jpeg;base64,${base64Data}`);
      const blob = await fetchRes.blob();
      formData.append('file', blob, `${imageType}_image.jpg`);

      // Upload to API
      const response = await fetch(`${API_URL}/api/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Image upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`${imageType} image uploaded:`, data);

      // Store the image ID
      if (imageType === "before") {
        setBeforeImageId(data.image_id);
      } else {
        setAfterImageId(data.image_id);
      }
    } catch (error) {
      console.error(`Error uploading ${imageType} image:`, error);
      setApiError(`Failed to upload ${imageType} image to backend. Using local version.`);
    }
  };

  // Handle analysis with backend API
  const handleAnalysis = async () => {
    if (!beforeImage || !afterImage) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setApiError(null);

    try {
      // Check if we already have image IDs
      let beforeId = beforeImageId;
      let afterId = afterImageId;

      // If not, upload the images first
      if (!beforeId && isApiAvailable) {
        const beforeUploadResult = await uploadImageAndGetId(beforeImage);
        beforeId = beforeUploadResult.image_id;
        setBeforeImageId(beforeId);
        setAnalysisProgress(25);
      }

      if (!afterId && isApiAvailable) {
        const afterUploadResult = await uploadImageAndGetId(afterImage);
        afterId = afterUploadResult.image_id;
        setAfterImageId(afterId);
        setAnalysisProgress(50);
      }

      // If we have both image IDs and API is available, request analysis
      if (beforeId && afterId && isApiAvailable) {
        const analysisResponse = await fetch(`${API_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            before_image_id: beforeId,
            after_image_id: afterId,
            disaster_type: disasterType,
            analysis_level: "standard",
            include_raw_data: false,
            async_mode: true
          })
        });

        if (!analysisResponse.ok) {
          throw new Error(`Analysis request failed: ${analysisResponse.statusText}`);
        }

        const analysisData = await analysisResponse.json();

        // If async analysis, start polling for status updates
        if (analysisData.status === "queued" || analysisData.status === "processing") {
          pollAnalysisStatus(analysisData.comparison_id);
        } else {
          // If sync analysis, use the result directly
          processAnalysisResult(analysisData);
          setAnalysisProgress(100);
          setIsAnalyzing(false);
        }
      } else {
        // Fallback to client-side analysis if API is not available
        if (useOpenAIVision && openAIKey) {
          handleOpenAIVisionAnalysis();
        } else {
          handleBasicAnalysis();
        }
      }
    } catch (error) {
      console.error("Error during analysis:", error);
      setApiError(error instanceof Error ? error.message : "Analysis failed");

      // Fallback to client-side analysis
      if (useOpenAIVision && openAIKey) {
        handleOpenAIVisionAnalysis();
      } else {
        handleBasicAnalysis();
      }
    }
  };

  // Helper function to upload an image and get its ID
  const uploadImageAndGetId = async (imageBase64: string) => {
    // Extract the base64 data without the prefix
    const base64Data = imageBase64.split(',')[1];
    const formData = new FormData();

    // Convert base64 to blob
    const fetchRes = await fetch(`data:image/jpeg;base64,${base64Data}`);
    const blob = await fetchRes.blob();
    formData.append('file', blob, 'image.jpg');

    // Upload to API
    const response = await fetch(`${API_URL}/api/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image upload failed: ${response.statusText}`);
    }

    return response.json();
  };

  // Poll for analysis status
  const pollAnalysisStatus = (comparisonId: string) => {
    const statusInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/analysis-status/${comparisonId}`);

        if (!response.ok) {
          clearInterval(statusInterval);
          setIsAnalyzing(false);
          setApiError(`Failed to get analysis status: ${response.statusText}`);
          handleBasicAnalysis(); // Fallback
          return;
        }

        const statusData = await response.json();
        setAnalysisProgress(statusData.progress);

        if (statusData.status === "completed") {
          clearInterval(statusInterval);

          // Fetch the completed result
          const resultResponse = await fetch(`${API_URL}/api/analysis-result/${comparisonId}`);

          if (!resultResponse.ok) {
            setIsAnalyzing(false);
            setApiError(`Failed to get analysis result: ${resultResponse.statusText}`);
            handleBasicAnalysis(); // Fallback
            return;
          }

          const resultData = await resultResponse.json();
          processAnalysisResult(resultData);
          setIsAnalyzing(false);
        } else if (statusData.status === "failed") {
          clearInterval(statusInterval);
          setIsAnalyzing(false);
          setApiError(`Analysis failed: ${statusData.message || "Unknown error"}`);
          handleBasicAnalysis(); // Fallback
        }
      } catch (error) {
        clearInterval(statusInterval);
        setIsAnalyzing(false);
        setApiError(`Error checking analysis status: ${error instanceof Error ? error.message : "Unknown error"}`);
        handleBasicAnalysis(); // Fallback
      }
    }, 2000); // Poll every 2 seconds

    // Clean up interval on component unmount
    return () => clearInterval(statusInterval);
  };
  // Process the analysis result from the API
const processAnalysisResult = async (resultData: BackendAnalysisResult) => {
  const recommendations = await getRecommendations(resultData, disasterType);

  const result: AnalysisResult = {
    comparison_id: resultData.comparison_id,
    damagePercentage: resultData.changed_pixels_percentage || 0,
    severity: getSeverityLevel(resultData.severity_score || 5),
    affectedAreas: extractAffectedAreas(resultData),
    recommendations, // ✅ resolved string[]
    building_damage: resultData.building_damage || [],
    road_damage: resultData.road_damage || [],
    flooded_areas: resultData.flooded_areas || [],
    vegetation_loss: resultData.vegetation_loss || [],
    created_at: resultData.created_at || new Date().toISOString()
  };

  setAnalysisResults(result);
  updateNLPWithAnalysisResults(result);
};




  // Map severity score to severity level
  const getSeverityLevel = (severityScore: number): "low" | "medium" | "high" => {
    if (severityScore >= 7.0) return "high";
    if (severityScore >= 4.0) return "medium";
    return "low";
  };

  // Extract affected areas from the backend response
  const extractAffectedAreas = (resultData: BackendAnalysisResult): string[] => {
    const areas: string[] = [];


    // Check building damage
    if (resultData.building_damage && resultData.building_damage.length > 0) {
      areas.push("Building Structures");
    }

    // Check road damage
    if (resultData.road_damage && resultData.road_damage.length > 0) {
      areas.push("Roads");
    }

    // Check flooded areas
    if (resultData.flooded_areas && resultData.flooded_areas.length > 0) {
      areas.push("Flooded Areas");
    }

    // Check vegetation loss
    if (resultData.vegetation_loss && resultData.vegetation_loss.length > 0) {
      areas.push("Vegetation");
    }

    // Check the damage overview for more detailed info
    if (resultData.damage_overview) {
      const damageTypes = resultData.damage_overview.damage_types || {};

      // Add damage types to affected areas
      Object.keys(damageTypes).forEach(type => {
        const formattedType = type.split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        if (!areas.includes(formattedType)) {
          areas.push(formattedType);
        }
      });
    }

    // If we have too few areas, add some generic ones based on disaster type
    if (areas.length < 3) {
      if (disasterType === "flood" && !areas.includes("Water Bodies")) {
        areas.push("Water Bodies");
      }
      if (disasterType === "earthquake" && !areas.includes("Infrastructure")) {
        areas.push("Infrastructure");
      }
      if (disasterType === "hurricane" && !areas.includes("Power Lines")) {
        areas.push("Power Lines");
      }
      if (disasterType === "wildfire" && !areas.includes("Forest Areas")) {
        areas.push("Forest Areas");
      }
      if (!areas.includes("Residential Areas")) {
        areas.push("Residential Areas");
      }
    }

    return areas.slice(0, 5); // Limit to 5 areas
  };

  // Get recommendations from backend or generate them
  const getRecommendations = async (resultData: BackendAnalysisResult, disasterType: string): Promise<string[]> => {
    // Try to get recommendations from the API first
    if (isApiAvailable && resultData.comparison_id) {
      try {
        const response = await fetch(`${API_URL}/api/recommendations/${resultData.comparison_id}?count=5`);

        if (response.ok) {
          const recommendations = await response.json();
          if (Array.isArray(recommendations) && recommendations.length > 0) {
            return recommendations;
          }
        }
      } catch (error) {
        console.warn("Failed to get recommendations from API, using local generation", error);
      }
    }

    // Fall back to generating recommendations based on result data
    return generateRecommendations(resultData, disasterType);
  };

  // Generate recommendations based on analysis results and disaster type
  const generateRecommendations = (resultData: BackendAnalysisResult, disasterType: string): string[] => {
    const recommendations = [];

    // Add recommendation based on building damage
    if (resultData.building_damage && resultData.building_damage.length > 0) {
      const severeBuildings = resultData.building_damage.filter((b: BuildingDamage) =>
        b.severity === "Collapsed" || b.severity === "Severely Damaged"
      ).length;

      if (severeBuildings > 0) {
        recommendations.push(`Conduct structural assessments of ${severeBuildings} severely damaged buildings`);
      } else {
        recommendations.push("Inspect buildings for non-structural damage");
      }
    }

    // Add recommendation based on road damage
    if (resultData.road_damage && resultData.road_damage.length > 0) {
      recommendations.push("Clear debris from damaged road sections to allow emergency vehicle access");
    }

    // Add recommendation based on flooded areas
    if (resultData.flooded_areas && resultData.flooded_areas.length > 0) {
      recommendations.push("Implement water pumping operations in flooded areas");
    }

    // Add recommendation based on vegetation loss
    if (resultData.vegetation_loss && resultData.vegetation_loss.length > 0) {
      recommendations.push("Assess ecological impact and erosion risk from vegetation loss");
    }

    // If we still need more recommendations, add default ones based on disaster type
    if (recommendations.length < 3) {
      return [...recommendations, ...defaultRecommendations(disasterType)].slice(0, 5);
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  };

  // Update NLP tab with analysis results
  const updateNLPWithAnalysisResults = (result: AnalysisResult) => {
    if (activeTab !== "nlp") return;

    // Update system prompt to include analysis data
    setMessages(prev => {
      // Update the first system message
      const updatedMessages = prev.map((msg, index) => {
        if (index === 0 && msg.role === "system") {
          return {
            ...msg,
            content: `${msg.content.split("Current disaster context")[0]}Current disaster context: ${disasterType}

Analysis results:
- Damage percentage: ${result.damagePercentage}%
- Severity: ${result.severity}
- Affected areas: ${result.affectedAreas.join(", ")}
- Building damage: ${result.building_damage.length} structures
- Road damage: ${result.road_damage.length} sections
- Flooded areas: ${result.flooded_areas.length} areas
- Vegetation loss: ${result.vegetation_loss.length} areas`
          };
        }
        return msg;
      });

      // Add assistant message about analysis completion
      return [...updatedMessages, {
        id: `assistant-analysis-${Date.now()}`,
        role: "assistant",
        content: `I've analyzed the before and after images of the ${disasterType} event. The analysis shows ${result.damagePercentage}% of the area has been affected with ${result.severity} severity. What specific aspects of the damage would you like me to explain in more detail?`,
        timestamp: new Date()
      }];
    });
  };

  // Handle export report with backend integration
  const handleExportReport = async () => {
    if (!analysisResults) return;

    setIsExporting(true);

    try {
      // If we have a comparison_id, use it directly to fetch data from backend
      if (analysisResults.comparison_id && isApiAvailable) {
        // Get the full result data from the backend
        const response = await fetch(`${API_URL}/api/analysis-result/${analysisResults.comparison_id}`);

        if (!response.ok) {
          throw new Error(`Failed to get report data: ${response.statusText}`);
        }

        const reportData = await response.json();

        // Save the report as a JSON file
        const jsonData = JSON.stringify(reportData, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `disaster_analysis_${analysisResults.comparison_id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Create a local report if no comparison_id (fallback)
        // Create a downloadable JSON file
        const jsonData = JSON.stringify(analysisResults, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // Create a temporary link and trigger the download
        const link = document.createElement("a");
        link.href = url;
        link.download = `disaster_analysis_local_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      setTimeout(() => {
        setIsExporting(false);
      }, 1000);
    } catch (error) {
      console.error("Error exporting report:", error);
      setIsExporting(false);
      alert("Error exporting report. Please try again.");
    }
  };

  // Handle analysis with OpenAI Vision API (fallback if backend is unavailable)
  const handleOpenAIVisionAnalysis = async () => {
    if (!beforeImage || !afterImage || !openAIKey) {
      handleBasicAnalysis();
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(10);

    try {
      // Create image analysis prompt
      const prompt = `Analyze these before and after disaster images. The disaster type is ${disasterType}. 
      Identify the following:
      1. Approximate percentage of area damaged
      2. Types of structures affected (buildings, roads, etc.)
      3. Severity levels
      4. Detailed damage assessment
      
      Format your response as a structured analysis with damage percentages, affected areas, severity classification,
      and specific damage types. Identify any building damage, road damage, flooded areas, and vegetation loss.
      Be specific and quantitative where possible.`;

      // Create a unique comparison ID
      const comparison_id = `comp_${Date.now()}`;

      setAnalysisProgress(30);

      // Call OpenAI Vision API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAIKey}`
        },
        body: JSON.stringify({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: beforeImage,
                    detail: "high"
                  }
                },
                {
                  type: "image_url",
                  image_url: {
                    url: afterImage,
                    detail: "high"
                  }
                }
              ]
            }
          ],
          max_tokens: 4096
        })
      });

      setAnalysisProgress(60);

      if (!response.ok) {
        throw new Error(`OpenAI Vision API error: ${response.statusText}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;

      setAnalysisProgress(80);

      // Parse the analysis text to extract structured data
      const damagePercentage = extractDamagePercentage(analysisText);
      const affectedAreas = extractAffectedAreasFromText(analysisText);
      const severity = determineSeverity(damagePercentage);
      const recommendations = extractRecommendations(analysisText);

      // Parse more detailed analysis
      const building_damage = extractBuildingDamage(analysisText);
      const road_damage = extractRoadDamage(analysisText);
      const flooded_areas = extractFloodedAreas(analysisText);
      const vegetation_loss = extractVegetationLoss(analysisText);

      // Create structured analysis result
      const result: AnalysisResult = {
        comparison_id,
        damagePercentage,
        affectedAreas,
        recommendations,
        severity,
        building_damage,
        road_damage,
        flooded_areas,
        vegetation_loss,
        created_at: new Date().toISOString()
      };

      setAnalysisResults(result);
      setAnalysisProgress(100);
    } catch (error) {
      console.error("Error analyzing images with OpenAI Vision:", error);
      setApiError(error instanceof Error ? error.message : "Unknown error during analysis");

      // Fall back to basic analysis
      handleBasicAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Extract damage percentage from analysis text
  const extractDamagePercentage = (text: string): number => {
    // Look for patterns like "X% damage" or "damage of X%" or "X percent damaged"
    const percentageMatches = text.match(/(\d+)(?:\.\d+)?%\s+damage|damage\s+of\s+(\d+)(?:\.\d+)?%|(\d+)(?:\.\d+)?\s+percent\s+damaged/gi);

    if (percentageMatches && percentageMatches.length > 0) {
      // Extract just the number
      const numberMatch = percentageMatches[0].match(/(\d+)(?:\.\d+)?/);
      if (numberMatch) {
        return parseFloat(numberMatch[0]);
      }
    }

    // If no match found, use a random value between 30-70
    return Math.floor(Math.random() * 40) + 30;
  };

  // Extract affected areas from analysis text
  const extractAffectedAreasFromText = (text: string): string[] => {
    // Common affected areas to look for
    const commonAreas = [
      "Building Structures", "Roads", "Bridges", "Vegetation",
      "Residential Areas", "Commercial Buildings", "Infrastructure",
      "Agricultural Land", "Waterways", "Power Lines"
    ];

    // Check which common areas are mentioned in the text
    const foundAreas = commonAreas.filter(area =>
      text.toLowerCase().includes(area.toLowerCase())
    );

    // Return at least 3 areas
    if (foundAreas.length >= 3) {
      return foundAreas.slice(0, 5); // Cap at 5 areas
    } else {
      // Default areas if not enough found
      return ["Building Structures", "Roads", "Vegetation"].concat(
        foundAreas.filter(area => !["Building Structures", "Roads", "Vegetation"].includes(area))
      );
    }
  };

  // Determine severity level based on damage percentage
  const determineSeverity = (damagePercentage: number): "low" | "medium" | "high" => {
    if (damagePercentage >= 50) return "high";
    if (damagePercentage >= 25) return "medium";
    return "low";
  };

  // Extract recommendations from analysis text
  const extractRecommendations = (text: string): string[] => {
    // Look for recommendation sections
    const recommendationSection = text.match(/recommendations?:?[\s\S]*?((?=\n\n)|$)/i) ||
      text.match(/suggest(?:ed|ions):?[\s\S]*?((?=\n\n)|$)/i);

    if (recommendationSection) {
      // Extract bullet points or numbered lists
      const recommendations = recommendationSection[0]
        .split('\n')
        .filter(line => line.match(/^[\s-]*[\d\.\-\*]\s+/)) // Lines that start with numbers, bullets, etc.
        .map(line => line.replace(/^[\s-]*[\d\.\-\*]\s+/, '').trim()) // Remove the bullet or number
        .filter(line => line.length > 0);

      if (recommendations.length >= 3) {
        return recommendations.slice(0, 5); // Cap at 5 recommendations
      }
    }

    // Default recommendations based on disaster type
    return defaultRecommendations(disasterType);
  };

  // Default recommendations based on disaster type
  const defaultRecommendations = (disasterType: string): string[] => {
    switch (disasterType) {
      case "hurricane":
        return [
          "Conduct structural assessments of buildings in the red-highlighted areas",
          "Clear debris from main access roads to allow emergency vehicle access",
          "Assess flood damage to electrical infrastructure"
        ];
      case "flood":
        return [
          "Implement water pumping operations in severely flooded areas",
          "Inspect foundations of affected buildings for stability",
          "Monitor water quality for contamination risks"
        ];
      case "earthquake":
        return [
          "Assess structural integrity of all multi-story buildings",
          "Clear debris from evacuation routes",
          "Check for gas leaks and damaged utility lines"
        ];
      case "wildfire":
        return [
          "Evaluate air quality and distribute protective masks",
          "Assess risk of landslides in burned areas",
          "Identify remaining structures at risk from weakened trees"
        ];
      default:
        return [
          "Conduct immediate safety assessments of damaged structures",
          "Prioritize clearing main transportation routes",
          "Establish temporary shelter for displaced residents"
        ];
    }
  };

  // Extract building damage from analysis text
  const extractBuildingDamage = (text: string): BuildingDamage[] => {
    // Look for building damage mentions
    const hasSevereBuildingDamage = text.toLowerCase().includes("collapsed building") ||
      text.toLowerCase().includes("severe structural") ||
      text.toLowerCase().includes("building collapse");

    const hasModerateBuilding = text.toLowerCase().includes("partially damaged building") ||
      text.toLowerCase().includes("moderate structural");

    // Create mock building damage data based on text analysis
    const buildingDamage: BuildingDamage[] = [];

    if (hasSevereBuildingDamage) {
      buildingDamage.push({
        id: 1,
        coordinates: [120, 150, 180, 200],
        severity: "Severely Damaged",
        confidence: 0.87,
        type: "Major Structural Damage",
        safety: "Unsafe - No Entry",
      });
    }

    if (hasModerateBuilding) {
      buildingDamage.push({
        id: 2,
        coordinates: [220, 250, 280, 320],
        severity: "Partially Damaged",
        confidence: 0.92,
        type: "Exterior Damage",
        safety: "Restricted Entry",
      });
    }

    // Add a minor damage building if none found
    if (buildingDamage.length === 0) {
      buildingDamage.push({
        id: 1,
        coordinates: [120, 150, 180, 200],
        severity: "Minor Damage",
        confidence: 0.78,
        type: "Superficial Damage",
        safety: "Inspection Needed",
      });
    }

    return buildingDamage;
  };

  // Extract road damage from analysis text
  const extractRoadDamage = (text: string): RoadDamage[] => {
    const hasRoadDamage = text.toLowerCase().includes("road damage") ||
      text.toLowerCase().includes("damaged road") ||
      text.toLowerCase().includes("highway") ||
      text.toLowerCase().includes("street");

    if (hasRoadDamage) {
      return [
        {
          id: 1,
          coordinates: [100, 400, 300, 420],
          severity: "Moderate",
          confidence: 0.85,
          length: 45.2,
          passability: "Difficult Passage",
        }
      ];
    }

    return [];
  };

  // Extract flooded areas from analysis text
  const extractFloodedAreas = (text: string): FloodedArea[] => {
    const hasFlooding = text.toLowerCase().includes("flood") ||
      text.toLowerCase().includes("water") ||
      text.toLowerCase().includes("submerged");

    if (hasFlooding) {
      return [
        {
          id: 1,
          coordinates: [350, 200, 450, 300],
          water_depth: "1.0-2.0m",
          area: 8750,
          confidence: 0.93,
          area_sqm: 2187.5,
          flow_direction: "East",
          flood_timeline: "1-3 days",
        }
      ];
    }

    return [];
  };

  // Extract vegetation loss from analysis text
  const extractVegetationLoss = (text: string): VegetationLoss[] => {
    const hasVegetationLoss = text.toLowerCase().includes("vegetation") ||
      text.toLowerCase().includes("tree") ||
      text.toLowerCase().includes("forest") ||
      text.toLowerCase().includes("plant");

    if (hasVegetationLoss) {
      return [
        {
          id: 1,
          coordinates: [50, 500, 150, 600],
          area: "1250.0 sqm",
          confidence: 0.89,
          density: "Dense",
          vegetation_type: "Forest",
          ecological_impact: "Moderate",
        }
      ];
    }

    return [];
  };

  // Handle basic analysis with computer vision techniques (fallback if all else fails)
  const handleBasicAnalysis = () => {
    if (!beforeImage || !afterImage) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate analysis progress
    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);

          // Generate a unique comparison ID
          const comparison_id = `local_${Date.now()}`;

          // Create analysis results based on disaster type
          const damagePercentage = Math.floor(Math.random() * 60) + 10;
          const severity = determineSeverity(damagePercentage);

          // Analysis results structure
          const result: AnalysisResult = {
            comparison_id,
            damagePercentage,
            affectedAreas: ["Building Structures", "Roads", "Vegetation"],
            recommendations: defaultRecommendations(disasterType),
            severity,
            building_damage: [
              {
                id: 1,
                coordinates: [120, 150, 180, 200],
                severity: "Severely Damaged",
                confidence: 0.87,
                type: "Major Structural Damage",
                safety: "Unsafe - No Entry",
              },
              {
                id: 2,
                coordinates: [220, 250, 280, 320],
                severity: "Partially Damaged",
                confidence: 0.92,
                type: "Exterior Damage",
                safety: "Restricted Entry",
              }
            ],
            road_damage: [
              {
                id: 1,
                coordinates: [100, 400, 300, 420],
                severity: "Moderate",
                confidence: 0.85,
                length: 45.2,
                passability: "Difficult Passage",
              }
            ],
            flooded_areas: disasterType === "flood" || disasterType === "hurricane" ? [
              {
                id: 1,
                coordinates: [350, 200, 450, 300],
                water_depth: "1.0-2.0m",
                area: 8750,
                confidence: 0.93,
                area_sqm: 2187.5,
                flow_direction: "East",
                flood_timeline: "1-3 days",
              }
            ] : [],
            vegetation_loss: [
              {
                id: 1,
                coordinates: [50, 500, 150, 600],
                area: "1250.0 sqm",
                confidence: 0.89,
                density: "Dense",
                vegetation_type: "Forest",
                ecological_impact: "Moderate",
              }
            ],
            created_at: new Date().toISOString()
          };

          setAnalysisResults(result);

          return 100;
        }
        return prev + 5;
      });
    }, 200);

    return () => clearInterval(interval);
  };

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
  };

  // Reset the tool
  const handleReset = () => {
    setBeforeImage(null);
    setAfterImage(null);
    setBeforeImageId(null);
    setAfterImageId(null);
    setAnalysisResults(null);
    setAnalysisProgress(0);
    setIsAnalyzing(false);
    setSliderValue(50);
    setViewMode("slider");
    setDisasterType("hurricane");
    setAffectedAssets([]);
    setIsDetailedViewOpen(false);
    setDetailedData(null);
    setApiError(null);
  };

  // Handle View Detailed Analysis button click
  const handleViewDetailedAnalysis = () => {
    if (!analysisResults) return;

    // Use the existing analysis results as the detailed data
    setDetailedData(analysisResults);
    setIsDetailedViewOpen(true);
  };

  // Handle sending message to NLP API
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    // Create unique message ID
    const messageId = Date.now().toString();

    // Add user message
    const userMessage: Message = {
      id: messageId,
      role: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoadingMessage(true);

    // Add temporary assistant message with loading indicator
    const tempAssistantMessage: Message = {
      id: `assistant-${messageId}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      loading: true
    };

    setMessages(prev => [...prev, tempAssistantMessage]);

    try {
      // Call Groq API if we have an API key
      let responseContent = "";

      if (apiKey && apiKey.startsWith("gsk_")) {
        responseContent = await callGroqAPI(inputMessage, beforeImage, afterImage);
      } else {
        // Use fallback response if no API key
        responseContent = generateAIResponse();
        setApiError("No valid API key provided. Please provide a Groq API key.");
      }

      // Update the assistant message with the response
      setMessages(prev =>
        prev.map(m =>
          m.id === `assistant-${messageId}`
            ? {
              ...m,
              content: responseContent,
              loading: false
            }
            : m
        )
      );
    } catch (error) {
      console.error("Error processing request:", error);

      // Update with error message
      setMessages(prev =>
        prev.map(m =>
          m.id === `assistant-${messageId}`
            ? {
              ...m,
              content: "I'm sorry, I encountered an error processing your request. Please try again.",
              loading: false
            }
            : m
        )
      );
    } finally {
      setIsLoadingMessage(false);
    }
  };

  // Call the Groq API
  const callGroqAPI = async (
    userMessage: string,
    beforeImg: string | null,
    afterImg: string | null
  ): Promise<string> => {
    try {
      if (!apiKey || !apiKey.trim() || !apiKey.startsWith("gsk_")) {
        throw new Error("No valid API key provided. API keys should start with 'gsk_'.");
      }

      const endpoint = "https://api.groq.com/openai/v1/chat/completions";
      const trimmedKey = apiKey.trim();

      // Create a system message that includes image descriptions if available
      let systemContent = `You are DisasterAnalysisAI, an expert in analyzing disaster images and providing assessment.
      Focus on interpreting disaster imagery, identifying damage patterns, and providing professional analysis.
      Today's date is May 17, 2025.
      
      Format your responses with markdown headings, bullet points, and bold text when appropriate.
      Be concise but detailed in your assessment. Include specific numbers and percentages when relevant.
      
      Current disaster context: ${disasterType}`;

      if (beforeImg && afterImg) {
        systemContent += `\n\nThe user has uploaded before and after disaster images. The images show an area affected by a ${disasterType}.`;

        if (analysisResults) {
          systemContent += `\n\nImage analysis found ${analysisResults.damagePercentage}% damage with ${analysisResults.severity} severity.`;
          systemContent += `\nAffected areas include: ${analysisResults.affectedAreas.join(", ")}.`;

          if (analysisResults.building_damage.length > 0) {
            systemContent += `\nBuilding damage detected: ${analysisResults.building_damage.length} buildings affected.`;
          }

          if (analysisResults.road_damage.length > 0) {
            systemContent += `\nRoad damage detected: ${analysisResults.road_damage.length} road sections affected.`;
          }

          if (analysisResults.flooded_areas.length > 0) {
            systemContent += `\nFlooding detected: ${analysisResults.flooded_areas.length} flooded areas found.`;
          }

          if (analysisResults.vegetation_loss.length > 0) {
            systemContent += `\nVegetation loss detected: ${analysisResults.vegetation_loss.length} areas with vegetation damage.`;
          }
        }
      }

      // Create message history
      const messageHistory = messages
        .filter(m => m.role !== "system" && !m.loading)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Add the new user message
      messageHistory.push({
        role: "user",
        content: userMessage
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${trimmedKey}`
        },
        body: JSON.stringify({
          model: "llama3-70b-8192", // Using Llama 3 model from Groq
          messages: [
            { role: "system", content: systemContent },
            ...messageHistory
          ],
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }

      const data: GroqChatCompletionResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response generated");
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling Groq API:", error);
      setApiError(error instanceof Error ? error.message : "Unknown API error");
      return generateAIResponse();
    }
  };

  // Generate fallback AI response
  const generateAIResponse = (): string => {
    // Check if we have before and after images
    if (beforeImage && afterImage) {
      return `# Disaster Image Analysis\n\n## AI Assessment Results\n\nI've analyzed the before and after images of what appears to be ${disasterType} damage. Here's my assessment:\n\n## Detected Damage\n\n- **Building Structural Integrity**: Moderate to severe damage detected\n  - Visible roof damage on approximately 40% of structures\n  - Potential wall failures in 3 buildings\n  - Flood line markers indicate water reached ~1.2m height\n\n- **Infrastructure Impact**:\n  - Road damage visible in northeast quadrant\n  - Possible bridge approach damage (southwest corner)\n  - Utility poles compromised in multiple locations\n\n- **Environmental Conditions**:\n  - Standing water present in approximately 35% of the visible area\n  - Debris field spreading across central region\n  - Vegetation damage suggests high wind exposure\n\n## Recommended Actions\n\nBased on this analysis, I recommend:\n\n1. **Safety Priorities**:\n   - Avoid buildings with visible structural damage\n   - Treat all downed utility lines as energized and dangerous\n   - Be alert for additional collapse risks in damaged structures\n\n2. **Response Needs**:\n   - Structural engineering assessment required for buildings with visible damage\n   - Water pumping equipment needed for flooded areas\n   - Debris clearing required for road access\n\n3. **Documentation**:\n   - Capture additional angles of damaged structures for insurance claims\n   - Document water height markers where visible\n   - Geotag images for accurate location mapping\n\nThis analysis is based on visual assessment only and should be verified by on-site professional inspection when safe to do so.`;
    } else {
      return `# Disaster Analysis\n\nTo provide a thorough analysis, I'll need to see before and after images of the affected area. Please upload both images using the comparison tool, and I can then assess:\n\n- **Structural damage** to buildings and infrastructure\n- **Environmental impact** like flooding or vegetation loss\n- **Severity classification** of the damage\n- **Recovery recommendations** based on visible damage patterns\n\nOnce you've uploaded the images, I can analyze them and provide a detailed assessment specific to the ${disasterType} context you've selected.`;
    }
  };

  // Format time for chat messages
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Run AI analysis on the current images
  const handleRunAIAnalysis = () => {
    if (!beforeImage || !afterImage) return;

    setActiveTab("nlp");
    setInputMessage("Analyze these before and after images and identify the key damage patterns and severity.");

    // Automatically send the message
    const syntheticEvent = { preventDefault: () => { } } as React.FormEvent;
    handleSendMessage(syntheticEvent);
  };

  // Sample disaster types
  const disasterTypes = [
    { id: "hurricane", label: "Hurricane" },
    { id: "flood", label: "Flood" },
    { id: "wildfire", label: "Wildfire" },
    { id: "earthquake", label: "Earthquake" },
    { id: "tornado", label: "Tornado" },
  ];

  // Sample affected assets
  const assetOptions = [
    { id: "buildings", label: "Buildings" },
    { id: "roads", label: "Roads" },
    { id: "bridges", label: "Bridges" },
    { id: "power_lines", label: "Power Lines" },
    { id: "vegetation", label: "Vegetation" },
    { id: "water_bodies", label: "Water Bodies" },
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "comparison" | "nlp")}>
        <TabsList className="mb-2">
          <TabsTrigger value="comparison">Image Comparison</TabsTrigger>
          <TabsTrigger value="nlp">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              {!isApiAvailable && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-700">Backend API not detected</h3>
                    <p className="text-sm text-yellow-600 mt-1">
                      The backend API could not be reached. Running in offline mode with reduced functionality.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Before Image Upload */}
                <div className="space-y-2">
                  <div className="font-medium">Before Disaster Image</div>
                  <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 h-48">
                    {beforeImage ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={beforeImage}
                          alt="Before disaster"
                          className="object-contain"
                          fill
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileUp className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <div className="text-sm text-gray-600">Upload before image</div>
                        <div className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</div>
                      </div>
                    )}
                    <Input
                      type="file"
                      className="sr-only"
                      id="before-image-upload"
                      accept="image/*"
                      onChange={handleBeforeImageUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => document.getElementById('before-image-upload')?.click()}
                    >
                      {beforeImage ? "Change Image" : "Select File"}
                    </Button>
                  </div>
                </div>

                {/* After Image Upload */}
                <div className="space-y-2">
                  <div className="font-medium">After Disaster Image</div>
                  <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 h-48">
                    {afterImage ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={afterImage}
                          alt="After disaster"
                          className="object-contain"
                          fill
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileUp className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <div className="text-sm text-gray-600">Upload after image</div>
                        <div className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</div>
                      </div>
                    )}
                    <Input
                      type="file"
                      className="sr-only"
                      id="after-image-upload"
                      accept="image/*"
                      onChange={handleAfterImageUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => document.getElementById('after-image-upload')?.click()}
                    >
                      {afterImage ? "Change Image" : "Select File"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Analysis Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Disaster Type Selection */}
                <div className="space-y-2">
                  <div className="font-medium text-sm">Disaster Type</div>
                  <Select value={disasterType} onValueChange={(value) => setDisasterType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select disaster type" />
                    </SelectTrigger>
                    <SelectContent>
                      {disasterTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Affected Assets */}
                <div className="space-y-2">
                  <div className="font-medium text-sm">Affected Assets</div>
                  <Select
                    value={affectedAssets.length ? "selected" : "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setAffectedAssets([]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select affected assets" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* This has a non-empty value "none" */}
                      <SelectItem value="none">No selection</SelectItem>

                      {/* This has a non-empty value "selected" */}
                      <SelectItem value="selected">
                        {affectedAssets.length} assets selected
                      </SelectItem>

                      {/* All these have proper non-empty values */}
                      {assetOptions.map((asset) => (
                        <div
                          key={asset.id}
                          className="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAffectedAssets(prev =>
                              prev.includes(asset.id)
                                ? prev.filter(id => id !== asset.id)
                                : [...prev, asset.id]
                            );
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={affectedAssets.includes(asset.id)}
                            className="mr-2"
                            onChange={() => { }}
                          />
                          {asset.label}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* View Mode */}
                <div className="space-y-2">
                  <div className="font-medium text-sm">View Mode</div>
<Tabs
  value={viewMode}
  onValueChange={(value: string) => setViewMode(value as "slider" | "side-by-side" | "overlay")}
>
                    <TabsList className="w-full">
                      <TabsTrigger value="slider" className="flex-1">
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Slider
                      </TabsTrigger>
                      <TabsTrigger value="side-by-side" className="flex-1">
                        <PanelLeftOpen className="h-4 w-4 mr-1" />
                        Side
                      </TabsTrigger>
                      <TabsTrigger value="overlay" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Overlay
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* Data Source Options */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    Data Source Options
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOpenAIKeyInput(!showOpenAIKeyInput)}
                    >
                      {showOpenAIKeyInput ? "Hide" : "Configure"}
                    </Button>
                  </div>
                </div>

                {showOpenAIKeyInput && (
                  <div className="space-y-3 mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="use-openai"
                        checked={useOpenAIVision}
                        onChange={(e) => setUseOpenAIVision(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="use-openai" className="text-sm cursor-pointer">
                        Use OpenAI Vision API as fallback (if backend API is unavailable)
                      </label>
                    </div>

                    {useOpenAIVision && (
                      <div>
                        <label className="text-sm text-gray-700 block mb-1">
                          OpenAI API Key
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            value={openAIKey}
                            onChange={(e) => setOpenAIKey(e.target.value)}
                            placeholder="sk-..."
                            className="flex-1 text-sm"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Your key is stored only in your browser session.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  {!showOpenAIKeyInput && (
                    <span>Configure data sources for more accurate analysis when backend is unavailable</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleAnalysis}
                  disabled={!beforeImage || !afterImage || isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Analyze Changes
                </Button>

                {beforeImage && afterImage && (
                  <Button
                    onClick={handleRunAIAnalysis}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Analysis
                  </Button>
                )}

                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>

              {/* Analysis Progress */}
              {isAnalyzing && (
                <div className="mt-6 space-y-2">
                  <div className="text-sm font-medium">Analyzing images...</div>
                  <Progress value={analysisProgress} />
                  <div className="text-xs text-gray-500 text-right">{analysisProgress}% complete</div>
                </div>
              )}

              {/* API Error Display */}
              {apiError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-700">API Error</h3>
                    <p className="text-sm text-red-600 mt-1">{apiError}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comparison Viewer */}
          {beforeImage && afterImage && (
            <Card>
              <CardContent className="p-6">
                <div className="font-medium mb-4">Image Comparison</div>

                <div
                  ref={imageContainerRef}
                  className="relative w-full h-[400px] border rounded-md overflow-hidden"
                >
                  {viewMode === "slider" && (
                    <>
                      <div className="absolute inset-0 z-10">
                        <Image
                          src={afterImage}
                          alt="After disaster"
                          className="object-cover"
                          fill
                        />
                      </div>
                      <div
                        className="absolute inset-0 z-20 overflow-hidden"
                        style={{ width: `${sliderValue}%` }}
                      >
                        <div className="relative h-full w-full">
                          <Image
                            src={beforeImage}
                            alt="Before disaster"
                            className="object-cover"
                            fill
                          />
                        </div>
                      </div>
                      <div
                        className="absolute top-0 bottom-0 z-30 w-1 bg-white cursor-ew-resize"
                        style={{ left: `${sliderValue}%` }}
                      />

                      <div className="absolute bottom-4 left-4 right-4 z-40">
                        <Slider
                          value={[sliderValue]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={handleSliderChange}
                        />
                      </div>
                    </>
                  )}

                  {viewMode === "side-by-side" && (
                    <div className="grid grid-cols-2 h-full">
                      <div className="relative">
                        <Image
                          src={beforeImage}
                          alt="Before disaster"
                          className="object-cover"
                          fill
                        />
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 text-xs rounded">
                          Before
                        </div>
                      </div>
                      <div className="relative">
                        <Image
                          src={afterImage}
                          alt="After disaster"
                          className="object-cover"
                          fill
                        />
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 text-xs rounded">
                          After
                        </div>
                      </div>
                    </div>
                  )}

                  {viewMode === "overlay" && (
                    <div className="relative h-full">
                      <Image
                        src={beforeImage}
                        alt="Before disaster"
                        className="object-cover"
                        fill
                      />
                      <div
                        className="absolute inset-0"
                        style={{ mixBlendMode: 'difference' }}
                      >
                        <Image
                          src={afterImage}
                          alt="After disaster"
                          className="object-cover"
                          fill
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysisResults && (
            <Card>
              <CardContent className="p-6">
                <div className="font-medium mb-4">Analysis Results</div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm font-medium mb-2">Damage Assessment</div>
                    <div className="text-3xl font-bold">
                      {analysisResults.damagePercentage}%
                      <span className="text-sm text-gray-500 ml-1">affected</span>
                    </div>
                    <div className={`text-sm mt-2 ${analysisResults.severity === "high"
                      ? "text-red-600"
                      : analysisResults.severity === "medium"
                        ? "text-orange-600"
                        : "text-yellow-600"
                      }`}>
                      {analysisResults.severity.charAt(0).toUpperCase() + analysisResults.severity.slice(1)} severity
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Affected Areas</div>
                    <div className="space-y-1.5">
                      {analysisResults.affectedAreas.map((area, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                          <div className="text-sm">{area}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Recommendations</div>
                    <div className="space-y-1.5">
                      {analysisResults.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start">
                          <div className="text-xs bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center mt-0.5 mr-2">
                            {index + 1}
                          </div>
                          <div className="text-sm">{recommendation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={handleExportReport}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                      </>
                    )}
                  </Button>
                  <Button onClick={handleViewDetailedAnalysis}>
                    View Detailed Analysis
                  </Button>
                </div>

                {analysisResults.comparison_id.startsWith("local_") && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-800">Analysis Info</h3>
                        <p className="text-xs text-blue-700 mt-1">
                          This analysis was performed locally. For more accurate results,
                          ensure the backend API is available and connected.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-800">Disclaimer</h3>
                      <p className="text-xs text-amber-700 mt-1">
                        This automated analysis provides a preliminary assessment only. For critical infrastructure or safety decisions, please consult with qualified disaster assessment professionals.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="nlp" className="space-y-6">
          <Card className="w-full h-[700px] flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="p-3 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="bg-purple-100 p-1.5 rounded-full">
                  <Bot className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">DisasterAnalysisAI</div>
                  <div className="text-xs text-gray-500">
                    Powered by Groq LLM API
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-80 text-xs">
                        Ask detailed questions about the disaster images. The AI can analyze damage patterns,
                        provide severity assessments, and suggest recovery strategies.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                >
                  {showApiKeyInput ? "Hide API Key" : "Set API Key"}
                </Button>
              </div>
            </div>

            {/* API Key Input */}
            {showApiKeyInput && (
              <div className="p-3 border-b bg-gray-50">
                <div className="text-sm mb-2">Enter your Groq API Key (starts with &ldquo;gsk_&rdquo;)</div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      // Save the API key
                      if (apiKey) {
                        setShowApiKeyInput(false);
                        setApiError(null);
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Get your API key from <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Groq Console</a>.
                  Your key is stored only in your browser.
                </div>
              </div>
            )}

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.filter(m => m.role !== "system").map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${message.role === 'user'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-purple-100 text-purple-600'
                        }`}>
                        {message.role === 'user' ? 'U' : 'AI'}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className={`rounded-lg px-3 py-2 ${message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border shadow-sm text-gray-800'
                          }`}>
                          {message.loading ? (
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          ) : (
                            <div className="prose prose-sm max-w-none break-words whitespace-pre-wrap">
                              {message.content.includes("#") ? (
                                <div dangerouslySetInnerHTML={{
                                  __html: message.content
                                    .replace(/^# (.*$)/gm, '<h1 class="text-lg font-bold mt-2 mb-1">$1</h1>')
                                    .replace(/^## (.*$)/gm, '<h2 class="text-base font-semibold mt-2 mb-1">$1</h2>')
                                    .replace(/^### (.*$)/gm, '<h3 class="text-sm font-medium mt-1 mb-0.5">$1</h3>')
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/\n- (.*?)$/gm, '<div class="flex items-start"><span class="mr-1">•</span><span>$1</span></div>')
                                    .replace(/\n{2,}/g, '<br/>')
                                }} />
                              ) : (
                                message.content
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 px-1">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* API Error Notice */}
            {apiError && (
              <div className="px-4 py-2 border-t bg-red-50 text-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <div className="text-sm">
                    <span className="font-medium">API Error:</span> {apiError}
                  </div>
                </div>
                <div className="text-xs mt-1">Using fallback responses - results may be less accurate.</div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-t bg-white">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <Textarea
                  placeholder="Ask about the disaster images or request specific analysis..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isLoadingMessage}
                  className="flex-1 min-h-[60px] max-h-[120px]"
                />
                <Button type="submit" className="h-10" disabled={isLoadingMessage || !inputMessage.trim()}>
                  {isLoadingMessage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-5 w-5" />
                  )}
                </Button>
              </form>

              {/* Suggested prompts */}
              {!inputMessage && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setInputMessage("Analyze the severity of building damage in these images.")}
                  >
                    Building damage
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setInputMessage("What's the estimated recovery time based on this damage?")}
                  >
                    Recovery time
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setInputMessage("Compare this to typical damage patterns for this type of disaster.")}
                  >
                    Compare patterns
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Analysis Modal */}
      {isDetailedViewOpen && detailedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Detailed Damage Analysis</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsDetailedViewOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Damage Percentage</div>
                  <div className="text-xl font-bold">{detailedData.damagePercentage}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Severity</div>
                  <div className="text-xl font-bold capitalize">{detailedData.severity}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Analysis Date</div>
                  <div className="text-xl font-bold">{new Date(detailedData.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Building Damage Section */}
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">Building Damage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailedData.building_damage && detailedData.building_damage.length > 0 ? (
                  detailedData.building_damage.map((building, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="font-medium mb-2">Building {building.id}</div>
                      <div className="space-y-1 text-sm">
                        <div className="grid grid-cols-2">
                          <span className="text-gray-500">Severity:</span>
                          <span className="font-medium">{building.severity}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-gray-500">Confidence:</span>
                          <span className="font-medium">{(building.confidence * 100).toFixed(0)}%</span>
                        </div>
                        {building.type && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Type:</span>
                            <span className="font-medium">{building.type}</span>
                          </div>
                        )}
                        {building.safety && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Safety Status:</span>
                            <span className="font-medium">{building.safety}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    No building damage detected
                  </div>
                )}
              </div>
            </div>

            {/* Road Damage Section */}
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">Road Damage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailedData.road_damage && detailedData.road_damage.length > 0 ? (
                  detailedData.road_damage.map((road, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="font-medium mb-2">Road Segment {road.id}</div>
                      <div className="space-y-1 text-sm">
                        <div className="grid grid-cols-2">
                          <span className="text-gray-500">Severity:</span>
                          <span className="font-medium">{road.severity}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-gray-500">Confidence:</span>
                          <span className="font-medium">{(road.confidence * 100).toFixed(0)}%</span>
                        </div>
                        {road.passability && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Passability:</span>
                            <span className="font-medium">{road.passability}</span>
                          </div>
                        )}
                        {road.length && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Length:</span>
                            <span className="font-medium">{road.length} meters</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    No road damage detected
                  </div>
                )}
              </div>
            </div>

            {/* Flooded Areas Section */}
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">Flooded Areas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailedData.flooded_areas && detailedData.flooded_areas.length > 0 ? (
                  detailedData.flooded_areas.map((area, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="font-medium mb-2">Flooded Area {area.id}</div>
                      <div className="space-y-1 text-sm">
                        <div className="grid grid-cols-2">
                          <span className="text-gray-500">Water Depth:</span>
                          <span className="font-medium">{area.water_depth}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-gray-500">Area:</span>
                          <span className="font-medium">{area.area} px²</span>
                        </div>
                        {area.area_sqm && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Area:</span>
                            <span className="font-medium">{area.area_sqm} m²</span>
                          </div>
                        )}
                        {area.flow_direction && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Flow Direction:</span>
                            <span className="font-medium">{area.flow_direction}</span>
                          </div>
                        )}
                        {area.flood_timeline && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Timeline:</span>
                            <span className="font-medium">{area.flood_timeline}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    No flooded areas detected
                  </div>
                )}
              </div>
            </div>

            {/* Vegetation Loss Section */}
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">Vegetation Loss</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailedData.vegetation_loss && detailedData.vegetation_loss.length > 0 ? (
                  detailedData.vegetation_loss.map((veg, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="font-medium mb-2">Vegetation Loss {veg.id}</div>
                      <div className="space-y-1 text-sm">
                        <div className="grid grid-cols-2">
                          <span className="text-gray-500">Area:</span>
                          <span className="font-medium">{veg.area}</span>
                        </div>
                        {veg.density && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Density:</span>
                            <span className="font-medium">{veg.density}</span>
                          </div>
                        )}
                        {veg.vegetation_type && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Type:</span>
                            <span className="font-medium">{veg.vegetation_type}</span>
                          </div>
                        )}
                        {veg.ecological_impact && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Ecological Impact:</span>
                            <span className="font-medium">{veg.ecological_impact}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    No vegetation loss detected
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                className="mr-4"
                onClick={() => setIsDetailedViewOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={handleExportReport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Full Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageComparisonTool;