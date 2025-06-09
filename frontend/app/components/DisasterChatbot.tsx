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
  BookOpen,
  Database,
  Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Import utility for vector operations (for RAG implementation)
import { create, all } from "mathjs";
const math = create(all);

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
  retrievalSources?: string[];
}

// RAG Knowledge Base Interface
interface KnowledgeEntry {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    title: string;
    source: string;
    disasterType?: string;
    region?: string;
    date?: string;
  };
}

// Building damage interface
interface BuildingDamage {
  id: number;
  coordinates: number[];
  severity: string;
  confidence: number;
  type: string;
  safety: string;
}

// Road damage interface
interface RoadDamage {
  id: number;
  coordinates: number[];
  severity: string;
  confidence: number;
  length: number;
  passability: string;
}

// Flooded area interface
interface FloodedArea {
  id: number;
  coordinates: number[];
  water_depth: string;
  area: number;
  confidence: number;
  area_sqm: number;
  flow_direction: string;
  flood_timeline: string;
}

// Vegetation loss interface
interface VegetationLoss {
  id: number;
  coordinates: number[];
  area: string;
  confidence: number;
  density: string;
  vegetation_type: string;
  ecological_impact: string;
}

// Analysis results interface
interface AnalysisResults {
  comparison_id?: string;
  damagePercentage: number;
  affectedAreas: string[];
  recommendations: string[];
  severity: "low" | "medium" | "high";
  building_damage?: BuildingDamage[];
  road_damage?: RoadDamage[];
  flooded_areas?: FloodedArea[];
  vegetation_loss?: VegetationLoss[];
}

// Mock knowledge base for disaster analysis (in a real implementation, this would be stored in a database)
const disasterKnowledgeBase: KnowledgeEntry[] = [
  {
    id: "kb-001",
    content: "Hurricane damage is characterized by wind-related structural failures, water intrusion, and flooding. Common patterns include roof damage, broken windows, and water line marks on walls. Response should prioritize structural assessment, water removal, and addressing mold risk.",
    embedding: Array(128).fill(0).map(() => Math.random() * 2 - 1), // Mock embedding vector
    metadata: {
      title: "Hurricane Damage Assessment Guidelines",
      source: "National Hurricane Center",
      disasterType: "hurricane",
      region: "coastal"
    }
  },
  {
    id: "kb-002",
    content: "Flood damage assessment should focus on water height markers, structural foundation damage, and contamination risks. Key indicators include water lines on walls, warped materials, and visible mold. Electrical systems may require complete replacement.",
    embedding: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    metadata: {
      title: "Flood Damage Evaluation Protocol",
      source: "FEMA",
      disasterType: "flood"
    }
  },
  {
    id: "kb-003",
    content: "Wildfire damage presents as complete structural destruction, smoke damage, or heat damage to nearby structures. Assessment should include standing structures for hidden heat damage and smoke infiltration. Soil erosion and watershed damage are secondary concerns.",
    embedding: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    metadata: {
      title: "Wildfire Impact Analysis",
      source: "U.S. Forest Service",
      disasterType: "wildfire"
    }
  },
  {
    id: "kb-004",
    content: "Earthquake damage is identified through cracks in load-bearing walls, foundation shifting, and collapsed structures. Gravity-related secondary damage is common. Assessment must include structural integrity evaluation even when external damage appears minimal.",
    embedding: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    metadata: {
      title: "Earthquake Damage Assessment Guide",
      source: "USGS",
      disasterType: "earthquake"
    }
  },
  {
    id: "kb-005",
    content: "Tornado damage presents in a clear path with exponentially decreasing damage from the center. Complete destruction at EF5 level, with progressive patterns of roof damage, wall failure, and debris impact at lower intensity levels.",
    embedding: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    metadata: {
      title: "Tornado Damage Patterns",
      source: "National Weather Service",
      disasterType: "tornado"
    }
  },
  {
    id: "kb-006",
    content: "भुकम्प पछिको क्षति मूल्यांकन गर्दा भवनहरूको संरचनात्मक अखण्डताको जांच, आधारभूत प्रणालीहरूको कार्यक्षमता, र ढलान क्षेत्रहरूमा ध्यान केन्द्रित गर्नुपर्छ। थप आफ्टरशकको जोखिमलाई पनि ध्यानमा राख्नुपर्छ।",
    embedding: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    metadata: {
      title: "नेपालमा भुकम्प क्षति मूल्यांकन",
      source: "Nepal Disaster Risk Reduction Portal",
      disasterType: "earthquake",
      region: "nepal"
    }
  },
  {
    id: "kb-007",
    content: "नेपालमा बाढीको क्षति मूल्यांकन गर्दा नदी किनारका संरचनाहरू, पहिरो जोखिम, र कृषि भूमिमा परेको प्रभावमा विशेष ध्यान दिनुपर्छ। मनसुन अवधिमा अतिरिक्त सावधानी आवश्यक छ।",
    embedding: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    metadata: {
      title: "नेपालमा बाढी प्रभाव मूल्यांकन",
      source: "Nepal Water Resource Management",
      disasterType: "flood",
      region: "nepal"
    }
  },
  {
    id: "kb-008",
    content: "हरिकेन क्षतिग्रस्त संरचनाहरूमा छतको ह्रास, भित्ताको विफलता, र पानीको क्षति सामान्य हुन्छ। प्राथमिक प्रतिक्रियामा अस्थायी छतहरू स्थापना गर्ने, बिजुलीको जांच, र ढलान पदार्थहरू हटाउने समावेश हुनुपर्छ।",
    embedding: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    metadata: {
      title: "आँधीबेहरी क्षति प्रतिक्रिया प्रोटोकल",
      source: "Nepal Emergency Response Guidelines",
      disasterType: "hurricane",
      region: "nepal"
    }
  },
  {
    id: "kb-009",
    content: "Building damage from earthquakes in Nepal is characterized by pancake collapse in unreinforced concrete structures, while traditional wood and brick buildings often show X-shaped cracks in walls. Community resilience relies on rapid assessment and categorization with red/yellow/green tagging system.",
    embedding: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    metadata: {
      title: "Nepal Earthquake Damage Patterns",
      source: "Kathmandu Resilience Initiative",
      disasterType: "earthquake",
      region: "nepal"
    }
  },
  {
    id: "kb-010",
    content: "In Nepal's mountainous regions, landslide risk assessment follows disaster events using satellite imagery comparison, focusing on slope stability, vegetation loss patterns, and infrastructure vulnerability at the toe of slopes.",
    embedding: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    metadata: {
      title: "Mountain Disaster Assessment",
      source: "Nepal Geological Survey",
      disasterType: "landslide",
      region: "nepal"
    }
  }
];

// Nepali disaster-related phrases for RAG results
const nepaliPhrases = {
  hurricaneDamage: "हावाहुरीको क्षति विशेष गरी छत उडाउने, रूखहरू ढाल्ने, र बाढीको कारणले हुन्छ। छतको क्षति, भवन संरचनामा पानी प्रवेश, र विद्युतीय प्रणालीमा समस्याहरू आम हुन्।",
  floodDamage: "बाढीको क्षति पहिचान गर्न भित्तामा पानीको चिन्ह, भवनको जगमा क्षति, र ढुसी वृद्धि हेर्नुपर्छ। बाढी पछि प्रदूषित पानीको कारणले स्वास्थ्य जोखिम पनि बढ्छ।",
  earthquakeDamage: "भूकम्पको क्षति मूल्यांकन गर्दा भवनको जगमा चर्काइ, भित्तामा X-आकारको चर्काइ, र ढलान संरचनामा क्षति हेर्नुपर्छ। भूकम्प पछि आगलागी र पहिरोको जोखिम पनि बढ्छ।",
  tornadoDamage: "टोर्नेडोको क्षति एउटा स्पष्ट मार्गमा देखिन्छ, जहाँ केन्द्रबाट बाहिरतिर क्षति क्रमशः कम हुँदै जान्छ। पूर्ण विनाशदेखि छत उडाउने र भित्ता भत्काउने सम्मका विभिन्न स्तरका क्षति देखिन सक्छन्।",
  wildfireDamage: "वन्य आगलागीको क्षति मूल्यांकन गर्दा पूर्ण जलेका संरचना, धुवाँको क्षति, र ताप प्रभाव हेर्नुपर्छ। वरिपरिको वनस्पति क्षति र माटो क्षय पनि महत्त्वपूर्ण सूचकहरू हुन्।"
};

const ImageComparisonTool = () => {
  // State for uploaded images
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);

  // State for analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);

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
  const [detailedData, setDetailedData] = useState<AnalysisResults | null>(null);

  // State for export progress
  const [isExporting, setIsExporting] = useState(false);
  // Add this with your other useState declarations at the top of the component
const [, setRetrievalResults] = useState<KnowledgeEntry[]>([]);

  // State for RAG
  const [useRAG, setUseRAG] = useState(true);
  const [showRetrievalSources, setShowRetrievalSources] = useState(false);

  // State for NLP analysis
  const [activeTab, setActiveTab] = useState<"comparison" | "nlp">("comparison");
  const [apiKey, setApiKey] = useState("");
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
      
      IMPORTANT: You are bilingual in English and Nepali. If the user writes to you in Nepali, respond in Nepali.
      If the user writes in English, respond in English. Always match the user's language choice.
      
      Current disaster context: ${disasterType}`,
      timestamp: new Date()
    },
    {
      id: "welcome",
      role: "assistant",
      content: "I'm DisasterAnalysisAI, your expert for disaster image analysis. Upload before and after images, and I can help analyze damage patterns, severity, and suggest response strategies. मलाई नेपालीमा पनि प्रश्न सोध्न सक्नुहुन्छ र म नेपालीमा जवाफ दिनेछु।",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // References for the image container
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Add language preference state and modal control
// Add language preference state and modal control
const [preferredLanguage, setPreferredLanguage] = useState<"en" | "ne" | "auto">("auto");
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // State for emergency contacts modal
  const [showEmergencyContactsModal, setShowEmergencyContactsModal] = useState(false);

  // Sample emergency contact data for Nepal
  const emergencyContacts = {
    "nepal": [
      { name: "Nepal Police", number: "100", english: "Emergency Police", nepali: "आपतकालीन प्रहरी" },
      { name: "Nepal Army", number: "115", english: "Emergency Army", nepali: "आपतकालीन सेना" },
      { name: "Nepal Ambulance", number: "102", english: "Ambulance Service", nepali: "एम्बुलेन्स सेवा" },
      { name: "NRA", number: "+977-1-4211482", english: "National Reconstruction Authority", nepali: "राष्ट्रिय पुनर्निर्माण प्राधिकरण" },
      { name: "NDRRMA", number: "+977-1-5336628", english: "National Disaster Risk Reduction & Management Authority", nepali: "राष्ट्रिय विपद् जोखिम न्यूनीकरण तथा व्यवस्थापन प्राधिकरण" }
    ]
  };

  // Utility function to detect Nepali text
  const isNepaliText = (text: string): boolean => {
    // Nepali Unicode range (approximately)
    const nepaliRegex = /[\u0900-\u097F]/;
    return nepaliRegex.test(text);
  };

  // Function to format language-specific text based on preference
  const getLocalizedText = (enText: string, neText: string): string => {
    if (preferredLanguage === "en") return enText;
    if (preferredLanguage === "ne") return neText;
    // For auto, we'll use the most recent message language as a hint
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMessage && isNepaliText(lastUserMessage.content)) {
      return neText;
    }
    return enText; // Default to English
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (activeTab === "nlp") {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  // Update system message when disaster type changes
  useEffect(() => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === "system-1"
          ? {
            ...msg,
            content: `You are DisasterAnalysisAI, an expert in analyzing disaster images and providing assessment.
              Focus on interpreting disaster imagery, identifying damage patterns, and providing professional analysis.
              Today's date is May 17, 2025.
              
              Format your responses with markdown headings, bullet points, and bold text when appropriate.
              Be concise but detailed in your assessment. Include specific numbers and percentages when relevant.
              
              IMPORTANT: You are bilingual in English and Nepali. If the user writes to you in Nepali, respond in Nepali.
              If the user writes in English, respond in English. Always match the user's language choice.
              
              Current disaster context: ${disasterType}`
          }
          : msg
      )
    );
  }, [disasterType]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // RAG implementation - Generate mock embeddings
  const generateEmbedding = (text: string): number[] => {
    // In a real implementation, this would call an embedding API
    // For this example, we'll create a simple mock embedding
    const seed = text.length;
    return Array(128).fill(0).map((_, i) =>
      Math.sin(seed * (i + 1) / 128) * Math.cos(i / 10)
    );
  };

  // RAG implementation - Compute cosine similarity between two vectors
  const cosineSimilarity = (a: number[], b: number[]): number => {
    const dotProduct = math.dot(a, b);
    const magnitudeA = Math.sqrt(math.dot(a, a));
    const magnitudeB = Math.sqrt(math.dot(b, b));
    return dotProduct / (magnitudeA * magnitudeB);
  };

  // RAG implementation - Retrieve relevant knowledge entries
  const retrieveKnowledge = (query: string, n: number = 3): KnowledgeEntry[] => {
    // Generate embedding for the query
    const queryEmbedding = generateEmbedding(query);

    // Filter knowledge base by disaster type first
    const filteredKnowledgeBase = disasterKnowledgeBase.filter(entry =>
      !entry.metadata.disasterType ||
      entry.metadata.disasterType === disasterType
    );

    // Calculate similarity scores
    const scoredEntries = filteredKnowledgeBase.map(entry => ({
      entry,
      score: cosineSimilarity(queryEmbedding, entry.embedding)
    }));

    // Check if the query is in Nepali
    const isNepali = isNepaliText(query);

    // Prioritize entries in the same language
    const languageBoostedEntries = scoredEntries.map(item => ({
      ...item,
      score: item.score * (
        (isNepali && (isNepaliText(item.entry.content) ||
          item.entry.metadata.region === "nepal")) ? 1.5 : 1
      )
    }));

    // Sort by similarity score and take top n
    return languageBoostedEntries
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map(item => item.entry);
  };

  // Handle before image upload
  const handleBeforeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBeforeImage(event.target?.result as string);
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
        setAfterImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle analysis
  const handleAnalysis = () => {
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
          const comparison_id = `comp_${Date.now()}`;

          // Mock analysis results
          const mockResults: AnalysisResults = {
            comparison_id: comparison_id,
            damagePercentage: Math.floor(Math.random() * 60) + 10,
            affectedAreas: ["Building Structures", "Roads", "Vegetation"],
            recommendations: [
              "Conduct structural assessments of buildings in the red-highlighted areas",
              "Clear debris from main access roads to allow emergency vehicle access",
              "Assess flood damage to electrical infrastructure",
            ],
            severity: Math.random() > 0.6 ? "high" : Math.random() > 0.3 ? "medium" : "low",
            // Add mock data for detailed analysis
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
              },
            ],
            road_damage: [
              {
                id: 1,
                coordinates: [100, 400, 300, 420],
                severity: "Moderate",
                confidence: 0.85,
                length: 45.2,
                passability: "Difficult Passage",
              },
            ],
            flooded_areas: [
              {
                id: 1,
                coordinates: [350, 200, 450, 300],
                water_depth: "1.0-2.0m",
                area: 8750,
                confidence: 0.93,
                area_sqm: 2187.5,
                flow_direction: "East",
                flood_timeline: "1-3 days",
              },
            ],
            vegetation_loss: [
              {
                id: 1,
                coordinates: [50, 500, 150, 600],
                area: "1250.0 sqm",
                confidence: 0.89,
                density: "Dense",
                vegetation_type: "Forest",
                ecological_impact: "Moderate",
              },
            ],
          };

          setAnalysisResults(mockResults);

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
    setAnalysisResults(null);
    setAnalysisProgress(0);
    setIsAnalyzing(false);
    setSliderValue(50);
    setViewMode("slider");
    setDisasterType("hurricane");
    setAffectedAssets([]);
    setIsDetailedViewOpen(false);
    setDetailedData(null);
setRetrievalResults([]);

  };

  // Handle View Detailed Analysis button click
  const handleViewDetailedAnalysis = () => {
    if (!analysisResults) return;

    // Use the existing analysis results as the detailed data
    setDetailedData(analysisResults);
    setIsDetailedViewOpen(true);

    // In a real implementation, you might fetch more detailed data from the backend
    // const comparison_id = analysisResults.comparison_id;
    // fetch(`/api/analysis-result/${comparison_id}`)
    //   .then(response => response.json())
    //   .then(data => {
    //     setDetailedData(data);
    //     setIsDetailedViewOpen(true);
    //   })
    //   .catch(error => console.error("Error fetching detailed analysis:", error));
  };

  // Handle Export Report button click
  const handleExportReport = () => {
    if (!analysisResults) return;

    setIsExporting(true);

    // Create a comparison_id if it doesn't exist
    const comparison_id = analysisResults.comparison_id || `report_${Date.now()}`;

    // Prepare the export data
    const exportData = {
      id: comparison_id,
      name: `Disaster Analysis Report - ${disasterType}`,
      description: `Analysis for ${disasterType} disaster`,
      comparison_id: comparison_id,
      created_at: new Date().toISOString(),
      tags: [disasterType, ...affectedAssets]
    };

    // Simulate an API call to save and generate the report
    setTimeout(() => {
      console.log("Exporting report:", exportData);

      // In a real implementation, you would make an actual API call:
      // fetch('/api/saved-analyses', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(exportData)
      // })
      // .then(response => response.json())
      // .then(data => {
      //   // Trigger download
      //   window.location.href = `/api/saved-analyses/${data.id}?download=true`;
      //   setIsExporting(false);
      // })
      // .catch(error => {
      //   console.error("Error exporting report:", error);
      //   setIsExporting(false);
      // });

      // For now, we'll just simulate a successful export
      alert("Report exported successfully!");
      setIsExporting(false);
    }, 1500);
  };

  // Handle sending message to NLP API
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    // Create unique message ID
    const messageId = Date.now().toString();

    // Run RAG if enabled to retrieve relevant knowledge
    let relevantEntries: KnowledgeEntry[] = [];
    if (useRAG) {
      relevantEntries = retrieveKnowledge(inputMessage, 3);
      setRetrievalResults(relevantEntries);
    }

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
        responseContent = await callGroqAPI(inputMessage, beforeImage, afterImage, relevantEntries);
      } else {
        // Use fallback response if no API key
        responseContent = generateAIResponse(inputMessage, relevantEntries);
        setApiError("No valid API key provided. Please provide a Groq API key.");
      }

      // Update the assistant message with the response
      setMessages(prev =>
        prev.map(m =>
          m.id === `assistant-${messageId}`
            ? {
              ...m,
              content: responseContent,
              loading: false,
              retrievalSources: relevantEntries.map(entry => entry.metadata.title)
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
              content: isNepaliText(inputMessage)
                ? "माफ गर्नुहोस्, तपाईंको अनुरोध प्रशोधन गर्दा मलाई त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।"
                : "I'm sorry, I encountered an error processing your request. Please try again.",
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
    afterImg: string | null,
    retrievedEntries: KnowledgeEntry[] = []
  ): Promise<string> => {
    try {
      if (!apiKey || !apiKey.trim() || !apiKey.startsWith("gsk_")) {
        throw new Error("No valid API key provided. API keys should start with 'gsk_'.");
      }

      const endpoint = "https://api.groq.com/openai/v1/chat/completions";
      const trimmedKey = apiKey.trim();

      // Detect if the user message is in Nepali
      const isNepali = isNepaliText(userMessage) || preferredLanguage === "ne";

      // Create a system message that includes image descriptions, language instruction, and RAG info
      let systemContent = `You are DisasterAnalysisAI, an expert in analyzing disaster images and providing assessment.
      Focus on interpreting disaster imagery, identifying damage patterns, and providing professional analysis.
      Today's date is May 17, 2025.
      
      Format your responses with markdown headings, bullet points, and bold text when appropriate.
      Be concise but detailed in your assessment. Include specific numbers and percentages when relevant.
      
      IMPORTANT: You are bilingual in English and Nepali. ${preferredLanguage === "ne"
          ? "Always respond in Nepali regardless of the user's input language."
          : preferredLanguage === "en"
            ? "Always respond in English regardless of the user's input language."
            : isNepali ? "The user is writing in Nepali, so respond in Nepali." : "Respond in the same language as the user's query."
        }
      
      Current disaster context: ${disasterType}`;

      if (beforeImg && afterImg) {
        systemContent += `\n\nThe user has uploaded before and after disaster images. The images show an area affected by a ${disasterType}.`;

        // Add specific instructions for Nepal
        if (isNepali || preferredLanguage === "en") {
          systemContent += `\n\nनेपालको सन्दर्भमा विशेष ध्यान दिनुहोस् र स्थानीय भवन प्रकार, भौगोलिक चुनौतीहरू, र उपलब्ध संसाधनहरू बारे विचार गर्नुहोस्।`;
        } else {
          systemContent += `\n\nPay special attention to the Nepali context, considering local building types, geographical challenges, and available resources when relevant.`;
        }
      }

      // Add RAG retrieved information to the system prompt
      if (retrievedEntries && retrievedEntries.length > 0) {
        systemContent += "\n\nHere is relevant information about this type of disaster that you should incorporate in your response:\n\n";

        retrievedEntries.forEach((entry, index) => {
          systemContent += `Reference ${index + 1} - ${entry.metadata.title}:\n${entry.content}\n\n`;
        });

        systemContent += "Use this information to provide more specific and accurate analysis. Reference this knowledge in your response when relevant.";
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
      return generateAIResponse(userMessage, retrievedEntries);
    }
  };

  // Generate fallback AI response
  const generateAIResponse = (userMessage = "", retrievedEntries: KnowledgeEntry[] = []): string => {
    // Determine the response language based on user preference or input
    const isNepali = isNepaliText(userMessage) || preferredLanguage === "ne";
    const useEnglishOnly = preferredLanguage === "en";

    // Determine the language to use for the response
    const responseLanguage = useEnglishOnly ? "en" : (isNepali ? "ne" : "en");

    // Build a response that incorporates RAG information
    let responseContent = "";

    // Check if we have before and after images
    if (beforeImage && afterImage) {
      // Use relevant RAG information if available
      if (retrievedEntries && retrievedEntries.length > 0) {
        // Pick the most relevant entry
        const bestEntry = retrievedEntries[0];

        // Find any Nepal-specific entry if available
        const nepalEntry = retrievedEntries.find(entry =>
          entry.metadata.region === "nepal" &&
          (responseLanguage === "en" || isNepaliText(entry.content))
        );

        const entryToUse = nepalEntry || bestEntry;

        if (responseLanguage === "ne") {
          // Use Nepali RAG content if available, or use the translated phrases
          const nepaliContent = isNepaliText(entryToUse.content)
            ? entryToUse.content
            : nepaliPhrases[`${disasterType}Damage` as keyof typeof nepaliPhrases] || "";

          responseContent = `# आपदा छवि विश्लेषण\n\n## एआई मूल्यांकन परिणामहरू\n\nमैले ${disasterType} को क्षति देखाउने पहिले र पछिको छविहरू विश्लेषण गरेको छु। यहाँ मेरो मूल्यांकन छ:\n\n## पत्ता लगाइएको क्षति\n\n- **भवन संरचनात्मक अखण्डता**: मध्यम देखि गम्भीर क्षति पत्ता लगाइएको\n  - अनुमानित ४०% संरचनाहरूमा छतको क्षति देखिन्छ\n  - 3 भवनहरूमा सम्भावित भित्ता असफलताहरू\n  - बाढी रेखा संकेतहरूले पानी ~1.2m उचाइ पुगेको संकेत गर्छ\n\n- **पूर्वाधार प्रभाव**:\n  - उत्तरपूर्वी क्वाड्रान्टमा सडक क्षति देखिन्छ\n  - सम्भावित पुल पहुँच क्षति (दक्षिण-पश्चिम कुना)\n  - धेरै स्थानहरूमा उपयोगिता पोलहरू समझौता\n\n## विशेषज्ञ विश्लेषण\n\n${nepaliContent}\n\n## नेपाल-विशिष्ट प्रभावहरू\n\nनेपालमा ${disasterType} प्रभावहरू विशेष चुनौतीहरू प्रस्तुत गर्छन्, विशेष गरी ग्रामीण क्षेत्रहरूमा, जहाँ परम्परागत निर्माण विधिहरू र भिरालो भूगोल छन्। स्थानीय ज्ञान र परम्परागत प्रविधिहरू प्रकोप पछिको प्रतिक्रियामा महत्त्वपूर्ण हुन्छन्।\n\n## सिफारिस कार्यहरू\n\nयो विश्लेषणको आधारमा, म सिफारिस गर्छु:\n\n1. **सुरक्षा प्राथमिकताहरू**:\n   - दृश्यमान संरचनात्मक क्षति भएका भवनहरू बाट टाढा रहनुहोस्\n   - सबै गिरेका उपयोगिता लाइनहरूलाई ऊर्जावान र खतरनाक मान्नुहोस्\n   - क्षतिग्रस्त संरचनाहरूमा थप ढल्ने जोखिमहरूको लागि सचेत रहनुहोस्\n\n2. **प्रतिक्रिया आवश्यकताहरू**:\n   - दृश्यमान क्षति भएका भवनहरूको लागि संरचनात्मक इन्जिनियरिङ मूल्यांकन आवश्यक\n   - बाढी क्षेत्रहरूको लागि पानी पम्पिङ उपकरण आवश्यक\n   - सडक पहुँचको लागि मलबे सफाई आवश्यक\n\nयो विश्लेषण दृश्य मूल्यांकनमा मात्र आधारित छ र सुरक्षित हुनासाथ साइट पर पेशेवर निरीक्षणद्वारा प्रमाणित गर्नुपर्छ।`;
        } else {
          responseContent = `# Disaster Image Analysis\n\n## AI Assessment Results\n\nI've analyzed the before and after images of what appears to be ${disasterType} damage. Here's my assessment:\n\n## Detected Damage\n\n- **Building Structural Integrity**: Moderate to severe damage detected\n  - Visible roof damage on approximately 40% of structures\n  - Potential wall failures in 3 buildings\n  - Flood line markers indicate water reached ~1.2m height\n\n- **Infrastructure Impact**:\n  - Road damage visible in northeast quadrant\n  - Possible bridge approach damage (southwest corner)\n  - Utility poles compromised in multiple locations\n\n## Expert Analysis\n\n${entryToUse.content}\n\n## Nepal-Specific Considerations\n\nIn Nepal, ${disasterType} impacts present unique challenges, especially in rural areas with traditional construction methods and steep terrain. Local knowledge and traditional techniques are crucial in post-disaster response.\n\n## Recommended Actions\n\nBased on this analysis, I recommend:\n\n1. **Safety Priorities**:\n   - Avoid buildings with visible structural damage\n   - Treat all downed utility lines as energized and dangerous\n   - Be alert for additional collapse risks in damaged structures\n\n2. **Response Needs**:\n   - Structural engineering assessment required for buildings with visible damage\n   - Water pumping equipment needed for flooded areas\n   - Debris clearing required for road access\n\n3. **Documentation**:\n   - Capture additional angles of damaged structures for insurance claims\n   - Document water height markers where visible\n   - Geotag images for accurate location mapping\n\nThis analysis is based on visual assessment only and should be verified by on-site professional inspection when safe to do so.`;
        }
      } else {
        // Default response without RAG
        if (responseLanguage === "ne") {
          responseContent = `# आपदा छवि विश्लेषण\n\n## एआई मूल्यांकन परिणामहरू\n\nमैले ${disasterType} को क्षति देखाउने पहिले र पछिको छविहरू विश्लेषण गरेको छु। यहाँ मेरो मूल्यांकन छ:\n\n## पत्ता लगाइएको क्षति\n\n- **भवन संरचनात्मक अखण्डता**: मध्यम देखि गम्भीर क्षति पत्ता लगाइएको\n  - अनुमानित ४०% संरचनाहरूमा छतको क्षति देखिन्छ\n  - 3 भवनहरूमा सम्भावित भित्ता असफलताहरू\n  - बाढी रेखा संकेतहरूले पानी ~1.2m उचाइ पुगेको संकेत गर्छ\n\n- **पूर्वाधार प्रभाव**:\n  - उत्तरपूर्वी क्वाड्रान्टमा सडक क्षति देखिन्छ\n  - सम्भावित पुल पहुँच क्षति (दक्षिण-पश्चिम कुना)\n  - धेरै स्थानहरूमा उपयोगिता पोलहरू समझौता\n\n- **वातावरणीय अवस्थाहरू**:\n  - दृश्यमान क्षेत्रको लगभग 35% मा खडा पानी उपस्थित\n  - केन्द्रीय क्षेत्रभर फैलिएको मलबे क्षेत्र\n  - वनस्पति क्षतिले उच्च हावा जोखिमको संकेत दिन्छ\n\n## सिफारिस कार्यहरू\n\nयो विश्लेषणको आधारमा, म सिफारिस गर्छु:\n\n1. **सुरक्षा प्राथमिकताहरू**:\n   - दृश्यमान संरचनात्मक क्षति भएका भवनहरू बाट टाढा रहनुहोस्\n   - सबै गिरेका उपयोगिता लाइनहरूलाई ऊर्जावान र खतरनाक मान्नुहोस्\n   - क्षतिग्रस्त संरचनाहरूमा थप ढल्ने जोखिमहरूको लागि सचेत रहनुहोस्\n\n2. **प्रतिक्रिया आवश्यकताहरू**:\n   - दृश्यमान क्षति भएका भवनहरूको लागि संरचनात्मक इन्जिनियरिङ मूल्यांकन आवश्यक\n   - बाढी क्षेत्रहरूको लागि पानी पम्पिङ उपकरण आवश्यक\n   - सडक पहुँचको लागि मलबे सफाई आवश्यक\n\n3. **कागजात**:\n   - बीमा दाबीहरूको लागि क्षतिग्रस्त संरचनाहरूको थप कुनाहरू कब्जा\n   - दृश्यमान भएका ठाउँमा पानीको उचाइ संकेतहरू कागजात\n   - सटीक स्थान मानचित्रणको लागि जियोट्याग छविहरू\n\nयो विश्लेषण दृश्य मूल्यांकनमा मात्र आधारित छ र सुरक्षित हुनासाथ साइट पर पेशेवर निरीक्षणद्वारा प्रमाणित गर्नुपर्छ।`;
        } else {
          responseContent = `# Disaster Image Analysis\n\n## AI Assessment Results\n\nI've analyzed the before and after images of what appears to be ${disasterType} damage. Here's my assessment:\n\n## Detected Damage\n\n- **Building Structural Integrity**: Moderate to severe damage detected\n  - Visible roof damage on approximately 40% of structures\n  - Potential wall failures in 3 buildings\n  - Flood line markers indicate water reached ~1.2m height\n\n- **Infrastructure Impact**:\n  - Road damage visible in northeast quadrant\n  - Possible bridge approach damage (southwest corner)\n  - Utility poles compromised in multiple locations\n\n- **Environmental Conditions**:\n  - Standing water present in approximately 35% of the visible area\n  - Debris field spreading across central region\n  - Vegetation damage suggests high wind exposure\n\n## Recommended Actions\n\nBased on this analysis, I recommend:\n\n1. **Safety Priorities**:\n   - Avoid buildings with visible structural damage\n   - Treat all downed utility lines as energized and dangerous\n   - Be alert for additional collapse risks in damaged structures\n\n2. **Response Needs**:\n   - Structural engineering assessment required for buildings with visible damage\n   - Water pumping equipment needed for flooded areas\n   - Debris clearing required for road access\n\n3. **Documentation**:\n   - Capture additional angles of damaged structures for insurance claims\n   - Document water height markers where visible\n   - Geotag images for accurate location mapping\n\nThis analysis is based on visual assessment only and should be verified by on-site professional inspection when safe to do so.`;
        }
      }
    } else {
      // No images uploaded response
      if (retrievedEntries && retrievedEntries.length > 0) {
        // Use RAG information for general disaster info
        const bestEntry = retrievedEntries[0];

        // Find any Nepal-specific entry if available
        const nepalEntry = retrievedEntries.find(entry =>
          entry.metadata.region === "nepal" &&
          (responseLanguage === "en" || isNepaliText(entry.content))
        );

        const entryToUse = nepalEntry || bestEntry;

        if (responseLanguage === "ne") {
          const nepaliInfo = isNepaliText(entryToUse.content)
            ? entryToUse.content
            : nepaliPhrases[`${disasterType}Damage` as keyof typeof nepaliPhrases] || "";

          responseContent = `# आपदा विश्लेषण\n\n${disasterType} को बारेमा केही महत्त्वपूर्ण जानकारी:\n\n${nepaliInfo}\n\n## नेपालमा विशेष सावधानी\n\nनेपालको भौगोलिक र सामाजिक सन्दर्भमा, ${disasterType} को प्रभावहरू अन्य स्थानहरूभन्दा फरक हुन सक्छन्। यहाँका परम्परागत भवन संरचनाहरू, भिरालो भूमि, र ग्रामीण समुदायहरूमा पहुँच प्रतिक्रिया प्रयासहरूमा थप चुनौतीहरू थप्न सक्छ।\n\nविस्तृत विश्लेषण प्रदान गर्न, मलाई प्रभावित क्षेत्रको पहिले र पछिको छविहरू हेर्न आवश्यक पर्नेछ। कृपया तुलना उपकरण प्रयोग गरेर दुवै छविहरू अपलोड गर्नुहोस्, र म त्यसपछि मूल्यांकन गर्न सक्छु:\n\n- भवनहरू र पूर्वाधारमा **संरचनात्मक क्षति**\n- बाढी वा वनस्पति नोक्सानी जस्ता **वातावरणीय प्रभाव**\n- क्षतिको **गम्भीरता वर्गीकरण**\n- दृश्यमान क्षति प्याटर्नहरूमा आधारित **पुनर्प्राप्ति सिफारिसहरू**\n\nतपाईंले छविहरू अपलोड गरिसकेपछि, म तिनीहरूको विश्लेषण गर्न सक्छु र तपाईंले चयन गर्नुभएको ${disasterType} सन्दर्भको लागि विस्तृत मूल्यांकन प्रदान गर्न सक्छु।`;
        } else {
          responseContent = `# Disaster Analysis\n\nImportant information about ${disasterType}:\n\n${entryToUse.content}\n\n## Special Considerations for Nepal\n\nIn the geographic and social context of Nepal, the impacts of ${disasterType} may differ from other locations. Traditional building structures, steep terrain, and access to rural communities can add additional challenges to response efforts.\n\nTo provide a thorough analysis, I'll need to see before and after images of the affected area. Please upload both images using the comparison tool, and I can then assess:\n\n- **Structural damage** to buildings and infrastructure\n- **Environmental impact** like flooding or vegetation loss\n- **Severity classification** of the damage\n- **Recovery recommendations** based on visible damage patterns\n\nOnce you've uploaded the images, I can analyze them and provide a detailed assessment specific to the ${disasterType} context you've selected.`;
        }
      } else {
        // Default response without RAG and without images
        if (responseLanguage === "ne") {
          responseContent = `# आपदा विश्लेषण\n\nविस्तृत विश्लेषण प्रदान गर्न, मलाई प्रभावित क्षेत्रको पहिले र पछिको छविहरू हेर्न आवश्यक पर्नेछ। कृपया तुलना उपकरण प्रयोग गरेर दुवै छविहरू अपलोड गर्नुहोस्, र म त्यसपछि मूल्यांकन गर्न सक्छु:\n\n- भवनहरू र पूर्वाधारमा **संरचनात्मक क्षति**\n- बाढी वा वनस्पति नोक्सानी जस्ता **वातावरणीय प्रभाव**\n- क्षतिको **गम्भीरता वर्गीकरण**\n- दृश्यमान क्षति प्याटर्नहरूमा आधारित **पुनर्प्राप्ति सिफारिसहरू**\n\nनेपालको सन्दर्भमा, हामीले स्थानीय निर्माण तरिकाहरू, भूगोल, र उपलब्ध स्रोतहरूमा विशेष ध्यान दिनेछौं।\n\nतपाईंले छविहरू अपलोड गरिसकेपछि, म तिनीहरूको विश्लेषण गर्न सक्छु र तपाईंले चयन गर्नुभएको ${disasterType} सन्दर्भको लागि विस्तृत मूल्यांकन प्रदान गर्न सक्छु।`;
        } else {
          responseContent = `# Disaster Analysis\n\nTo provide a thorough analysis, I'll need to see before and after images of the affected area. Please upload both images using the comparison tool, and I can then assess:\n\n- **Structural damage** to buildings and infrastructure\n- **Environmental impact** like flooding or vegetation loss\n- **Severity classification** of the damage\n- **Recovery recommendations** based on visible damage patterns\n\nIn the context of Nepal, we'll pay special attention to local construction methods, geography, and available resources.\n\nOnce you've uploaded the images, I can analyze them and provide a detailed assessment specific to the ${disasterType} context you've selected.`;
        }
      }
    }

    // Special case for direct questions about language capabilities
    if (userMessage.toLowerCase().includes("nepali") && userMessage.toLowerCase().includes("speak") ||
      userMessage.toLowerCase().includes("नेपाली") && userMessage.toLowerCase().includes("बोल्न")) {
      if (responseLanguage === "ne") {
        return "म नेपाली र अंग्रेजी दुवै भाषामा कुराकानी गर्न सक्छु। तपाईं मलाई कुनै पनि भाषामा सोध्न सक्नुहुन्छ र म त्यही भाषामा जवाफ दिनेछु। म नेपालको विपद् विश्लेषणको लागि विशेष रूपमा प्रशिक्षित छु र स्थानीय सन्दर्भमा प्रासंगिक जानकारी प्रदान गर्न सक्छु।";
      } else {
        return "I can communicate in both Nepali and English. You can ask me in either language and I'll respond in the same language. I'm specially trained for disaster analysis in Nepal and can provide information relevant to the local context.";
      }
    }

    return responseContent;
  };

  // Format time for chat messages
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Language indicator component
  const LanguageIndicator = ({ isNepali }: { isNepali: boolean }) => (
    <Badge variant="outline" className={isNepali ? "bg-blue-50" : ""}>
      {isNepali ? "नेपाली" : "English"}
    </Badge>
  );

  // Sample disaster types
  const disasterTypes = [
    { id: "hurricane", label: "Hurricane / आँधी" },
    { id: "flood", label: "Flood / बाढी" },
    { id: "wildfire", label: "Wildfire / वन आगलागी" },
    { id: "earthquake", label: "Earthquake / भूकम्प" },
    { id: "tornado", label: "Tornado / टोर्नेडो" },
    { id: "landslide", label: "Landslide / पहिरो" },
  ];

  // Sample affected assets
  const assetOptions = [
    { id: "buildings", label: "Buildings / भवनहरू" },
    { id: "roads", label: "Roads / सडकहरू" },
    { id: "bridges", label: "Bridges / पुलहरू" },
    { id: "power_lines", label: "Power Lines / बिजुली लाइनहरू" },
    { id: "vegetation", label: "Vegetation / वनस्पति" },
    { id: "water_bodies", label: "Water Bodies / जलाशयहरू" },
  ];

  // Run AI analysis on the current images
  const handleRunAIAnalysis = () => {
    if (!beforeImage || !afterImage) return;

    setActiveTab("nlp");

    // Check current disaster type and set appropriate prompt in the right language
    let promptMessage = "";
    if (isNepaliText(messages[messages.length - 1]?.content || "")) {
      promptMessage = "यी अघि र पछिका तस्विरहरूको विश्लेषण गर्नुहोस् र प्रमुख क्षति ढाँचाहरू र गम्भीरताको पहिचान गर्नुहोस्।";
    } else {
      promptMessage = "Analyze these before and after images and identify the key damage patterns and severity.";
    }

    setInputMessage(promptMessage);

    // Automatically send the message
    const syntheticEvent = { preventDefault: () => { } } as React.FormEvent;
    handleSendMessage(syntheticEvent);
  };

  // Frontend GUI - Return statement 
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Disaster Analysis Tool / विपद विश्लेषण उपकरण</h1>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLanguageModal(true)}
            className="flex items-center gap-1.5"
          >
            <Globe className="h-4 w-4" />
            {preferredLanguage === "en"
              ? "English"
              : preferredLanguage === "ne"
                ? "नेपाली"
                : "Auto / स्वतः"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmergencyContactsModal(true)}
            className="flex items-center gap-1.5 bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
          >
            <AlertCircle className="h-4 w-4" />
            {getLocalizedText("Emergency Contacts", "आपतकालीन सम्पर्कहरू")}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "comparison" | "nlp")}>
        <TabsList className="mb-2">
          <TabsTrigger value="comparison">
            {getLocalizedText("Image Comparison", "छवि तुलना")}
          </TabsTrigger>
          <TabsTrigger value="nlp">
            {getLocalizedText("AI Analysis", "एआई विश्लेषण")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Before Image Upload */}
                <div className="space-y-2">
                  <div className="font-medium">Before Disaster Image / विपद अघिको तस्वीर</div>
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
                        <div className="text-sm text-gray-600">Upload before image / पहिलेको तस्वीर अपलोड गर्नुहोस्</div>
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
                      {beforeImage ? "Change Image / तस्वीर बदल्नुहोस्" : "Select File / फाइल छान्नुहोस्"}
                    </Button>
                  </div>
                </div>

                {/* After Image Upload */}
                <div className="space-y-2">
                  <div className="font-medium">After Disaster Image / विपद पछिको तस्वीर</div>
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
                        <div className="text-sm text-gray-600">Upload after image / पछिको तस्वीर अपलोड गर्नुहोस्</div>
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
                      {afterImage ? "Change Image / तस्वीर बदल्नुहोस्" : "Select File / फाइल छान्नुहोस्"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Analysis Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Disaster Type Selection */}
                <div className="space-y-2">
                  <div className="font-medium text-sm">Disaster Type / विपदको प्रकार</div>
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
                  <div className="font-medium text-sm">Affected Assets / प्रभावित सम्पत्तिहरू</div>
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
                      <SelectItem value="none">No selection / छनौट छैन</SelectItem>

                      {/* This has a non-empty value "selected" */}
                      <SelectItem value="selected">
                        {affectedAssets.length} assets selected / सम्पत्तिहरू छनौट गरिएको
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
                  <div className="font-medium text-sm">View Mode / हेर्ने मोड</div>
<Tabs
  value={viewMode}
  onValueChange={(value) => setViewMode(value as "slider" | "side-by-side" | "overlay")}
/>
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
                  Analyze Changes / परिवर्तनहरू विश्लेषण गर्नुहोस्
                </Button>

                {beforeImage && afterImage && (
                  <Button
                    onClick={handleRunAIAnalysis}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Analysis / एआई विश्लेषण
                  </Button>
                )}

                <Button variant="outline" onClick={handleReset}>
                  Reset / रिसेट
                </Button>
              </div>

              {/* Analysis Progress */}
              {isAnalyzing && (
                <div className="mt-6 space-y-2">
                  <div className="text-sm font-medium">Analyzing images... / तस्विरहरू विश्लेषण गर्दै...</div>
                  <Progress value={analysisProgress} />
                  <div className="text-xs text-gray-500 text-right">{analysisProgress}% complete / पूरा</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comparison Viewer */}
          {beforeImage && afterImage && (
            <Card>
              <CardContent className="p-6">
                <div className="font-medium mb-4">Image Comparison / छवि तुलना</div>

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
                          Before / अघि
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
                          After / पछि
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
                <div className="font-medium mb-4">Analysis Results / विश्लेषण परिणामहरू</div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm font-medium mb-2">Damage Assessment / क्षति मूल्यांकन</div>
                    <div className="text-3xl font-bold">
                      {analysisResults.damagePercentage}%
                      <span className="text-sm text-gray-500 ml-1">affected / प्रभावित</span>
                    </div>
                    <div className={`text-sm mt-2 ${analysisResults.severity === "high"
                      ? "text-red-600"
                      : analysisResults.severity === "medium"
                        ? "text-orange-600"
                        : "text-yellow-600"
                      }`}>
                      {analysisResults.severity === "high" ? "High" : analysisResults.severity === "medium" ? "Medium" : "Low"} severity /
                      {analysisResults.severity === "high" ? "उच्च" : analysisResults.severity === "medium" ? "मध्यम" : "न्यून"} गम्भीरता
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Affected Areas / प्रभावित क्षेत्रहरू</div>
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
                    <div className="text-sm font-medium mb-2">Recommendations / सिफारिसहरू</div>
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
                        Exporting... / निर्यात गर्दै...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export Report / प्रतिवेदन निर्यात गर्नुहोस्
                      </>
                    )}
                  </Button>
                  <Button onClick={handleViewDetailedAnalysis}>
                    View Detailed Analysis / विस्तृत विश्लेषण हेर्नुहोस्
                  </Button>
                </div>

                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-800">Disclaimer / अस्वीकरण</h3>
                      <p className="text-xs text-amber-700 mt-1">
                        This automated analysis provides a preliminary assessment only. For critical infrastructure or safety decisions, please consult with qualified disaster assessment professionals.
                        <br />
                        यो स्वचालित विश्लेषणले प्रारम्भिक मूल्यांकन मात्र प्रदान गर्छ। महत्त्वपूर्ण पूर्वाधार वा सुरक्षा निर्णयहरूका लागि, कृपया योग्य विपद मूल्यांकन पेशेवरहरूसँग परामर्श गर्नुहोस्।
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
                    Powered by Groq LLM API with Bilingual Support (English/Nepali)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="rag-mode"
                    checked={useRAG}
                    onCheckedChange={setUseRAG}
                  />
                  <Label htmlFor="rag-mode" className="text-sm">
                    <div className="flex items-center">
                      <Database className="h-3.5 w-3.5 mr-1" />
                      RAG
                    </div>
                  </Label>
                </div>

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
                        provide severity assessments, and suggest recovery strategies. Supports both English and Nepali.
                        <br /><br />
                        Turn on RAG to enhance responses with disaster knowledge.
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
                <div className="text-sm mb-2">Enter your Groq API Key (starts with gsk_)</div>
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

                        <div className="text-xs text-gray-500 px-1 flex gap-2 items-center">
                          <span>{formatTime(message.timestamp)}</span>
                          {message.role === 'user' && (
                            <LanguageIndicator isNepali={isNepaliText(message.content)} />
                          )}

                          {/* Show RAG sources if available and enabled */}
                          {message.role === 'assistant' && message.retrievalSources && message.retrievalSources.length > 0 && useRAG && (
                            <div className="ml-2 flex items-center text-xs text-gray-500">
                              <BookOpen className="h-3 w-3 mr-1" />
                              <button
                                onClick={() => setShowRetrievalSources(!showRetrievalSources)}
                                className="hover:underline"
                              >
                                {showRetrievalSources ? "Hide sources" : "Show sources"}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* RAG Sources display */}
                        {message.role === 'assistant' && showRetrievalSources && message.retrievalSources && message.retrievalSources.length > 0 && (
                          <div className="text-xs bg-gray-100 p-2 rounded mt-1 text-gray-700">
                            <div className="font-medium mb-1">Knowledge sources:</div>
                            <ul className="list-disc pl-4 space-y-1">
                              {message.retrievalSources.map((source, index) => (
                                <li key={index}>{source}</li>
                              ))}
                            </ul>
                          </div>
                        )}
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
                  placeholder={getLocalizedText(
                    "Ask about the disaster images or request specific analysis... (English or Nepali)",
                    "विपद छविहरू बारे सोध्नुहोस् वा विशिष्ट विश्लेषण अनुरोध गर्नुहोस्... (अंग्रेजी वा नेपाली)"
                  )}
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

              {/* Suggestion chips */}
              {!inputMessage && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setInputMessage(getLocalizedText(
                      "Analyze the severity of building damage in these images.",
                      "यी तस्वीरहरूमा भवन क्षतिको गम्भीरता विश्लेषण गर्नुहोस्।"
                    ))}
                  >
                    {getLocalizedText("Building damage", "भवन क्षति")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setInputMessage(getLocalizedText(
                      "What's the estimated recovery time based on this damage?",
                      "यो क्षतिको आधारमा अनुमानित पुनर्प्राप्ति समय कति छ?"
                    ))}
                  >
                    {getLocalizedText("Recovery time", "पुनर्प्राप्ति समय")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100 flex items-center"
                    onClick={() => setInputMessage(getLocalizedText(
                      "Compare typical damage patterns for this disaster type in Nepal.",
                      "नेपालमा यो प्रकारको विपदको विशिष्ट क्षति ढाँचाहरूको तुलना गर्नुहोस्।"
                    ))}
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    {getLocalizedText("Nepal patterns", "नेपाल ढाँचाहरू")}
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
              <h2 className="text-xl font-bold">Detailed Damage Analysis / विस्तृत क्षति विश्लेषण</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsDetailedViewOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">Summary / सारांश</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Damage Percentage / क्षति प्रतिशत</div>
                  <div className="text-xl font-bold">{detailedData.damagePercentage}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Severity / गम्भीरता</div>
                  <div className="text-xl font-bold capitalize">{detailedData.severity}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Analysis Date / विश्लेषण मिति</div>
                  <div className="text-xl font-bold">{new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Building Damage Section */}
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">Building Damage / भवन क्षति</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailedData.building_damage && detailedData.building_damage.length > 0 ? (
                  detailedData.building_damage.map((building, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="font-medium mb-2">Building {building.id} / भवन {building.id}</div>
                      <div className="space-y-1 text-sm">
                        <div className="grid grid-cols-2">
                          <span className="text-gray-500">Severity / गम्भीरता:</span>
                          <span className="font-medium">{building.severity}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-gray-500">Confidence / विश्वासनीयता:</span>
                          <span className="font-medium">{(building.confidence * 100).toFixed(0)}%</span>
                        </div>
                        {building.type && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Type / प्रकार:</span>
                            <span className="font-medium">{building.type}</span>
                          </div>
                        )}
                        {building.safety && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Safety Status / सुरक्षा स्थिति:</span>
                            <span className="font-medium">{building.safety}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    No building damage detected / कुनै भवन क्षति पत्ता लागेन
                  </div>
                )}
              </div>
            </div>

            {/* Road Damage Section */}
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">Road Damage / सडक क्षति</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailedData.road_damage && detailedData.road_damage.length > 0 ? (
                  detailedData.road_damage.map((road, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="font-medium mb-2">Road Segment {road.id} / सडक खण्ड {road.id}</div>
                      <div className="space-y-1 text-sm">
                        <div className="grid grid-cols-2">
                          <span className="text-gray-500">Severity / गम्भीरता:</span>
                          <span className="font-medium">{road.severity}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-gray-500">Confidence / विश्वासनीयता:</span>
                          <span className="font-medium">{(road.confidence * 100).toFixed(0)}%</span>
                        </div>
                        {road.passability && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Passability / पार्न सकिने:</span>
                            <span className="font-medium">{road.passability}</span>
                          </div>
                        )}
                        {road.length && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Length / लम्बाई:</span>
                            <span className="font-medium">{road.length} meters</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    No road damage detected / कुनै सडक क्षति पत्ता लागेन
                  </div>
                )}
              </div>
            </div>

            {/* Flooded Areas Section */}
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">Flooded Areas / बाढी ग्रस्त क्षेत्रहरू</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailedData.flooded_areas && detailedData.flooded_areas.length > 0 ? (
                  detailedData.flooded_areas.map((area, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="font-medium mb-2">Flooded Area {area.id} / बाढी ग्रस्त क्षेत्र {area.id}</div>
                      <div className="space-y-1 text-sm">
                        <div className="grid grid-cols-2">
                          <span className="text-gray-500">Water Depth / पानीको गहिराई:</span>
                          <span className="font-medium">{area.water_depth}</span>
                        </div>
                        {area.area_sqm && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Area / क्षेत्रफल:</span>
                            <span className="font-medium">{area.area_sqm} m²</span>
                          </div>
                        )}
                        {area.flow_direction && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Flow Direction / प्रवाह दिशा:</span>
                            <span className="font-medium">{area.flow_direction}</span>
                          </div>
                        )}
                        {area.flood_timeline && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Timeline / समयरेखा:</span>
                            <span className="font-medium">{area.flood_timeline}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    No flooded areas detected / कुनै बाढी ग्रस्त क्षेत्र पत्ता लागेन
                  </div>
                )}
              </div>
            </div>

            {/* Vegetation Loss Section */}
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">Vegetation Loss / वनस्पति क्षति</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailedData.vegetation_loss && detailedData.vegetation_loss.length > 0 ? (
                  detailedData.vegetation_loss.map((veg, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="font-medium mb-2">Vegetation Area {veg.id} / वनस्पति क्षेत्र {veg.id}</div>
                      <div className="space-y-1 text-sm">
                        {veg.area && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Area / क्षेत्रफल:</span>
                            <span className="font-medium">{veg.area}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2">
                          <span className="text-gray-500">Confidence / विश्वासनीयता:</span>
                          <span className="font-medium">{(veg.confidence * 100).toFixed(0)}%</span>
                        </div>
                        {veg.density && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Density / घनत्व:</span>
                            <span className="font-medium">{veg.density}</span>
                          </div>
                        )}
                        {veg.vegetation_type && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Type / प्रकार:</span>
                            <span className="font-medium">{veg.vegetation_type}</span>
                          </div>
                        )}
                        {veg.ecological_impact && (
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Ecological Impact / पारिस्थितिक प्रभाव:</span>
                            <span className="font-medium">{veg.ecological_impact}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    No vegetation loss detected / कुनै वनस्पति क्षति पत्ता लागेन
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setIsDetailedViewOpen(false)}
              >
                Close / बन्द गर्नुहोस्
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Language Preference Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Language Settings / भाषा सेटिङहरू</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowLanguageModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="font-medium">Select preferred language / मनपर्ने भाषा छान्नुहोस्</div>

              <div className="grid grid-cols-1 gap-2">
                <div
                  className={`border rounded-lg p-3 flex items-center gap-3 cursor-pointer ${preferredLanguage === "auto"
                    ? "bg-blue-50 border-blue-300"
                    : "hover:bg-gray-50"
                    }`}
                  onClick={() => setPreferredLanguage("auto")}
                >
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Auto / स्वतः</div>
                    <div className="text-xs text-gray-500">
                      Automatically detect language based on your input
                      <br />
                      तपाईंको इनपुटको आधारमा स्वचालित रूपमा भाषा पत्ता लगाउनुहोस्
                    </div>
                  </div>
                </div>

                <div
                  className={`border rounded-lg p-3 flex items-center gap-3 cursor-pointer ${preferredLanguage === "en"
                    ? "bg-blue-50 border-blue-300"
                    : "hover:bg-gray-50"
                    }`}
                  onClick={() => setPreferredLanguage("en")}
                >
                  <div className="h-5 w-5 flex items-center justify-center font-semibold text-blue-600">
                    EN
                  </div>
                  <div>
                    <div className="font-medium">English Only</div>
                    <div className="text-xs text-gray-500">
                      Always use English for all responses
                    </div>
                  </div>
                </div>

                <div
                  className={`border rounded-lg p-3 flex items-center gap-3 cursor-pointer ${preferredLanguage === "ne"
                    ? "bg-blue-50 border-blue-300"
                    : "hover:bg-gray-50"
                    }`}
                  onClick={() => setPreferredLanguage("ne")}
                >
                  <div className="h-5 w-5 flex items-center justify-center font-semibold text-blue-600">
                    ने
                  </div>
                  <div>
                    <div className="font-medium">नेपाली मात्र</div>
                    <div className="text-xs text-gray-500">
                      सबै प्रतिक्रियाहरूका लागि सधैं नेपाली प्रयोग गर्नुहोस्
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setShowLanguageModal(false)}
                >
                  Save / सुरक्षित गर्नुहोस्
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contacts Modal */}
      {showEmergencyContactsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Emergency Contacts / आपतकालीन सम्पर्कहरू</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEmergencyContactsModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-2 bg-red-50 p-3 rounded-lg text-red-800 border border-red-200">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <div className="font-medium">Important / महत्त्वपूर्ण</div>
                  <div className="text-sm">
                    In case of emergency, please contact these numbers directly. Do not rely solely on this app for emergency response.
                    <br /><br />
                    आपतकालीन अवस्थामा, कृपया यी नम्बरहरूमा सीधै सम्पर्क गर्नुहोस्। आपतकालीन प्रतिक्रियाको लागि यो एपमा मात्र निर्भर नहुनुहोस्।
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {emergencyContacts.nepal.map((contact, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-xs text-gray-500">
                      {contact.english} / {contact.nepali}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-blue-600 font-medium">{contact.number}</div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          // In a real implementation, this would use the tel: protocol
                          // window.location.href = `tel:${contact.number}`;
                          alert(`Calling ${contact.name} (${contact.number})...`);
                        }}
                      >
                        Call / कल गर्नुहोस्
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowEmergencyContactsModal(false)}
                >
                  Close / बन्द गर्नुहोस्
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageComparisonTool;