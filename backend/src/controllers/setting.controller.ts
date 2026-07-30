import { Request, Response } from 'express';
import { SettingService } from '../services/setting.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const settingService = new SettingService();

// ============ GENERAL SETTINGS ============

export const getAllSettings = asyncHandler(async (req: Request, res: Response) => {
  const { grouped } = req.query;

  let settings;
  if (grouped === 'true') {
    settings = await settingService.getAllGrouped();
  } else {
    settings = await settingService.getAll();
  }

  res.json(new ApiResponse(200, settings, 'Settings retrieved successfully'));
});

export const getSettingByKey = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const setting = await settingService.getByKey(key);
  res.json(new ApiResponse(200, setting, 'Setting retrieved successfully'));
});

export const getSettingsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  const settings = await settingService.getByCategory(category);
  res.json(new ApiResponse(200, settings, `${category} settings retrieved successfully`));
});

export const setSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key, value } = req.body;

  if (!key) {
    throw new ApiError(400, 'Setting key is required');
  }

  if (value === undefined) {
    throw new ApiError(400, 'Setting value is required');
  }

  const setting = await settingService.set(key, value);
  res.json(new ApiResponse(200, setting, 'Setting updated successfully'));
});

export const setMultipleSettings = asyncHandler(async (req: Request, res: Response) => {
  const { settings } = req.body;

  if (!settings || !Array.isArray(settings)) {
    throw new ApiError(400, 'Settings array is required');
  }

  if (settings.length === 0) {
    throw new ApiError(400, 'At least one setting is required');
  }

  // Validate each setting has key and value
  for (const setting of settings) {
    if (!setting.key || setting.value === undefined) {
      throw new ApiError(400, 'Each setting must have a key and value');
    }
  }

  const result = await settingService.setMultiple(settings);
  res.json(new ApiResponse(200, result, result.message));
});

export const deleteSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const result = await settingService.delete(key);
  res.json(new ApiResponse(200, result, result.message));
});

export const resetSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const setting = await settingService.reset(key);
  res.json(new ApiResponse(200, setting, `Setting '${key}' reset to default value`));
});

export const resetAllSettings = asyncHandler(async (req: Request, res: Response) => {
  const result = await settingService.resetAll();
  res.json(new ApiResponse(200, result, result.message));
});

export const initializeSettings = asyncHandler(async (req: Request, res: Response) => {
  const result = await settingService.initialize();
  res.json(new ApiResponse(200, result, result.message));
});

// ============ CATEGORY-SPECIFIC SETTINGS ============

export const getRestaurantSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingService.getRestaurantSettings();
  res.json(new ApiResponse(200, settings, 'Restaurant settings retrieved successfully'));
});

export const getTaxSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingService.getTaxSettings();
  res.json(new ApiResponse(200, settings, 'Tax settings retrieved successfully'));
});

export const getBusinessHours = asyncHandler(async (req: Request, res: Response) => {
  const hours = await settingService.getBusinessHours();
  res.json(new ApiResponse(200, hours, 'Business hours retrieved successfully'));
});

export const getOrderSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingService.getOrderSettings();
  res.json(new ApiResponse(200, settings, 'Order settings retrieved successfully'));
});

export const getPaymentSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingService.getPaymentSettings();
  res.json(new ApiResponse(200, settings, 'Payment settings retrieved successfully'));
});

export const getLoyaltySettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingService.getLoyaltySettings();
  res.json(new ApiResponse(200, settings, 'Loyalty settings retrieved successfully'));
});

export const getInventorySettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingService.getInventorySettings();
  res.json(new ApiResponse(200, settings, 'Inventory settings retrieved successfully'));
});

export const getNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingService.getNotificationSettings();
  res.json(new ApiResponse(200, settings, 'Notification settings retrieved successfully'));
});

export const getReceiptSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingService.getReceiptSettings();
  res.json(new ApiResponse(200, settings, 'Receipt settings retrieved successfully'));
});

export const getSystemSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingService.getSystemSettings();
  res.json(new ApiResponse(200, settings, 'System settings retrieved successfully'));
});
