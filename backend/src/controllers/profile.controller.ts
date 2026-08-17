import { Request, Response } from 'express';
import { profileService } from '../services/profile.service';

export const profileController = {
  // Get current user profile
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const profile = await profileService.getProfile(userId);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update profile information
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const profile = await profileService.updateProfile(userId, req.body);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  // Change password
  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }

      await profileService.changePassword(userId, currentPassword, newPassword);
      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  // Upload profile picture
  async uploadProfilePicture(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const profile = await profileService.uploadProfilePicture(userId, req.file);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get activity log
  async getActivityLog(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { limit } = req.query;
      
      const activities = await profileService.getActivityLog(
        userId,
        limit ? parseInt(limit as string) : 10
      );
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};
