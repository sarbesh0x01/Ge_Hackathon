"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, BarChart3, Camera, Download, MapPin } from "lucide-react";
import { disasterData } from "@/app/lib/mockData";

// Enhanced Flood Animation Component
const FloodEffect = ({ isAnimating }) => {
  const canvasRef = useRef(null);

  // Wave animation using canvas for more realistic water movement
  useEffect(() => {
    if (!isAnimating) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Draw water waves
    const animate = () => {
      time += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Water base
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.8)'); // Blue-600
      gradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.85)'); // Blue-500
      gradient.addColorStop(1, 'rgba(96, 165, 250, 0.9)'); // Blue-400

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw multiple wave layers with different frequencies and amplitudes
      drawWaveLayer(ctx, time, canvas.width, 30, 15, 'rgba(255, 255, 255, 0.1)', 1.5);
      drawWaveLayer(ctx, time * 0.8, canvas.width, 20, 10, 'rgba(255, 255, 255, 0.15)', 1.2);
      drawWaveLayer(ctx, time * 1.2, canvas.width, 15, 8, 'rgba(255, 255, 255, 0.12)', 0.9);
      drawWaveLayer(ctx, time * 0.5, canvas.width, 40, 20, 'rgba(37, 99, 235, 0.3)', 2);

      // Water surface highlights
      drawSurfaceHighlights(ctx, time, canvas.width);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAnimating]);

  // Function to draw a single wave layer
  const drawWaveLayer = (ctx, time, width, amplitude, frequency, color, speed) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);

    // Draw top wave
    for (let x = 0; x < width; x++) {
      // Multiple sine waves combined for more realistic movement
      const y = amplitude * Math.sin((x * frequency / width) + (time * speed)) +
        (amplitude / 2) * Math.sin((x * frequency * 2 / width) + (time * speed * 1.5)) +
        (amplitude / 3) * Math.sin((x * frequency * 3 / width) + (time * speed * 0.5));

      ctx.lineTo(x, y + 50); // 50px offset from top
    }

    ctx.lineTo(width, 0);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  // Function to draw surface highlights (light reflections)
  const drawSurfaceHighlights = (ctx, time, width) => {
    const numHighlights = 12;
    const highlightSize = width / numHighlights;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';

    for (let i = 0; i < numHighlights; i++) {
      const x = i * highlightSize + (Math.sin(time + i) * 20);
      const y = Math.sin(time * 0.8 + i * 0.3) * 15 + 60;
      const size = (Math.sin(time + i * 2) * 0.25 + 0.75) * highlightSize * 0.7;

      ctx.beginPath();
      ctx.ellipse(x, y, size, size / 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  return (
    <div className={`fixed inset-0 w-full h-full pointer-events-none z-30 overflow-hidden transition-transform duration-4000 ${isAnimating ? 'translate-y-0' : 'translate-y-full'}`}>
      {/* Canvas for dynamic wave animation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10"
      />

      {/* Additional wave layers for depth */}
      <div className="absolute inset-x-0 top-10 z-20 opacity-60">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="150" viewBox="0 0 1440 150" preserveAspectRatio="none">
          <path
            d="M0,40 C180,100,360,20,540,70 C720,120,900,40,1080,80 C1260,120,1350,50,1440,70 L1440,0 L0,0 Z"
            fill="rgba(255,255,255,0.2)"
            className="animate-wave-slow"
          />
        </svg>
      </div>

      <div className="absolute inset-x-0 top-0 z-20 opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="120" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            d="M0,60 C240,0,480,100,720,60 C960,20,1200,80,1440,60 L1440,0 L0,0 Z"
            fill="rgba(255,255,255,0.15)"
            className="animate-wave-medium"
          />
          <path
            d="M0,40 C320,100,480,20,640,60 C800,100,960,20,1120,60 C1280,100,1360,30,1440,50 L1440,0 L0,0 Z"
            fill="rgba(255,255,255,0.1)"
            className="animate-wave-fast"
          />
        </svg>
      </div>

      {/* Ripple effects */}
      <div className="absolute z-20 left-1/4 top-1/4">
        <div className="w-16 h-16 rounded-full animate-ripple-1"></div>
      </div>
      <div className="absolute z-20 right-1/3 top-1/3">
        <div className="w-12 h-12 rounded-full animate-ripple-2"></div>
      </div>
      <div className="absolute z-20 left-2/3 top-1/5">
        <div className="w-20 h-20 rounded-full animate-ripple-3"></div>
      </div>

      {/* Enhanced floating debris elements */}
      <div className="absolute w-8 h-8 bg-yellow-200/40 rounded rotate-12 animate-float-debris-1 left-1/4 top-1/4"></div>
      <div className="absolute w-12 h-3 bg-gray-300/50 rounded animate-float-debris-2 left-2/3 top-1/3"></div>
      <div className="absolute w-6 h-6 bg-brown-100/40 rounded-sm animate-float-debris-3 right-1/4 top-1/2"></div>
      <div className="absolute w-10 h-1.5 bg-slate-200/60 rounded animate-float-debris-4 right-1/3 top-2/5"></div>
      <div className="absolute w-5 h-4 rounded-lg border border-blue-200/30 bg-blue-100/20 backdrop-blur-sm animate-float-debris-5 left-1/3 top-3/5"></div>

      {/* Enhanced bubbles with various sizes and animations */}
      <div className="absolute w-3 h-3 bg-white/60 rounded-full animate-bubble-1 left-1/5 bottom-10"></div>
      <div className="absolute w-5 h-5 bg-white/50 rounded-full animate-bubble-2 left-2/5 bottom-20"></div>
      <div className="absolute w-2 h-2 bg-white/70 rounded-full animate-bubble-3 left-3/5 bottom-5"></div>
      <div className="absolute w-4 h-4 bg-white/40 rounded-full animate-bubble-4 left-4/5 bottom-15"></div>
      <div className="absolute w-6 h-6 bg-white/30 rounded-full animate-bubble-5 left-1/6 bottom-40"></div>
      <div className="absolute w-2.5 h-2.5 bg-white/65 rounded-full animate-bubble-6 left-3/4 bottom-25"></div>

      {/* Water splashes */}
      <div className="absolute left-1/6 top-20 z-20 animate-splash-1">
        <div className="relative w-12 h-20">
          <div className="absolute bottom-0 w-6 h-6 bg-blue-100/70 rounded-full transform -translate-x-1/2"></div>
          <div className="absolute bottom-3 left-0 w-2 h-12 bg-blue-100/60 rounded-full transform rotate-[-20deg]"></div>
          <div className="absolute bottom-3 right-0 w-2 h-10 bg-blue-100/60 rounded-full transform rotate-[20deg]"></div>
          <div className="absolute bottom-3 left-2 w-1.5 h-8 bg-blue-100/60 rounded-full transform rotate-[-5deg]"></div>
          <div className="absolute bottom-3 right-2 w-1.5 h-7 bg-blue-100/60 rounded-full transform rotate-[5deg]"></div>
        </div>
      </div>

      <div className="absolute right-1/4 top-40 z-20 animate-splash-2 scale-75">
        <div className="relative w-12 h-20">
          <div className="absolute bottom-0 w-6 h-6 bg-blue-100/70 rounded-full transform -translate-x-1/2"></div>
          <div className="absolute bottom-3 left-0 w-2 h-12 bg-blue-100/60 rounded-full transform rotate-[-20deg]"></div>
          <div className="absolute bottom-3 right-0 w-2 h-10 bg-blue-100/60 rounded-full transform rotate-[20deg]"></div>
          <div className="absolute bottom-3 left-2 w-1.5 h-8 bg-blue-100/60 rounded-full transform rotate-[-5deg]"></div>
          <div className="absolute bottom-3 right-2 w-1.5 h-7 bg-blue-100/60 rounded-full transform rotate-[5deg]"></div>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const { disasterInfo } = disasterData;
  const [isFloodAnimating, setIsFloodAnimating] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);

  // Control the flood animation sequence
  useEffect(() => {
    // Set initial state - content visible
    setContentVisible(true);

    // Start flood animation after a short delay
    const startTimer = setTimeout(() => {
      setIsFloodAnimating(true);
      setContentVisible(false);
    }, 800);

    // End flood animation after it's complete
    const endTimer = setTimeout(() => {
      setIsFloodAnimating(false);

      // Show content again after water recedes
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
