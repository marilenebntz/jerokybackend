## Face ID Service

Backend NestJS service that proxies Amazon Rekognition for the dance academy attendance system.  
It receives face images (multipart/form-data), indexes them in a Rekognition collection and exposes endpoints to register, identify and delete faces.

---

## Getting Started

```bash
npm install
npm run start:dev
```

The HTTP server listens on `PORT` (defaults to `3000`) and every endpoint is prefixed with `/api`.

### Environment

Copy `.env.example` to `.env` and fill in the AWS credentials:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx
REKOGNITION_COLLECTION_ID=academy-faces
REKOGNITION_MATCH_THRESHOLD=98
```

- `REKOGNITION_COLLECTION_ID` must already exist in Amazon Rekognition.
- `REKOGNITION_MATCH_THRESHOLD` controls the minimum similarity (0-100) for attendance identification.

## API

All payloads use `multipart/form-data` with an `image` file field except the delete endpoint.

### Register Face

`POST /api/faces`

Registers a new face in the configured collection and returns the generated Rekognition `faceId` so it can be linked to the academy’s user record.

```bash
curl -X POST http://localhost:3000/api/faces \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/path/to/photo.jpg"
```

**Response**

```json
{
  "faceId": "12345678-90ab-cdef-1234-567890abcdef",
  "imageId": "abcdefgh-1234",
  "confidence": 99.2,
  "boundingBox": { "...": "..." }
}
```

### Identify Face (Attendance)

`POST /api/faces/identify`

Searches the collection for the most similar face above the configured threshold.  
Returns the Rekognition `faceId`, similarity and confidence so the web app can match it against the local database.

```bash
curl -X POST http://localhost:3000/api/faces/identify \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/path/to/current-frame.jpg"
```

If no face reaches the threshold the API responds with HTTP `404`.

### Delete Face

`DELETE /api/faces/:faceId`

Removes the specified face from the collection.

```bash
curl -X DELETE http://localhost:3000/api/faces/12345678-90ab-cdef-1234-567890abcdef
```

**Response**

```json
{ "deletedFaceIds": ["12345678-90ab-cdef-1234-567890abcdef"] }
```

## Testing

```bash
npm run test          # unit tests
npm run test:e2e      # e2e tests
```

## Notes

- File uploads are processed in memory (no temporary files) and validated to accept images only.
- All Rekognition interactions use the official `@aws-sdk/client-rekognition` SDK and rely on the configured IAM user/role permissions.
