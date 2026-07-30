import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

// Setting key constants
export const SettingKeys = {
  // Restaurant Settings
  RESTAURANT_NAME: 'restaurant.name',
  RESTAURANT_LOGO: 'restaurant.logo',
  RESTAURANT_EMAIL: 'restaurant.email',
  RESTAURANT_PHONE: 'restaurant.phone',
  RESTAURANT_ADDRESS: 'restaurant.address',
  RESTAURANT_CURRENCY: 'restaurant.currency',
  
  // Tax & Charges
  TAX_RATE: 'tax.rate',
  VAT_RATE: 'tax.vat',
  SERVICE_CHARGE: 'tax.serviceCharge',
  SERVICE_CHARGE_ENABLED: 'tax.serviceChargeEnabled',
  
  // Business Hours
  BUSINESS_HOURS: 'business.hours',
  TIMEZONE: 'business.timezone',
  
  // Order Settings
  ORDER_PREFIX: 'order.prefix',
  ORDER_START_NUMBER: 'order.startNumber',
  AUTO_PRINT_RECEIPT: 'order.autoPrintReceipt',
  AUTO_PRINT_KITCHEN: 'order.autoPrintKitchen',
  ORDER_TIMEOUT: 'order.timeout',
  
  // Payment Settings
  PAYMENT_METHODS: 'payment.methods',
  PAYMENT_GATEWAY: 'payment.gateway',
  TELEBIRR_ENABLED: 'payment.telebirr.enabled',
  CBE_BIRR_ENABLED: 'payment.cbeBirr.enabled',
  
  // Loyalty Settings
  LOYALTY_ENABLED: 'loyalty.enabled',
  LOYALTY_POINTS_RATIO: 'loyalty.pointsRatio',
  LOYALTY_REDEMPTION_RATIO: 'loyalty.redemptionRatio',
  LOYALTY_MIN_ORDER: 'loyalty.minOrder',
  
  // Inventory Settings
  LOW_STOCK_THRESHOLD: 'inventory.lowStockThreshold',
  AUTO_DEDUCT_INVENTORY: 'inventory.autoDeduct',
  EXPIRY_ALERT_DAYS: 'inventory.expiryAlertDays',
  
  // Notification Settings
  EMAIL_NOTIFICATIONS: 'notifications.email.enabled',
  SMS_NOTIFICATIONS: 'notifications.sms.enabled',
  LOW_STOCK_ALERTS: 'notifications.lowStock',
  RESERVATION_ALERTS: 'notifications.reservation',
  
  // Receipt Settings
  RECEIPT_HEADER: 'receipt.header',
  RECEIPT_FOOTER: 'receipt.footer',
  RECEIPT_LOGO: 'receipt.logo',
  RECEIPT_SHOW_TAX: 'receipt.showTax',
  
  // System Settings
  MAINTENANCE_MODE: 'system.maintenanceMode',
  BACKUP_ENABLED: 'system.backup.enabled',
  BACKUP_FREQUENCY: 'system.backup.frequency',
  SESSION_TIMEOUT: 'system.sessionTimeout',
  MAX_LOGIN_ATTEMPTS: 'system.maxLoginAttempts',
};

interface SettingData {
  key: string;
  value: any;
}

export class SettingService {
  async getAll() {
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });

    return settings;
  }

  async getAllGrouped() {
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });

    // Group by category (first part of key before dot)
    const grouped = settings.reduce((acc, setting) => {
      const category = setting.key.split('.')[0];
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {} as Record<string, any[]>);

    return grouped;
  }

  async getByKey(key: string) {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new ApiError(404, `Setting '${key}' not found`);
    }

    return setting;
  }

  async getByCategory(category: string) {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: `${category}.`,
        },
      },
      orderBy: { key: 'asc' },
    });

    return settings;
  }

  async getValue(key: string, defaultValue?: any) {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key },
      });

      return setting ? setting.value : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  async set(key: string, value: any) {
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return setting;
  }

  async setMultiple(settings: SettingData[]) {
    const operations = settings.map((setting) =>
      prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
    );

    await prisma.$transaction(operations);

    return {
      success: true,
      message: `${settings.length} settings updated successfully`,
      count: settings.length,
    };
  }

  async delete(key: string) {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new ApiError(404, `Setting '${key}' not found`);
    }

    await prisma.setting.delete({
      where: { key },
    });

    return {
      success: true,
      message: `Setting '${key}' deleted successfully`,
    };
  }

  async reset(key: string) {
    // Get default value for key
    const defaultValues = this.getDefaultValues();
    const defaultValue = defaultValues[key];

    if (defaultValue === undefined) {
      throw new ApiError(400, `No default value found for setting '${key}'`);
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: defaultValue },
      create: { key, value: defaultValue },
    });

    return setting;
  }

  async resetAll() {
    const defaultValues = this.getDefaultValues();

    const operations = Object.entries(defaultValues).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );

    await prisma.$transaction(operations);

    return {
      success: true,
      message: 'All settings reset to default values',
    };
  }

  async initialize() {
    const defaultValues = this.getDefaultValues();
    const existingSettings = await prisma.setting.findMany();
    const existingKeys = new Set(existingSettings.map((s) => s.key));

    // Only create settings that don't exist
    const newSettings = Object.entries(defaultValues)
      .filter(([key]) => !existingKeys.has(key))
      .map(([key, value]) => ({ key, value }));

    if (newSettings.length > 0) {
      await prisma.setting.createMany({
        data: newSettings,
        skipDuplicates: true,
      });
    }

    return {
      success: true,
      message: `Initialized ${newSettings.length} default settings`,
      count: newSettings.length,
    };
  }

  private getDefaultValues(): Record<string, any> {
    return {
      // Restaurant Settings
      [SettingKeys.RESTAURANT_NAME]: 'My Restaurant',
      [SettingKeys.RESTAURANT_LOGO]: null,
      [SettingKeys.RESTAURANT_EMAIL]: 'info@restaurant.com',
      [SettingKeys.RESTAURANT_PHONE]: '+251900000000',
      [SettingKeys.RESTAURANT_ADDRESS]: 'Addis Ababa, Ethiopia',
      [SettingKeys.RESTAURANT_CURRENCY]: 'ETB',

      // Tax & Charges
      [SettingKeys.TAX_RATE]: 0,
      [SettingKeys.VAT_RATE]: 15,
      [SettingKeys.SERVICE_CHARGE]: 10,
      [SettingKeys.SERVICE_CHARGE_ENABLED]: true,

      // Business Hours
      [SettingKeys.BUSINESS_HOURS]: {
        monday: { open: '08:00', close: '22:00', closed: false },
        tuesday: { open: '08:00', close: '22:00', closed: false },
        wednesday: { open: '08:00', close: '22:00', closed: false },
        thursday: { open: '08:00', close: '22:00', closed: false },
        friday: { open: '08:00', close: '22:00', closed: false },
        saturday: { open: '08:00', close: '23:00', closed: false },
        sunday: { open: '09:00', close: '21:00', closed: false },
      },
      [SettingKeys.TIMEZONE]: 'Africa/Addis_Ababa',

      // Order Settings
      [SettingKeys.ORDER_PREFIX]: 'ORD',
      [SettingKeys.ORDER_START_NUMBER]: 1000,
      [SettingKeys.AUTO_PRINT_RECEIPT]: false,
      [SettingKeys.AUTO_PRINT_KITCHEN]: true,
      [SettingKeys.ORDER_TIMEOUT]: 30, // minutes

      // Payment Settings
      [SettingKeys.PAYMENT_METHODS]: ['CASH', 'CARD', 'MOBILE', 'TELEBIRR', 'CBE_BIRR'],
      [SettingKeys.PAYMENT_GATEWAY]: null,
      [SettingKeys.TELEBIRR_ENABLED]: true,
      [SettingKeys.CBE_BIRR_ENABLED]: true,

      // Loyalty Settings
      [SettingKeys.LOYALTY_ENABLED]: true,
      [SettingKeys.LOYALTY_POINTS_RATIO]: 10, // 10% of order value
      [SettingKeys.LOYALTY_REDEMPTION_RATIO]: 0.5, // 100 points = 50 ETB
      [SettingKeys.LOYALTY_MIN_ORDER]: 100, // Minimum 100 ETB for points

      // Inventory Settings
      [SettingKeys.LOW_STOCK_THRESHOLD]: 10,
      [SettingKeys.AUTO_DEDUCT_INVENTORY]: true,
      [SettingKeys.EXPIRY_ALERT_DAYS]: 7,

      // Notification Settings
      [SettingKeys.EMAIL_NOTIFICATIONS]: false,
      [SettingKeys.SMS_NOTIFICATIONS]: false,
      [SettingKeys.LOW_STOCK_ALERTS]: true,
      [SettingKeys.RESERVATION_ALERTS]: true,

      // Receipt Settings
      [SettingKeys.RECEIPT_HEADER]: 'Thank you for dining with us!',
      [SettingKeys.RECEIPT_FOOTER]: 'Please visit us again!',
      [SettingKeys.RECEIPT_LOGO]: null,
      [SettingKeys.RECEIPT_SHOW_TAX]: true,

      // System Settings
      [SettingKeys.MAINTENANCE_MODE]: false,
      [SettingKeys.BACKUP_ENABLED]: true,
      [SettingKeys.BACKUP_FREQUENCY]: 'daily',
      [SettingKeys.SESSION_TIMEOUT]: 3600, // 1 hour in seconds
      [SettingKeys.MAX_LOGIN_ATTEMPTS]: 5,
    };
  }

  // Helper methods for common settings
  async getRestaurantSettings() {
    return this.getByCategory('restaurant');
  }

  async getTaxSettings() {
    return this.getByCategory('tax');
  }

  async getBusinessHours() {
    return this.getValue(SettingKeys.BUSINESS_HOURS);
  }

  async getOrderSettings() {
    return this.getByCategory('order');
  }

  async getPaymentSettings() {
    return this.getByCategory('payment');
  }

  async getLoyaltySettings() {
    return this.getByCategory('loyalty');
  }

  async getInventorySettings() {
    return this.getByCategory('inventory');
  }

  async getNotificationSettings() {
    return this.getByCategory('notifications');
  }

  async getReceiptSettings() {
    return this.getByCategory('receipt');
  }

  async getSystemSettings() {
    return this.getByCategory('system');
  }
}
