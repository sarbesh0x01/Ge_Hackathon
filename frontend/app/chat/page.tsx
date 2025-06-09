"use client";

import React from "react";
import DisasterChatbot from "@/app/components/DisasterChatbot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, HelpCircle, LinkIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ChatPage() {
  // Get the Groq API key from environment variables
  // If you're still having trouble with the environment variable, you can hardcode your key here for testing
  // (But remove it before production!)
  const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || "";

  // Helpful debugging for environment variables
  console.log("API Key available:", groqApiKey ? "Yes (starts with " + groqApiKey.substring(0, 4) + ")" : "No");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Disaster Information</h1>
        <p className="text-gray-500">
          Access emergency information and assistance through our AI chatbot
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <DisasterChatbot
            apiKey={groqApiKey}
            defaultContext="You are analyzing the current hurricane disaster situation. Focus on providing actionable advice specific to hurricane impacts, damage assessment, and recovery strategies."
            defaultDisaster="hurricane"
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                Ask About
              </CardTitle>
              <CardDescription>Suggested topics for the chatbot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div
                  className="p-2 rounded-md border bg-gray-50 text-sm cursor-pointer hover:bg-blue-50 hover:border-blue-100"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement;
                    if (input) {
                      input.value = "What should I do during a hurricane?";
                      input.focus();
                      // Trigger a change event to update React state
                      const event = new Event('input', { bubbles: true });
                      input.dispatchEvent(event);
                    }
                  }}
                >
                  What should I do during a hurricane?
                </div>
                <div
                  className="p-2 rounded-md border bg-gray-50 text-sm cursor-pointer hover:bg-blue-50 hover:border-blue-100"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement;
                    if (input) {
                      input.value = "How can I prepare for a disaster?";
                      input.focus();
                      // Trigger a change event to update React state
                      const event = new Event('input', { bubbles: true });
                      input.dispatchEvent(event);
                    }
                  }}
                >
                  How can I prepare for a disaster?
                </div>
                <div
                  className="p-2 rounded-md border bg-gray-50 text-sm cursor-pointer hover:bg-blue-50 hover:border-blue-100"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement;
                    if (input) {
                      input.value = "What emergency resources are available?";
                      input.focus();
                      // Trigger a change event to update React state
                      const event = new Event('input', { bubbles: true });
                      input.dispatchEvent(event);
                    }
                  }}
                >
                  What emergency resources are available?
                </div>
                <div
                  className="p-2 rounded-md border bg-gray-50 text-sm cursor-pointer hover:bg-blue-50 hover:border-blue-100"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement;
                    if (input) {
                      input.value = "How do I assess building damage after a hurricane?";
                      input.focus();
                      // Trigger a change event to update React state
                      const event = new Event('input', { bubbles: true });
                      input.dispatchEvent(event);
                    }
                  }}
                >
                  How do I assess building damage after a hurricane?
                </div>
              </div>
            </CardContent>
          </Card>

          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-blue-600" />
              Helpful Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="https://moha.gov.np/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-md border hover:bg-gray-50"
              >
                <span>MOHA</span>
                <LinkIcon className="h-4 w-4 text-gray-400" />
              </a>
              <a
                href="https://nrcs.org/disaster-management/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-md border hover:bg-gray-50"
              >
                <span>Red Cross Disaster Relief</span>
                <LinkIcon className="h-4 w-4 text-gray-400" />
              </a>
              <a
                href="https://www.nepalpolice.gov.np/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-md border hover:bg-gray-50"
              >
                <span>Nepal Police</span>
                <LinkIcon className="h-4 w-4 text-gray-400" />
              </a>
              <a
                href="https://bipad.gov.np/np/national-platform-for-disaster-risk-reduction-npdrr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-md border hover:bg-gray-50"
              >
                <span>Disaster Assistance</span>
                <LinkIcon className="h-4 w-4 text-gray-400" />
              </a>
            </div>
          </CardContent>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Important Notice</h3>
            <p className="text-sm text-amber-700 mt-1">
              This chatbot uses the Groq API for more accurate responses. For real emergencies, always contact local emergency services at 911 and follow official guidance from
              authorities. This tool is designed to provide information and assistance but is not a replacement for
              professional emergency services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
