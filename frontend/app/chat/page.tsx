"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import DisasterChatbot to avoid SSR issues
const DisasterChatbot = dynamic(
  () => import("@/app/components/DisasterChatbot"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading disaster analysis tool...</p>
        </div>
      </div>
    )
  }
);

const ChatPage = () => {
  return (
    <div className="container mx-auto p-4">
      <DisasterChatbot />
    </div>
  );
};

export default ChatPage;