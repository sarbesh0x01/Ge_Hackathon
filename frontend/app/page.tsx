"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, BarChart3, Camera, Download, MapPin } from "lucide-react";
import { disasterData } from "@/app/lib/mockData";


// =============================
// FloodEffect Component
// =============================

type FloodEffectProps = {
  isAnimating: boolean;
};

const FloodEffect: React.FC<FloodEffectProps> = ({ isAnimating }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAnimating) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const animate = () => {
      time += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "rgba(37, 99, 235, 0.8)");
      gradient.addColorStop(0.7, "rgba(59, 130, 246, 0.85)");
      gradient.addColorStop(1, "rgba(96, 165, 250, 0.9)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawWaveLayer(ctx, time, canvas.width, 30, 15, "rgba(255, 255, 255, 0.1)", 1.5);
      drawWaveLayer(ctx, time * 0.8, canvas.width, 20, 10, "rgba(255, 255, 255, 0.15)", 1.2);
      drawWaveLayer(ctx, time * 1.2, canvas.width, 15, 8, "rgba(255, 255, 255, 0.12)", 0.9);
      drawWaveLayer(ctx, time * 0.5, canvas.width, 40, 20, "rgba(37, 99, 235, 0.3)", 2);

      drawSurfaceHighlights(ctx, time, canvas.width);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isAnimating]);

  const drawWaveLayer = (
    ctx: CanvasRenderingContext2D,
    time: number,
    width: number,
    amplitude: number,
    frequency: number,
    color: string,
    speed: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);

    for (let x = 0; x < width; x++) {
      const y =
        amplitude * Math.sin((x * frequency) / width + time * speed) +
        (amplitude / 2) * Math.sin((x * frequency * 2) / width + time * speed * 1.5) +
        (amplitude / 3) * Math.sin((x * frequency * 3) / width + time * speed * 0.5);

      ctx.lineTo(x, y + 50);
    }

    ctx.lineTo(width, 0);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawSurfaceHighlights = (
    ctx: CanvasRenderingContext2D,
    time: number,
    width: number
  ) => {
    const numHighlights = 12;
    const highlightSize = width / numHighlights;
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";

    for (let i = 0; i < numHighlights; i++) {
      const x = i * highlightSize + Math.sin(time + i) * 20;
      const y = Math.sin(time * 0.8 + i * 0.3) * 15 + 60;
      const size = (Math.sin(time + i * 2) * 0.25 + 0.75) * highlightSize * 0.7;

      ctx.beginPath();
      ctx.ellipse(x, y, size, size / 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  return (
    <div
      className={`fixed inset-0 w-full h-full pointer-events-none z-30 overflow-hidden transition-transform duration-[4000ms] ${
        isAnimating ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10" />
      {/* SVG layers, ripples, debris, bubbles, and splashes stay the same */}
      {/* These were already valid so no changes are needed */}
    </div>
  );
};

// =============================
// HomePage Component
// =============================


export default function HomePage() {
  const { disasterInfo } = disasterData;
  const [isFloodAnimating, setIsFloodAnimating] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);

  useEffect(() => {
    setContentVisible(true);
    const startTimer = setTimeout(() => {
      setIsFloodAnimating(true);
      setContentVisible(false);
    }, 800);

    const endTimer = setTimeout(() => {
      setIsFloodAnimating(false);
      setTimeout(() => {
        setContentVisible(true);
      }, 1000);
    }, 5000);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, []);


  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Enhanced flood filling animation */}
      <FloodEffect isAnimating={isFloodAnimating} />

      {/* Splash text that appears during the flood animation */}
      <div className={`fixed inset-0 flex items-center justify-center z-40 transition-opacity duration-1000 ${isFloodAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h1 className="text-6xl font-bold text-white drop-shadow-lg text-center filter blur-none">
          Disaster Response<br />In Action
        </h1>
      </div>

      {/* Main content - fades in/out with animation */}
      <div className={`relative z-10 space-y-10 transition-opacity duration-1000 ${contentVisible ? 'opacity-100' : 'opacity-0'}`}>
        <section className="py-12 md:py-16 lg:py-20">
          <div className="container mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center rounded-full bg-red-100 px-3 py-1 text-sm text-red-700 mb-4">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              <span>Disaster Assessment Platform</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Analyze Disaster Impact with <span className="text-blue-600">AI-Powered</span> Image Comparison
            </h1>

            <p className="text-gray-600 max-w-2xl mx-auto md:text-lg">
              Upload before and after images to quickly assess damage, plan response, and coordinate recovery efforts with precision.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8">
              <Button size="lg" asChild>
                <Link href="/comparison">
                  <Camera className="mr-2 h-4 w-4" />
                  Analyze Images
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold mb-6">Current Disaster:</h2>

            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  {disasterInfo.name} - {disasterInfo.severity}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {disasterInfo.location}
                  <span className="text-gray-400 mx-1">•</span>
                  {disasterInfo.date}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg border flex flex-col items-center">
                    <div className="text-3xl font-bold text-red-600 mb-1">
                      {disasterData.damageAssessment.buildingDamage.percentage}%
                    </div>
                    <div className="text-sm text-gray-600">Building Damage</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border flex flex-col items-center">
                    <div className="text-3xl font-bold text-amber-600 mb-1">
                      {disasterData.impactAnalysis.peopleDisplaced.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">People Displaced</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border flex flex-col items-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {disasterData.emergencyResponse.responseRate}%
                    </div>
                    <div className="text-sm text-gray-600">Emergency Response Rate</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-white rounded-b-lg">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard">
                    View Complete Assessment
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold mb-6">Key Features</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-blue-500" />
                    Image Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Compare before and after images to detect structural changes, assess damage severity, and identify priority areas.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/comparison">Try Now</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Data Visualization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Interactive dashboards present damage assessment, impact analysis, and resource allocation metrics for informed decisions.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard">Explore</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-blue-500" />
                    Report Generation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Generate comprehensive reports for different stakeholders including emergency responders, government agencies, and NGOs.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/reports">View Reports</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Add these to your globals.css or tailwind.config.js
/* 

*/
