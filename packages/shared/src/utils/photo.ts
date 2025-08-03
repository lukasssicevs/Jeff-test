import { ApiClient } from "../api/client.js";
import { decode } from "base64-arraybuffer";

export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class PhotoUploader {
  constructor(private apiClient: ApiClient) {}

  /**
   * Upload a photo to Supabase Storage
   */
  async uploadExpensePhoto(
    file: File | Blob,
    userId: string,
    expenseId?: string
  ): Promise<PhotoUploadResult> {
    try {
      console.log("PhotoUploader: Starting upload:", {
        fileSize: file.size,
        fileType: file.type,
        userId,
        expenseId,
      });

      // Validate file before upload
      const validation = PhotoUploader.validatePhoto(file);
      if (!validation.valid) {
        console.error("PhotoUploader: Validation failed:", validation.error);
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const extension = this.getFileExtension(file);
      const filename = expenseId
        ? `${expenseId}_${timestamp}.${extension}`
        : `temp_${timestamp}_${randomId}.${extension}`;

      // Create file path: userId/filename
      const filePath = `${userId}/${filename}`;

      console.log("PhotoUploader: Upload details:", {
        filename,
        filePath,
        extension,
      });

      // Upload file to Supabase Storage
      const { data, error } = await this.apiClient.client.storage
        .from("expense-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      console.log("PhotoUploader: Supabase response:", { data, error });

      if (error) {
        console.error("Photo upload error:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Get public URL
      const { data: urlData } = this.apiClient.client.storage
        .from("expense-photos")
        .getPublicUrl(data.path);

      console.log("PhotoUploader: Public URL:", urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl,
      };
    } catch (error) {
      console.error("Photo upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Upload a photo from mobile using base64 data (React Native compatible)
   */
  async uploadExpensePhotoMobile(
    base64Data: string,
    mimeType: string,
    userId: string,
    expenseId?: string
  ): Promise<PhotoUploadResult> {
    try {
      console.log("PhotoUploader: Starting mobile upload:", {
        base64Length: base64Data.length,
        mimeType,
        userId,
        expenseId,
      });

      // Convert base64 to ArrayBuffer for Supabase
      const arrayBuffer = decode(base64Data);

      console.log("PhotoUploader: ArrayBuffer created:", {
        byteLength: arrayBuffer.byteLength,
      });

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const extension = this.getFileExtensionFromMimeType(mimeType);
      const filename = expenseId
        ? `${expenseId}_${timestamp}.${extension}`
        : `temp_${timestamp}_${randomId}.${extension}`;

      // Create file path: userId/filename
      const filePath = `${userId}/${filename}`;

      console.log("PhotoUploader: Mobile upload details:", {
        filename,
        filePath,
        extension,
        mimeType,
      });

      // Upload ArrayBuffer to Supabase Storage
      const { data, error } = await this.apiClient.client.storage
        .from("expense-photos")
        .upload(filePath, arrayBuffer, {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: false,
        });

      console.log("PhotoUploader: Mobile Supabase response:", { data, error });

      if (error) {
        console.error("Mobile photo upload error:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Get public URL
      const { data: urlData } = this.apiClient.client.storage
        .from("expense-photos")
        .getPublicUrl(data.path);

      console.log("PhotoUploader: Mobile public URL:", urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl,
      };
    } catch (error) {
      console.error("Mobile photo upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete a photo from Supabase Storage
   */
  async deleteExpensePhoto(photoUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const filePath = this.extractFilePathFromUrl(photoUrl);
      if (!filePath) {
        console.error("Invalid photo URL:", photoUrl);
        return false;
      }

      const { error } = await this.apiClient.client.storage
        .from("expense-photos")
        .remove([filePath]);

      if (error) {
        console.error("Photo deletion error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Photo deletion failed:", error);
      return false;
    }
  }

  /**
   * Get file extension from File or Blob
   */
  private getFileExtension(file: File | Blob): string {
    if (file instanceof File && file.name) {
      const parts = file.name.split(".");
      return parts.length > 1 ? parts.pop()!.toLowerCase() : "jpg";
    }

    // Default based on MIME type
    const mimeType = file.type;
    if (mimeType.includes("jpeg")) return "jpg";
    if (mimeType.includes("png")) return "png";
    if (mimeType.includes("webp")) return "webp";
    if (mimeType.includes("heic")) return "heic";

    return "jpg"; // Default fallback
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtensionFromMimeType(mimeType: string): string {
    if (mimeType.includes("jpeg")) return "jpg";
    if (mimeType.includes("png")) return "png";
    if (mimeType.includes("webp")) return "webp";
    if (mimeType.includes("heic")) return "heic";
    return "jpg"; // Default fallback
  }

  /**
   * Extract file path from Supabase Storage URL
   */
  private extractFilePathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");

      // Find the bucket name and extract everything after it
      const bucketIndex = pathParts.findIndex(
        (part) => part === "expense-photos"
      );
      if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
        return null;
      }

      return pathParts.slice(bucketIndex + 1).join("/");
    } catch (error) {
      console.error("Error extracting file path from URL:", error);
      return null;
    }
  }

  /**
   * Validate photo file
   */
  static validatePhoto(file: File | Blob): { valid: boolean; error?: string } {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: "Photo must be smaller than 5MB",
      };
    }

    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Photo must be JPEG, PNG, WebP, or HEIC format",
      };
    }

    return { valid: true };
  }

  /**
   * Compress image file (basic implementation)
   */
  static async compressPhoto(
    file: File,
    maxWidth: number = 1200,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxWidth / height);

        canvas.width = width * ratio;
        canvas.height = height * ratio;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
}
