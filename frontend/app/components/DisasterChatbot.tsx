
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import {
  SendHorizontal,
  Bot,
  User,
  AlertTriangle,
  Info,
  Loader2,
  Image as ImageIcon,
  FileText,
  MapPin,
  Upload,
  Sparkles,
  RefreshCw,
  RotateCw,
  X,
  HelpCircle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  images?: string[];
  loading?: boolean;
}

interface DisasterChatbotProps {
  apiKey?: string;
  defaultContext?: string;
  defaultDisaster?: string;
}

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

const DisasterChatbot: React.FC<DisasterChatbotProps> = ({
  apiKey = "",
  defaultContext = "",
  defaultDisaster = "hurricane"
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-1",
      role: "system",
      content: `You are DisasterAssistantAI, an expert in disaster assessment, response, and recovery. 
      You provide accurate, helpful information about disaster preparedness, impact analysis, and recovery strategies.
      Today's date is May 17, 2025. Focus on providing practical, actionable advice for disaster situations.
      ${defaultContext}
      
      Format your responses with markdown headings, bullet points, and bold text when appropriate.
      Be concise but detailed in your assessment. Include specific numbers and percentages when relevant.
      
      Current disaster context: ${defaultDisaster}`,
      timestamp: new Date()
    },
    {
      id: "welcome",
      role: "assistant",
      content: "I'm DisasterAssistantAI, your expert for disaster assessment and response information. How can I help you today? I can provide information about disaster types, impact analysis, response strategies, or resource planning.",
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "analysis">("chat");
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Call the Groq API
  const callGroqAPI = async (
    systemContent: string,
    messageHistory: Array<{ role: string, content: string }>,
  ): Promise<string> => {
    try {
      // Check if we have a valid API key (should start with "gsk_")
      if (!apiKey || !apiKey.trim() || !apiKey.startsWith("gsk_")) {
        console.log("API Key missing or invalid format:", apiKey ? `${apiKey.substring(0, 4)}...` : "not provided");
        throw new Error("No valid API key provided. API keys should start with 'gsk_'. Using fallback responses.");
      }

      const endpoint = "https://api.groq.com/openai/v1/chat/completions";
      const trimmedKey = apiKey.trim(); // Remove any accidental whitespace

      console.log("Attempting API call with key starting with:", trimmedKey.substring(0, 4));

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
        console.error("API Response Error:", response.status, errorData);
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

      // Fall back to the simulated response
      const lastUserMessage = messageHistory[messageHistory.length - 1].content.toLowerCase();

      // Decide which fallback to use
      if (imageFiles.length > 0 || lastUserMessage.includes("image") || lastUserMessage.includes("photo") || lastUserMessage.includes("picture")) {
        return generateImageAnalysisResponse(lastUserMessage, defaultDisaster);
      } else if (lastUserMessage.includes("prepare") || lastUserMessage.includes("preparation")) {
        return generatePreparationResponse(defaultDisaster);
      } else if (lastUserMessage.includes("evacuat") || lastUserMessage.includes("leave")) {
        return generateEvacuationResponse(defaultDisaster);
      } else if (lastUserMessage.includes("impact") || lastUserMessage.includes("damage") || lastUserMessage.includes("effect")) {
        return generateImpactResponse(defaultDisaster);
      } else if (lastUserMessage.includes("recover") || lastUserMessage.includes("rebuild")) {
        return generateRecoveryResponse(defaultDisaster);
      } else if (lastUserMessage.includes("resource") || lastUserMessage.includes("supplies") || lastUserMessage.includes("aid")) {
        return generateResourceResponse(defaultDisaster);
      } else {
        return `Based on the current disaster situation, I understand you're asking about ${lastUserMessage.split(' ').slice(0, 3).join(' ')}...\n\nI recommend focusing on safety first. For this specific disaster scenario, maintain awareness of official emergency channels and follow instructions from local authorities.\n\nCould you provide more details about your specific concerns so I can give you more targeted information?`;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && imageFiles.length === 0) return;

    // Create unique message ID
    const messageId = Date.now().toString();

    // Prepare image information if any
    let imageUrls: string[] = [];
    let imageDescriptions: string[] = [];

    // Process uploaded images
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        // In a real implementation, we would upload the image to a server
        // and get back a URL. For now, we'll create a local object URL.
        const objectUrl = URL.createObjectURL(file);
        imageUrls.push(objectUrl);

        // Add simple image description for the message context
        imageDescriptions.push(`[User uploaded an image: ${file.name}]`);
      }
    }

    // Add user message
    const userMessage: Message = {
      id: messageId,
      role: "user",
      content: input,
      timestamp: new Date(),
      images: imageUrls
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setImageFiles([]);
    setIsLoading(true);

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
      // Prepare message history for the API
      const messageHistory = messages.filter(m => m.role !== "system").map(m => ({
        role: m.role,
        content: m.content
      }));

      // Add system message at the beginning
      const systemMessage = messages.find(m => m.role === "system");
      const systemContent = systemMessage ? systemMessage.content : "";

      // Add the new user message
      messageHistory.push({
        role: "user",
        content: imageDescriptions.length > 0
          ? `${input}\n\n${imageDescriptions.join("\n")}`
          : input
      });

      // Call the API (or fallback)
      const response = await callGroqAPI(systemContent, messageHistory);

      // Update the assistant message with the response
      setMessages(prev =>
        prev.map(m =>
          m.id === `assistant-${messageId}`
            ? {
              ...m,
              content: response,
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
      setIsLoading(false);
    }
  };

  // Fallback responses for when the API fails
  const generatePreparationResponse = (disasterType: string): string => {
    if (disasterType === "hurricane") {
      return "# Hurricane Preparedness Checklist\n\n## Before the Hurricane\n\n- **Create an emergency plan** for your household, including evacuation routes and meeting locations\n- **Build an emergency kit** with at least 3 days of supplies:\n  - Water (1 gallon per person per day)\n  - Non-perishable food\n  - Medications and first aid supplies\n  - Flashlights and batteries\n  - Battery-powered or hand-crank radio\n  - Cash and important documents in waterproof container\n- **Secure your property**:\n  - Install storm shutters or board up windows\n  - Secure outdoor furniture and objects\n  - Trim trees and branches near structures\n  - Clear gutters and downspouts\n- **Stay informed** through NOAA Weather Radio, local news, and emergency notification systems\n\n## During the Hurricane\n\n- **Shelter in place** in an interior room away from windows if not ordered to evacuate\n- **Stay off roads** and away from floodwaters\n- **Never use generators indoors** or in partially enclosed spaces\n- **Keep devices charged** and minimize usage to conserve battery\n\nWould you like more specific information about any part of hurricane preparedness?";
    } else if (disasterType === "flood") {
      return "# Flood Preparedness Guidelines\n\n## Before Flooding Occurs\n\n- **Know your risk** by checking local flood maps and history\n- **Purchase flood insurance** if you're in a flood-prone area\n- **Prepare an emergency kit** with essentials for at least 72 hours\n- **Create a family communication plan** with meeting points and out-of-area contacts\n- **Install check valves** in plumbing to prevent floodwater backup\n- **Elevate electrical systems** at least 12 inches above expected flood levels\n- **Waterproof your basement** and use water-resistant building materials\n\n## During Flood Warnings\n\n- **Move to higher ground immediately** if advised to evacuate\n- **Disconnect electrical appliances** if safe to do so\n- **Avoid walking or driving through floodwaters** - just 6 inches of moving water can knock you down\n- **Follow emergency broadcast instructions** from authorities\n\nRemember that flash floods can develop with little warning. Would you like more specific information about protecting your property from flood damage?";
    } else if (disasterType === "earthquake") {
      return "# Earthquake Preparedness Plan\n\n## Before an Earthquake\n\n- **Secure heavy furniture** and appliances to walls using straps or brackets\n- **Create a family emergency plan** with meeting locations and communication strategies\n- **Practice \"Drop, Cover, and Hold On\"** drills regularly\n- **Assemble emergency supplies**:\n  - Food and water for at least 3 days\n  - Medications and first aid kit\n  - Flashlights and batteries\n  - Portable radio\n  - Cash and important documents\n- **Know how to shut off utilities** - gas, water, and electricity\n- **Identify safe spots** in each room (under sturdy tables, against interior walls)\n\n## During an Earthquake\n\n- **Drop, Cover, and Hold On** - drop to the ground, take cover under a sturdy table, and hold on until shaking stops\n- **Stay indoors** until the shaking stops\n- **If outdoors**, move to a clear area away from buildings, trees, and power lines\n- **If in a vehicle**, pull over and stay inside with seatbelt fastened\n\nWould you like more information about what to do after an earthquake occurs?";
    } else {
      return "# General Disaster Preparedness\n\n## Essential Preparations for Any Disaster\n\n- **Create a family emergency plan** with meeting points and communication strategies\n- **Prepare an emergency kit** with essentials:\n  - Water (1 gallon per person per day for at least 3 days)\n  - Non-perishable food (3-day supply minimum)\n  - Battery-powered radio and extra batteries\n  - Flashlight and extra batteries\n  - First aid kit\n  - Whistle to signal for help\n  - Dust mask, plastic sheeting, and duct tape\n  - Moist towelettes, garbage bags, and plastic ties\n  - Wrench or pliers to turn off utilities\n  - Manual can opener\n  - Local maps\n  - Cell phone with chargers and backup battery\n\n- **Stay informed** about local emergency plans and warning systems\n- **Learn basic safety skills** like first aid and CPR\n- **Maintain important documents** in waterproof, portable containers\n\nWould you like specific preparation information for a particular type of disaster?";
    }
  };

  const generateEvacuationResponse = (disasterType: string): string => {
    return "# Evacuation Guidelines\n\n## When to Evacuate\n\n- **Follow official orders** - evacuate immediately if instructed by authorities\n- **Don't wait until it's too late** - leaving early is safer than leaving under duress\n- **Monitor emergency broadcasts** for evacuation routes and shelter locations\n\n## Evacuation Preparation\n\n- **Pack an evacuation bag** with:\n  - Important documents (ID, insurance, medical records)\n  - Medications and prescriptions\n  - Change of clothes and sturdy shoes\n  - Basic hygiene items\n  - Cell phone and chargers\n  - Cash and credit cards\n  - Map of the area\n  - Food, water, and pet supplies\n\n## During Evacuation\n\n- **Secure your home** before leaving:\n  - Lock all doors and windows\n  - Turn off utilities if instructed\n  - Unplug electrical equipment\n\n- **Use designated evacuation routes** - shortcuts may be blocked\n- **Bring your emergency supplies and critical documents**\n- **Have a full tank of gas** and consider carpooling\n- **Check in with your out-of-area contact** to share your location and plans\n\n## Current Evacuation Orders\n\nBased on current information, the following areas are under evacuation orders:\n- Downtown district (mandatory)\n- East side neighborhoods (voluntary)\n- North riverside area (mandatory)\n\nEvacuation centers are open at:\n- Central High School (1200 Main St)\n- Community College (500 Education Blvd)\n- Recreation Center (350 Park Ave)\n\nPlease check official county emergency management websites or call 211 for the most current evacuation information.";
  };

  const generateImpactResponse = (disasterType: string): string => {
    if (disasterType === "hurricane") {
      return "# Hurricane Atlas Impact Assessment\n\n## Current Status\n\nHurricane Atlas made landfall on March 15, 2025, as a Category 4 storm with sustained winds of 145 mph. The storm has caused widespread damage across coastal regions.\n\n## Damage Assessment\n\n- **Building Damage**: 65% of structures affected\n  - 22% with severe structural damage\n  - 38% with moderate damage (roof, windows, flooding)\n  - 30% with minor damage\n  - 10% undamaged\n\n- **Infrastructure Impact**:\n  - 48% of road network damaged or blocked\n  - 35% of bridges affected, with 8 major crossings closed\n  - 71% of areas experiencing power outages\n  - 43% of water supply systems compromised\n\n- **Flooding Status**:\n  - Downtown areas: 3-6 feet of standing water\n  - Coastal zones: Significant storm surge damage\n  - River systems: Currently 8 feet above flood stage\n\n## Human Impact\n\n- Approximately 125,000 people affected\n- 42,000 people displaced from homes\n- 1,850 reported injuries\n- 37 confirmed fatalities\n\n## Recovery Timeline\n\n- **Critical Services**: Estimated 1-2 weeks for restoration\n- **Basic Infrastructure**: 3-4 weeks for major repairs\n- **Complete Recovery**: 6-12 months for full restoration\n\nThis information is based on preliminary assessments and may change as more detailed surveys are conducted. Would you like specific information about a particular aspect of the hurricane impact?";
    } else {
      return "# Current Disaster Impact Assessment\n\n## Damage Overview\n\nThe recent disaster has caused significant damage across multiple sectors. Here's the current assessment based on available data:\n\n## Infrastructure Impact\n\n- **Buildings**: 58% of structures in affected areas damaged\n  - 25% severe structural damage\n  - 33% moderate damage\n  - 42% minor or no damage\n\n- **Transportation Systems**:\n  - 42% of road network damaged or impassable\n  - 8 major bridges closed for inspection\n  - Public transit suspended in most affected areas\n\n- **Utilities**:\n  - Power: 63% of service area experiencing outages\n  - Water: 40% of systems compromised\n  - Communications: Cell service intermittent, 30% of towers affected\n\n## Community Impact\n\n- Approximately 85,000 people directly affected\n- 28,000 people displaced from homes\n- 12 emergency shelters currently open at 74% capacity\n- Schools and public buildings closed in affected zones\n\n## Economic Considerations\n\n- Preliminary damage estimates: $1.8 billion\n- Business disruption affecting approximately 2,300 companies\n- Agricultural losses estimated at $250 million\n\n## Recovery Operations\n\n- Search and rescue operations: 90% complete\n- Emergency road clearing: 65% complete\n- Power restoration estimated timeline: 7-10 days\n\nThis assessment is based on initial reports and will be updated as more comprehensive data becomes available. Would you like more specific information about any particular aspect of the impact?";
    }
  };

  const generateRecoveryResponse = (disasterType: string): string => {
    return "# Disaster Recovery Roadmap\n\n## Immediate Recovery Phase (0-30 days)\n\n- **Safety First**\n  - Have your property inspected for structural damage before re-entry\n  - Watch for downed power lines, gas leaks, and compromised structures\n  - Test water safety before use; boil if necessary\n  - Document all damage with photos for insurance claims\n\n- **Shelter and Basic Needs**\n  - Register for FEMA assistance if eligible: www.disasterassistance.gov\n  - Contact your insurance company immediately\n  - Find temporary housing through Red Cross or local shelters\n  - Apply for disaster unemployment if your workplace was affected\n\n## Short-term Recovery (1-6 months)\n\n- **Home Repair**\n  - Get multiple contractor estimates for repairs\n  - Check contractor licenses and avoid paying full amounts upfront\n  - Address mold quickly to prevent health issues\n  - Prioritize structural repairs and weatherproofing\n\n- **Financial Recovery**\n  - Apply for SBA disaster loans for uncovered expenses\n  - Contact mortgage company about forbearance options\n  - Check for tax relief programs for disaster victims\n  - Keep detailed records of all disaster-related expenses\n\n## Long-term Recovery (6+ months)\n\n- **Rebuilding Stronger**\n  - Consider hazard mitigation improvements\n  - Review updated building codes for your area\n  - Evaluate flood insurance even if not in a flood zone\n  - Create a more comprehensive emergency plan for the future\n\n- **Community Recovery**\n  - Participate in local recovery planning meetings\n  - Support local businesses affected by the disaster\n  - Connect with community support groups\n  - Consider volunteering with recovery organizations\n\n## Current Recovery Resources\n\n- FEMA Disaster Recovery Center: Community College, 500 Education Blvd\n- SBA Business Recovery Center: Downtown Library, 355 Main St\n- Mental Health Support Hotline: 1-800-555-HELP\n- Volunteer Coordination: www.recovertogether.org\n\nWould you like more specific information about any aspect of the recovery process?";
  };

  const generateResourceResponse = (disasterType: string): string => {
    return "# Disaster Response Resources\n\n## Immediate Assistance\n\n- **Emergency Services**: 911 for life-threatening emergencies\n- **Disaster Distress Helpline**: 1-800-985-5990 (24/7 crisis counseling)\n- **Red Cross**: 1-800-RED-CROSS (1-800-733-2767)\n- **FEMA**: 1-800-621-3362 or www.disasterassistance.gov\n\n## Active Distribution Centers\n\nThe following resource centers are currently operational:\n\n| Location | Address | Hours | Resources Available |\n|----------|---------|-------|---------------------|\n| Central High School | 1200 Main St | 7am-7pm | Food, water, hygiene items, charging stations |\n| Community Center | 350 Park Ave | 8am-6pm | Food, water, medical supplies, pet supplies |\n| Faith Mission | 780 Hope St | 9am-5pm | Hot meals, clothing, crisis counseling |\n| Recreation Complex | 620 Athletic Dr | 7am-8pm | Showers, laundry, temporary shelter |\n\n## Financial Assistance\n\n- **FEMA Individual Assistance**: Up to $37,900 for home repairs, temporary housing\n- **SBA Disaster Loans**: Low-interest loans for home and business repairs\n- **Disaster Unemployment Assistance**: For those who lost work due to disaster\n- **Emergency Food Assistance**: Disaster SNAP benefits available\n\n## Medical Resources\n\n- **Emergency Medical Sites**:\n  - Field Hospital: Fairgrounds, 200 Expo Dr\n  - Mobile Clinics: Rotating locations, check www.disasterhealth.org\n- **Medication Replacement**: Emergency prescription assistance program active\n- **Mental Health Services**: Crisis counselors available at all shelter locations\n\n## Communication Resources\n\n- Free WiFi hotspots at all distribution centers\n- Emergency cell charging stations throughout affected areas\n- Daily information broadcasts: 88.7 FM at 8am, 12pm, and 6pm\n\nFor the most current resource information, text RESOURCES to 43362 or visit the county emergency management website.\n\nDo you need specific information about accessing any of these resources?";
  };

  const generateImageAnalysisResponse = (message: string, disasterType: string): string => {
    return `# Disaster Image Analysis\n\n## AI Assessment Results\n\nI've analyzed the uploaded image(s) of what appears to be ${disasterType} damage. Here's my assessment:\n\n## Detected Damage\n\n- **Building Structural Integrity**: Moderate to severe damage detected\n  - Visible roof damage on approximately 40% of structures\n  - Potential wall failures in 3 buildings\n  - Flood line markers indicate water reached ~1.2m height\n\n- **Infrastructure Impact**:\n  - Road damage visible in northeast quadrant\n  - Possible bridge approach damage (southwest corner)\n  - Utility poles compromised in multiple locations\n\n- **Environmental Conditions**:\n  - Standing water present in approximately 35% of the visible area\n  - Debris field spreading across central region\n  - Vegetation damage suggests high wind exposure\n\n## Recommended Actions\n\nBased on this analysis, I recommend:\n\n1. **Safety Priorities**:\n   - Avoid buildings with visible structural damage\n   - Treat all downed utility lines as energized and dangerous\n   - Be alert for additional collapse risks in damaged structures\n\n2. **Response Needs**:\n   - Structural engineering assessment required for buildings with visible damage\n   - Water pumping equipment needed for flooded areas\n   - Debris clearing required for road access\n\n3. **Documentation**:\n   - Capture additional angles of damaged structures for insurance claims\n   - Document water height markers where visible\n   - Geotag images for accurate location mapping\n\nThis analysis is based on visual assessment only and should be verified by on-site professional inspection when safe to do so. Would you like more specific information about any of these damage categories?`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array
      const newFiles = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Suggested questions for quick access
  const suggestedQuestions = [
    "What should I do to prepare for a hurricane?",
    "How can I assess building damage after a disaster?",
    "What resources are available for disaster victims?",
    "When should I evacuate during a flood?",
    "What should be in my emergency kit?",
    "How can I help my community recover after a disaster?"
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="flex flex-col">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "chat" | "analysis")}>
        <TabsList className="mb-2">
          <TabsTrigger value="chat">Disaster Chat</TabsTrigger>
          <TabsTrigger value="analysis">Image Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card className="w-full h-[600px] flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="p-3 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 p-1.5 rounded-full">
                  <Bot className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="font-medium">DisasterAssistantAI</div>
                  <div className="text-xs text-gray-500">
                    Disaster assessment and response expert
                  </div>
                </div>
              </div>
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-80 text-xs">
                        Ask questions about disaster types, impact assessment,
                        preparation, response, or recovery strategies. Upload images
                        for damage analysis.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.filter(m => m.role !== "system").map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <Avatar className={`h-8 w-8 ${message.role === 'user'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-red-100 text-red-600'
                        }`}>
                        {message.role === 'user'
                          ? <User className="h-5 w-5" />
                          : <Bot className="h-5 w-5" />
                        }
                      </Avatar>

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

                        {/* Display uploaded images */}
                        {message.images && message.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {message.images.map((image, index) => (
                              <div key={index} className="relative h-20 w-20 rounded-md overflow-hidden border">
                                <img
                                  src={image}
                                  alt={`Uploaded ${index}`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}

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
                  <AlertTriangle className="h-4 w-4" />
                  <div className="text-sm">
                    <span className="font-medium">API Error:</span> {apiError}
                  </div>
                </div>
                <div className="text-xs mt-1">Using fallback responses - results may be less accurate.</div>
              </div>
            )}

            {/* Suggested Questions */}
            {messages.length < 3 && (
              <div className="px-4 py-2 border-t bg-white">
                <div className="text-xs text-gray-500 mb-2">Suggested questions:</div>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.slice(0, 3).map((question, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      {question}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Image Preview */}
            {imageFiles.length > 0 && (
              <div className="px-4 py-2 border-t bg-white">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-gray-500">Uploaded images:</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-gray-500"
                    onClick={() => setImageFiles([])}
                  >
                    Clear all
                  </Button>
                </div>
                <div className="flex gap-2">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative h-16 w-16 rounded-md overflow-hidden border">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="h-full w-full object-cover"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0 h-4 w-4 bg-gray-800 bg-opacity-50 rounded-full p-0 m-0.5"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-3 w-3 text-white" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-t bg-white">
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={handleFileButtonClick}
                >
                  <ImageIcon className="h-5 w-5 text-gray-500" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading || (!input.trim() && imageFiles.length === 0)}>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-5 w-5" />
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card className="w-full h-[600px] flex flex-col overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="bg-purple-100 p-1.5 rounded-full">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Disaster Image Analyzer</div>
                  <div className="text-xs text-gray-500">
                    Upload images for AI-powered damage assessment
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
              {imageFiles.length === 0 ? (
                <div
                  className="h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer"
                  onClick={handleFileButtonClick}
                >
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <h3 className="font-medium text-gray-700">Upload Disaster Images</h3>
                  <p className="text-sm text-gray-500 text-center max-w-xs mt-1">
                    Upload before and after images for damage assessment and analysis
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleFileButtonClick}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select Images
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border bg-white">
                        <div className="absolute top-2 right-2 z-10 flex gap-1">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Analysis ${index}`}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="p-2 border-t">
                          <div className="font-medium text-sm truncate">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                    ))}

                    <div
                      className="rounded-lg border border-dashed flex flex-col items-center justify-center p-4 cursor-pointer bg-white h-full"
                      onClick={handleFileButtonClick}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 text-center">
                        Add more images
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-medium mb-2">Analysis options</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-700 block mb-1">
                          Disaster type
                        </label>
                        <Select defaultValue={defaultDisaster}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select disaster type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hurricane">Hurricane</SelectItem>
                            <SelectItem value="flood">Flood</SelectItem>
                            <SelectItem value="earthquake">Earthquake</SelectItem>
                            <SelectItem value="wildfire">Wildfire</SelectItem>
                            <SelectItem value="tornado">Tornado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-700 block mb-1">
                          Analysis focus
                        </label>
                        <Select defaultValue="structural">
                          <SelectTrigger>
                            <SelectValue placeholder="Select analysis type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="structural">Structural damage</SelectItem>
                            <SelectItem value="environmental">Environmental impact</SelectItem>
                            <SelectItem value="infrastructure">Infrastructure assessment</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive analysis</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-700 block mb-1">
                          Additional notes
                        </label>
                        <Textarea
                          placeholder="Enter any specific details or questions about the images..."
                          className="h-20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setImageFiles([])}
                    >
                      Clear all images
                    </Button>
                    <Button
                      onClick={() => {
                        setActiveTab("chat");
                        setInput("Analyze these images for disaster damage");
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Run Analysis
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t bg-white">
              <div className="text-xs text-gray-500 flex items-center">
                <Info className="h-3.5 w-3.5 mr-1.5" />
                Upload images of disaster areas to generate detailed damage assessment reports
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-gray-500 mt-1 flex items-center">
        <AlertTriangle className="h-3 w-3 mr-1" />
        <span>For demonstration purposes only. In real emergencies, follow official guidance.</span>
      </div>
    </div>
  );
};

export default DisasterChatbot;
