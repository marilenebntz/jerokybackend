import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FacesService } from './faces.service';
import { MAX_IMAGE_BYTES } from './constants';

describe('FacesService', () => {
  const configService = {
    getOrThrow: jest.fn(),
    get: jest.fn(),
  } as unknown as ConfigService;

  const rekognitionClient = {
    send: jest.fn(),
  };

  let service: FacesService;

  beforeEach(() => {
    jest.clearAllMocks();
    configService.getOrThrow = jest.fn().mockReturnValue('collection-id');
    configService.get = jest.fn().mockReturnValue('98');
    service = new FacesService(
      rekognitionClient as any,
      configService as unknown as ConfigService,
    );
  });

  it('registerFace should throw when buffer is empty', async () => {
    await expect(service.registerFace(Buffer.alloc(0))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('registerFace should throw when buffer exceeds max size', async () => {
    const oversizedBuffer = Buffer.alloc(MAX_IMAGE_BYTES + 1);
    await expect(service.registerFace(oversizedBuffer)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('registerFace should map Rekognition response', async () => {
    rekognitionClient.send = jest.fn().mockResolvedValue({
      FaceRecords: [
        {
          Face: {
            FaceId: 'face-123',
            ImageId: 'image-abc',
            BoundingBox: {
              Width: 0.2,
              Height: 0.3,
              Left: 0.1,
              Top: 0.1,
            },
            Confidence: 99.1,
          },
        },
      ],
    });

    const result = await service.registerFace(Buffer.from('test'));
    expect(result.faceId).toBe('face-123');
    expect(result.imageId).toBe('image-abc');
    expect(rekognitionClient.send).toHaveBeenCalledTimes(1);
  });

  it('identifyFace should throw NotFound when no matches', async () => {
    rekognitionClient.send = jest.fn().mockResolvedValue({
      FaceMatches: [],
    });

    await expect(
      service.identifyFace(Buffer.from('test')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('identifyFace should throw when buffer exceeds max size', async () => {
    const oversizedBuffer = Buffer.alloc(MAX_IMAGE_BYTES + 1);
    await expect(service.identifyFace(oversizedBuffer)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
