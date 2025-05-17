// Mock data for the disaster assessment application
export const disasterData = {
  disasterInfo: {
    name: "Hurricane Atlas",
    date: "2025-03-15",
    location: "Coastal City, FL",
    type: "Hurricane",
    severity: "Category 4"
  },

  damageAssessment: {
    buildingDamage: {
      percentage: 65,
      types: [
        { type: "Collapsed", percentage: 22 },
        { type: "Flooded", percentage: 38 },
        { type: "Minor Damage", percentage: 30 },
        { type: "Undamaged", percentage: 10 }
      ]
    },
    infrastructureDamage: {
      percentage: 48,
      types: [
        { type: "Roads", percentage: 52 },
        { type: "Bridges", percentage: 35 },
        { type: "Power Lines", percentage: 71 },
        { type: "Water Supply", percentage: 43 }
      ]
    },
    agriculturalDamage: {
      percentage: 78,
      types: [
        { type: "Crops", percentage: 85 },
        { type: "Livestock", percentage: 42 },
        { type: "Facilities", percentage: 55 }
      ]
    }
  },

  impactAnalysis: {
    peopleAffected: 125000,
    peopleDisplaced: 42000,
    peopleInjured: 1850,
    fatalitiesReported: 37,
    economicLoss: 2750000000, // in USD
    criticalInfrastructure: [
      { type: "Hospitals", status: "Partially Operational", affectedPercentage: 45 },
      { type: "Schools", status: "Closed", affectedPercentage: 85 },
      { type: "Emergency Services", status: "Operational", affectedPercentage: 25 },
      { type: "Government Buildings", status: "Partially Operational", affectedPercentage: 50 }
    ]
  },

  emergencyResponse: {
    averageResponseTime: 35, // minutes
    callsReceived: 12500,
    callsResponded: 11200,
    responseRate: 89.6, // percentage
    resourceAllocation: {
      personnel: 1250,
      vehicles: 320,
      equipment: 580,
      efficiency: 76 // percentage
    }
  },

  environmentalImpact: {
    airQuality: {
      status: "Poor",
      contaminants: ["Dust", "Debris", "Mold Spores"],
      hazardLevel: "Medium"
    },
    waterQuality: {
      status: "Compromised",
      contaminants: ["Sewage", "Industrial Chemicals", "Debris"],
      hazardLevel: "High"
    },
    soilContamination: {
      status: "Moderate",
      contaminants: ["Oil", "Chemicals", "Waste"],
      hazardLevel: "Medium"
    },
    wildlifeImpact: {
      status: "Significant",
      habitatsAffected: 28,
      endangeredSpeciesImpacted: 5
    }
  },

  vulnerabilityAnalysis: {
    highRiskAreas: [
      { name: "Coastal District", riskLevel: "Extreme", population: 28000 },
      { name: "Riverfront Zone", riskLevel: "High", population: 35000 },
      { name: "Downtown Area", riskLevel: "Medium", population: 42000 }
    ],
    preparednessScore: 62, // percentage
    resilienceIndex: 58, // percentage
    recommendedImprovements: [
      "Enhance early warning systems",
      "Improve evacuation routes",
      "Strengthen building codes",
      "Establish more emergency shelters",
      "Develop community-based disaster response teams"
    ]
  },

  resourceAllocation: {
    availableResources: {
      personnel: { available: 1500, required: 2200 },
      equipment: { available: 720, required: 1100 },
      vehicles: { available: 350, required: 480 },
      supplies: { available: 65, required: 100 } // percentage
    },
    priorityAreas: [
      { area: "Medical Services", priority: "High" },
      { area: "Water Supply", priority: "Critical" },
      { area: "Temporary Housing", priority: "High" },
      { area: "Road Clearing", priority: "Medium" },
      { area: "Power Restoration", priority: "Critical" }
    ],
    supplyChainStatus: {
      food: "Limited",
      water: "Critical",
      medical: "Strained",
      fuel: "Limited",
      construction: "Unavailable"
    }
  },

  recovery: {
    estimatedTime: {
      shortTerm: "3 months",
      mediumTerm: "18 months",
      longTerm: "5 years"
    },
    economicRecovery: {
      local: "Severe Impact - 5+ years",
      regional: "Moderate Impact - 3 years",
      gdpImpact: -2.8 // percentage
    },
    infrastructureReconstruction: {
      essential: "6 months",
      nonEssential: "2-3 years",
      estimatedCost: 1850000000 // in USD
    }
  },

  // Mock image comparison data
  imageComparison: {
    beforeImage: "/images/before-disaster.jpg",
    afterImage: "/images/after-disaster.jpg",
    differenceImage: "/images/difference-overlay.jpg",
    results: {
      changedPixelsPercentage: 42.7,
      majorChangeAreas: [
        { name: "Residential Zone A", changePercentage: 75.3, severity: "High" },
        { name: "Commercial District", changePercentage: 62.8, severity: "High" },
        { name: "Highway Bridge", changePercentage: 89.2, severity: "Critical" },
        { name: "Coastal Habitat", changePercentage: 91.5, severity: "Critical" },
        { name: "Agricultural Area B", changePercentage: 54.1, severity: "Medium" }
      ],
      detectedChanges: [
        { type: "Building Collapse", instances: 78, confidence: 92.3 },
        { type: "Flooding", instances: 243, confidence: 97.8 },
        { type: "Road Damage", instances: 112, confidence: 88.5 },
        { type: "Vegetation Loss", instances: 156, confidence: 94.1 },
        { type: "Debris Field", instances: 205, confidence: 96.2 }
      ]
    }
  }
};

// Time series data for changes over days
export const timeSeriesData = {
  dates: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
  responseEfficiency: [45, 58, 67, 72, 76, 81, 85],
  rescuedPeople: [120, 345, 518, 642, 720, 762, 798],
  powerRestoration: [5, 12, 28, 35, 45, 62, 70],
  waterSupplyRestoration: [8, 15, 22, 38, 52, 68, 75],
  debrisCleared: [2, 8, 15, 27, 38, 46, 55]
};

// Mock image analysis for comparison
export const mockImageAnalysis = {
  beforeImageUrl: "/mockImages/before.jpg",
  afterImageUrl: "/mockImages/after.jpg",
  analysisResults: {
    buildingDamage: [
      { id: 1, coordinates: [120, 150, 200, 220], severity: "Collapsed", confidence: 0.92 },
      { id: 2, coordinates: [350, 400, 420, 480], severity: "Partially Damaged", confidence: 0.87 },
      { id: 3, coordinates: [520, 550, 600, 650], severity: "Minor Damage", confidence: 0.79 }
    ],
    roadDamage: [
      { id: 1, coordinates: [200, 300, 220, 600], severity: "Severe", confidence: 0.94 },
      { id: 2, coordinates: [450, 460, 600, 610], severity: "Moderate", confidence: 0.85 }
    ],
    floodedAreas: [
      { id: 1, coordinates: [100, 120, 400, 450], waterDepth: "2.4m", confidence: 0.96 },
      { id: 2, coordinates: [600, 650, 800, 850], waterDepth: "1.2m", confidence: 0.93 }
    ],
    vegetationLoss: [
      { id: 1, coordinates: [700, 720, 900, 950], area: "12500 sqm", confidence: 0.91 }
    ]
  }
};
