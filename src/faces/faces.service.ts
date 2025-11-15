import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteFacesCommand,
  DeleteFacesCommandOutput,
  IndexFacesCommand,
  IndexFacesCommandOutput,
  SearchFacesByImageCommand,
  SearchFacesByImageCommandOutput,
  RekognitionClient,
} from '@aws-sdk/client-rekognition';
import { ServiceException } from '@smithy/smithy-client';
import {
  DeleteFaceResponseDto,
  IdentifyFaceResponseDto,
  RegisterFaceResponseDto,
} from './dto';
import { REKOGNITION_CLIENT } from './providers/rekognition.provider';
import { MAX_IMAGE_BYTES } from './constants';

@Injectable()
export class FacesService {
  constructor(
    @Inject(REKOGNITION_CLIENT)
    private readonly rekognitionClient: RekognitionClient,
    private readonly configService: ConfigService,
  ) {}

  async registerFace(imageBuffer: Buffer): Promise<RegisterFaceResponseDto> {
    this.ensureValidImageBuffer(imageBuffer);

    const command = new IndexFacesCommand({
      CollectionId: this.getCollectionId(),
      Image: { Bytes: imageBuffer },
      DetectionAttributes: [],
      MaxFaces: 1,
    });

    const response = await this.sendCommand<IndexFacesCommandOutput>(command);
    const faceRecord = response.FaceRecords?.[0];

    if (!faceRecord?.Face?.FaceId) {
      throw new BadRequestException('No face detected in the provided image');
    }

    return {
      faceId: faceRecord.Face.FaceId,
      imageId: faceRecord.Face.ImageId,
      boundingBox: faceRecord.Face.BoundingBox,
      confidence: faceRecord.Face.Confidence,
    };
  }

  async identifyFace(imageBuffer: Buffer): Promise<IdentifyFaceResponseDto> {
    this.ensureValidImageBuffer(imageBuffer);

    const command = new SearchFacesByImageCommand({
      CollectionId: this.getCollectionId(),
      Image: { Bytes: imageBuffer },
      FaceMatchThreshold: this.getMatchThreshold(),
      MaxFaces: 1,
    });

    const response =
      await this.sendCommand<SearchFacesByImageCommandOutput>(command);
    const bestMatch = response.FaceMatches?.[0];

    if (!bestMatch?.Face?.FaceId) {
      throw new NotFoundException('No face matched above threshold');
    }

    return {
      matched: true,
      faceId: bestMatch.Face.FaceId,
      similarity: bestMatch.Similarity,
      confidence: bestMatch.Face.Confidence,
    };
  }

  async deleteFace(faceId: string): Promise<DeleteFaceResponseDto> {
    if (!faceId) {
      throw new BadRequestException('faceId is required');
    }

    const command = new DeleteFacesCommand({
      CollectionId: this.getCollectionId(),
      FaceIds: [faceId],
    });

    const response = await this.sendCommand<DeleteFacesCommandOutput>(command);

    return {
      deletedFaceIds: response.DeletedFaces ?? [],
    };
  }

  private getCollectionId(): string {
    return this.configService.getOrThrow<string>('REKOGNITION_COLLECTION_ID');
  }

  private getMatchThreshold(): number {
    const threshold = Number(
      this.configService.get<string>('REKOGNITION_MATCH_THRESHOLD', '98'),
    );

    if (Number.isNaN(threshold)) {
      throw new InternalServerErrorException(
        'Invalid REKOGNITION_MATCH_THRESHOLD value',
      );
    }

    return Math.min(Math.max(threshold, 0), 100);
  }

  private async sendCommand<TResponse>(
    command: Parameters<RekognitionClient['send']>[0],
  ): Promise<TResponse> {
    try {
      return (await this.rekognitionClient.send(command as any)) as TResponse;
    } catch (error) {
      this.handleSdkError(error);
    }
  }

  private handleSdkError(error: unknown): never {
    console.error(error);
    if (error instanceof ServiceException) {
      throw new InternalServerErrorException(
        `Rekognition error: ${error.name}`,
      );
    }

    throw error;
  }

  private ensureValidImageBuffer(
    imageBuffer?: Buffer,
  ): asserts imageBuffer is Buffer {
    if (!imageBuffer?.length) {
      throw new BadRequestException('Image file is required');
    }

    if (imageBuffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image exceeds the 5 MB size limit');
    }
  }
}
