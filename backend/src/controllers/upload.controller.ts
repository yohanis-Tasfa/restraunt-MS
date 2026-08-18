import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

// Upload middleware
export const uploadMiddleware = upload.single('file');

// Upload payment proof image
export const uploadPaymentProof = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  try {
    // Convert buffer to stream
    const stream = Readable.from(req.file.buffer);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'rms/payment-proofs',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1600, crop: 'limit' },
            { quality: 'auto:good' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.pipe(uploadStream);
    });

    const result = uploadResult as any;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
        },
        'Image uploaded successfully'
      )
    );
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new ApiError(500, `Failed to upload image: ${error.message}`);
  }
});

// Upload profile picture
export const uploadProfilePicture = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  try {
    // Convert buffer to stream
    const stream = Readable.from(req.file.buffer);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'rms/profiles',
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.pipe(uploadStream);
    });

    const result = uploadResult as any;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
        },
        'Profile picture uploaded successfully'
      )
    );
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new ApiError(500, `Failed to upload image: ${error.message}`);
  }
});

// Generic image upload
export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const { folder = 'rms/general' } = req.body;

  try {
    // Convert buffer to stream
    const stream = Readable.from(req.file.buffer);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 1600, height: 1600, crop: 'limit' },
            { quality: 'auto:good' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.pipe(uploadStream);
    });

    const result = uploadResult as any;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
        },
        'Image uploaded successfully'
      )
    );
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new ApiError(500, `Failed to upload image: ${error.message}`);
  }
});
