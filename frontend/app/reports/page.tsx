"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Filter,
  PlusCircle,
  FileText,
  Share2,
  FileSpreadsheet,
  FileJson,
  FileImage,
  Clock,
  BarChart2,
  Eye,
  Trash,
  MoreHorizontal,
  Star,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Calendar
} from "lucide-react";
import { disasterData } from "@/app/lib/mockData";

// Create a sample report array
const sampleReports = [
  {
    id: "r-001",
    title: "Hurricane Atlas Damage Assessment",
    description: "Comprehensive disaster impact evaluation for coastal areas",
    date: "Mar 17, 2025",
    author: "Emma Rodriguez",
    status: "Final",
    type: "Damage Assessment",
    format: "PDF",
    size: "4.2 MB",
    starred: true,
    tags: ["hurricane", "coastal", "buildings"]
  },
  {
    id: "r-002",
    title: "Infrastructure Recovery Plan",
    description: "Prioritized restoration plan for critical infrastructure",
    date: "Mar 16, 2025",
    author: "Michael Chen",
    status: "Draft",
    type: "Recovery Plan",
    format: "DOCX",
    size: "2.8 MB",
    starred: false,
    tags: ["infrastructure", "recovery", "priority"]
  },
  {
    id: "r-003",
    title: "Environmental Impact Analysis",
    description: "Assessment of environmental damage and contamination risks",
    date: "Mar 15, 2025",
    author: "Sarah Johnson",
    status: "In Review",
    type: "Impact Analysis",
    format: "PDF",
    size: "5.7 MB",
    starred: true,
    tags: ["environmental", "contamination", "wildlife"]
  },
  {
    id: "r-004",
    title: "Resource Allocation Summary",
    description: "Current distribution of emergency resources and personnel",
    date: "Mar 15, 2025",
    author: "David Wilson",
    status: "Final",
    type: "Resource Report",
    format: "XLSX",
    size: "1.3 MB",
    starred: false,
    tags: ["resources", "personnel", "distribution"]
  },
  {
    id: "r-005",
    title: "Daily Situation Report",
    description: "24-hour update on response activities and conditions",
    date: "Mar 17, 2025",
    author: "Amanda Torres",
    status: "Final",
    type: "Situation Report",
    format: "PDF",
    size: "2.1 MB",
    starred: false,
    tags: ["daily", "situation", "update"]
  },
  {
    id: "r-006",
    title: "Evacuation Centers Status",
    description: "Capacity and conditions of active evacuation centers",
    date: "Mar 16, 2025",
    author: "James Lee",
    status: "Final",
    type: "Status Report",
    format: "PDF",
    size: "3.4 MB",
    starred: false,
    tags: ["evacuation", "shelters", "capacity"]
  },
  {
    id: "r-007",
    title: "Economic Impact Projection",
    description: "Long-term economic impact analysis and recovery timeline",
    date: "Mar 14, 2025",
    author: "Nicole Garcia",
    status: "Draft",
    type: "Impact Analysis",
    format: "PPTX",
    size: "6.8 MB",
    starred: true,
    tags: ["economic", "financial", "recovery"]
  }
];

// Report templates
const reportTemplates = [
  {
    id: "t-001",
    title: "Comprehensive Damage Assessment",
    description: "Complete analysis of all damage categories with severity ratings",
    sections: ["Building Damage", "Infrastructure Damage", "Environmental Impact", "Economic Analysis"]
  },
  {
    id: "t-002",
    title: "Rapid Situation Report",
    description: "Quick overview of current conditions for emergency responders",
    sections: ["Key Statistics", "Critical Needs", "Response Activities", "Next 24 Hours"]
  },
  {
    id: "t-003",
    title: "Recovery Planning Document",
    description: "Detailed recovery plan with priorities, timeline, and resource needs",
    sections: ["Damage Summary", "Priority Areas", "Resource Requirements", "Timeline", "Budget"]
  },
  {
    id: "t-004",
    title: "Resource Allocation Report",
    description: "Current resource distribution and gap analysis",
    sections: ["Available Resources", "Deployment Status", "Resource Gaps", "Acquisition Plan"]
  },
  {
    id: "t-005",
    title: "Executive Briefing",
    description: "High-level overview for decision makers",
    sections: ["Situation Overview", "Key Impacts", "Critical Decisions", "Resource Summary"]
  }
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("my-reports");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const toggleReportSelection = (reportId: string) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const selectAllReports = () => {
    if (selectedReports.length === sampleReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(sampleReports.map(report => report.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "final":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "in review":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case "pdf":
      case "docx":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "xlsx":
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case "pptx":
        return <FileText className="h-4 w-4 text-orange-500" />;
      case "json":
        return <FileJson className="h-4 w-4 text-purple-500" />;
      case "jpg":
      case "png":
        return <FileImage className="h-4 w-4 text-cyan-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-gray-500">
            Generate, manage, and share disaster assessment reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          <Button size="sm" className="flex items-center gap-1">
            <PlusCircle className="h-4 w-4" />
            <span>New Report</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="my-reports">My Reports</TabsTrigger>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
        </TabsList>

        <TabsContent value="my-reports">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Disaster Reports</CardTitle>
                <div className="flex items-center gap-2">
                  {selectedReports.length > 0 && (
                    <>
                      <Button variant="ghost" size="sm" className="h-8 text-gray-500">
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-gray-500">
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      <div className="h-5 border-r border-gray-200 mx-1"></div>
                    </>
                  )}
                  <Select defaultValue="newest">
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="type">Report Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription>
                {selectedReports.length > 0
                  ? `${selectedReports.length} reports selected`
                  : "Your saved and shared reports"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedReports.length === sampleReports.length}
                          onCheckedChange={selectAllReports}
                        />
                      </TableHead>
                      <TableHead className="min-w-[250px]">Title</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead className="hidden md:table-cell">Format</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedReports.includes(report.id)}
                            onCheckedChange={() => toggleReportSelection(report.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <div className="rounded-md border p-2 bg-gray-50 text-gray-500">
                              {getFormatIcon(report.format)}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {report.title}
                                {report.starred && <Star className="h-3.5 w-3.5 text-amber-500 ml-1" />}
                              </div>
                              <div className="text-xs text-gray-500">{report.description}</div>
                              <div className="flex mt-1 flex-wrap gap-1">
                                {report.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{report.type}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            {report.date}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center">
                            {getFormatIcon(report.format)}
                            <span className="ml-1.5">{report.format}</span>
                            <span className="ml-1 text-xs text-gray-500">({report.size})</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:border-blue-200 hover:shadow-md ${selectedTemplate === template.id ? "ring-2 ring-blue-500 border-blue-300" : ""
                  }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="space-y-1.5">
                    {template.sections.map((section, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-1.5" />
                        {section}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-3">
                  <Button size="sm">
                    <FileText className="h-4 w-4 mr-1.5" />
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            ))}

            <Card className="border-dashed flex flex-col items-center justify-center p-6 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <PlusCircle className="h-10 w-10 text-blue-400 mb-3" />
              <h3 className="font-medium text-lg">Create Custom Template</h3>
              <p className="text-sm text-gray-500 text-center mt-1">
                Design your own report template with custom sections
              </p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="generate">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate New Report</CardTitle>
                <CardDescription>
                  Create a new report based on current disaster data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select defaultValue="damage">
                    <SelectTrigger id="report-type">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damage">Damage Assessment</SelectItem>
                      <SelectItem value="situation">Situation Report</SelectItem>
                      <SelectItem value="resource">Resource Allocation</SelectItem>
                      <SelectItem value="recovery">Recovery Plan</SelectItem>
                      <SelectItem value="impact">Impact Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disaster-event">Disaster Event</Label>
                  <Select defaultValue="hurricane_atlas">
                    <SelectTrigger id="disaster-event">
                      <SelectValue placeholder="Select disaster" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hurricane_atlas">Hurricane Atlas - Mar 2025</SelectItem>
                      <SelectItem value="flood_delta">Delta Flooding - Feb 2025</SelectItem>
                      <SelectItem value="wildfire_omega">Omega Wildfire - Jan 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-format">Output Format</Label>
                  <Select defaultValue="pdf">
                    <SelectTrigger id="report-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="docx">Word Document</SelectItem>
                      <SelectItem value="pptx">PowerPoint Presentation</SelectItem>
                      <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                      <SelectItem value="json">JSON Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Report Sections</Label>
                  <div className="space-y-2 mt-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="section-overview" defaultChecked />
                      <Label htmlFor="section-overview">Event Overview</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="section-damage" defaultChecked />
                      <Label htmlFor="section-damage">Damage Assessment</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="section-impact" defaultChecked />
                      <Label htmlFor="section-impact">Impact Analysis</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="section-response" defaultChecked />
                      <Label htmlFor="section-response">Response Status</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="section-resources" defaultChecked />
                      <Label htmlFor="section-resources">Resource Allocation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="section-recommendations" defaultChecked />
                      <Label htmlFor="section-recommendations">Recommendations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="section-maps" defaultChecked />
                      <Label htmlFor="section-maps">Maps & Imagery</Label>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <Button className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report Preview</CardTitle>
                  <CardDescription>
                    Preview of the currently selected report
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="border-t border-b py-3 px-4 bg-gray-50">
                    <div className="font-bold text-lg">Hurricane Atlas Damage Assessment</div>
                    <div className="text-sm text-gray-500 mt-1">Generated on May 17, 2025</div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-800">1. Event Overview</h3>
                      <div className="text-sm text-gray-600">
                        <p>Hurricane Atlas made landfall on March 15, 2025, as a Category 4 storm with maximum sustained winds of 145 mph. The storm caused extensive damage to coastal infrastructure, residential areas, and natural environments.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-800">2. Damage Assessment</h3>
                      <div className="text-sm text-gray-600">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="bg-red-50 rounded p-2 text-center">
                            <div className="font-medium text-red-800">{disasterData.damageAssessment.buildingDamage.percentage}%</div>
                            <div className="text-xs text-red-600">Building Damage</div>
                          </div>
                          <div className="bg-amber-50 rounded p-2 text-center">
                            <div className="font-medium text-amber-800">{disasterData.damageAssessment.infrastructureDamage.percentage}%</div>
                            <div className="text-xs text-amber-600">Infrastructure Damage</div>
                          </div>
                        </div>
                        <p>The storm caused significant structural damage to {disasterData.damageAssessment.buildingDamage.types[0].percentage}% of buildings in the affected area, with {disasterData.damageAssessment.buildingDamage.types[1].percentage}% experiencing flooding...</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-800">3. Impact Analysis</h3>
                      <div className="text-sm text-gray-600">
                        <p>Approximately {disasterData.impactAnalysis.peopleAffected.toLocaleString()} people were affected by the disaster, with {disasterData.impactAnalysis.peopleDisplaced.toLocaleString()} displaced from their homes...</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 text-center text-gray-400 italic border-t">
                    Full report preview not available
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-3">
                  <div className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Estimated 32 pages
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Report Sharing Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="share-emergency" defaultChecked />
                    <Label htmlFor="share-emergency">Emergency Response Team</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="share-government" />
                    <Label htmlFor="share-government">Government Officials</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="share-partners" />
                    <Label htmlFor="share-partners">Partner Organizations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="share-public" />
                    <Label htmlFor="share-public">Public Dashboard</Label>
                  </div>

                  <div className="pt-2">
                    <Button variant="outline" className="w-full">
                      <Share2 className="mr-2 h-4 w-4" />
                      Configure Sharing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Recently Generated Reports</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sampleReports.slice(0, 4).map((report) => (
                <Card key={report.id} className="overflow-hidden">
                  <div className="border-b p-4 flex justify-between items-start">
                    <div className="rounded-md border p-2 bg-gray-50 text-gray-500">
                      {getFormatIcon(report.format)}
                    </div>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-medium">{report.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{report.description}</p>

                    <div className="flex items-center text-xs text-gray-500 mt-3">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {report.date}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-3">
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Download className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
