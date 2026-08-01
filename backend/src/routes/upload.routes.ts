import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { authenticate } from '../middleware/auth';

const router = Router();

// Single image upload with better error handling
router.post('/image', authenticate, (req: Request, res: Response) => {
  upload.single('image')(req, res, (err: any) => {
    try {
      if (err) {
        console.error('Upload middleware error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
          error: err.toString(),
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      // Multer with CloudinaryStorage adds the cloudinary response to req.file
      const file = req.file as any;
      
      console.log('File uploaded successfully:', {
        path: file.path,
        filename: file.filename,
      });

      res.status(200).json({
        success: true,
        data: {
          url: file.path, // Cloudinary URL
          publicId: file.filename, // Public ID for deletion
        },
        message: 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('Upload handler error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
});

// Multiple images upload (for future use)
router.post('/images', authenticate, (req: Request, res: Response) => {
  upload.array('images', 5)(req, res, (err: any) => {
    try {
      if (err) {
        console.error('Upload middleware error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'Files upload failed',
          error: err.toString(),
        });
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
      }

      const uploadedFiles = req.files.map((file: any) => ({
        url: file.path,
        publicId: file.filename,
      }));

      res.status(200).json({
        success: true,
        data: uploadedFiles,
        message: `${uploadedFiles.length} images uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload handler error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload images',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
});

export default router;
