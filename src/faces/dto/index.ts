import { BoundingBox } from '@aws-sdk/client-rekognition';

export interface RegisterFaceResponseDto {
  faceId: string;
  imageId?: string;
  boundingBox?: BoundingBox;
  confidence?: number;
}

export interface IdentifyFaceResponseDto {
  matched: boolean;
  faceId?: string;
  similarity?: number;
  confidence?: number;
}

export interface DeleteFaceResponseDto {
  deletedFaceIds: string[];
}
