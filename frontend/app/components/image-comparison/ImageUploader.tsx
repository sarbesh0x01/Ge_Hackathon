"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  onImageUpload: (imageData: any) => void;
  currentImage: any | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  currentImage
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Check if the file is an image
    if (!file.type.match('image.*')) {
      alert('Please upload an image file');
      return;
    }

    try {
      setIsUploading(true);

      // Create form data and upload to API
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const data = await response.json();
      onImageUpload(data);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageUpload(null);
  };

  return (
    <div>
      {currentImage ? (
        <div className="relative">
          <Card className="overflow-hidden">
            <img
              src={`/api/images/${currentImage.image_id}`}
              alt="Uploaded"
              className="w-full h-48 object-cover"
            />
          </Card>
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-white opacity-80 hover:opacity-100"
              onClick={handleButtonClick}
            >
              Change
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="opacity-80 hover:opacity-100"
              onClick={handleRemoveImage}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Card
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center h-48 cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-gray-400 mb-2 animate-spin" />
              <p className="text-sm text-center text-gray-500">
                Uploading image...
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-center text-gray-500">
                Drag & drop an image or click to browse
              </p>
              <p className="text-xs text-center text-gray-400 mt-1">
                Supported formats: JPG, PNG, GIF
              </p>
            </>
          )}
        </Card>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
};

export default ImageUploader;
