import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from '../config/cloudinary';

export interface QRCodeData {
  tableId: string;
  branchId: string;
  qrCodeData: string; // Unique identifier
  url: string; // Customer menu URL
}

export interface QRCodeResult {
  qrCodeData: string;
  qrCodeUrl: string; // Cloudinary URL
  menuUrl: string; // URL customer will access
}

/**
 * Generate QR code for a table
 * @param tableId - Table ID
 * @param tableNumber - Table number for display
 * @param branchId - Branch ID
 * @returns QR code data and Cloudinary URL
 */
export const generateTableQRCode = async (
  tableId: string,
  tableNumber: string,
  branchId: string
): Promise<QRCodeResult> => {
  try {
    // Generate unique QR code identifier
    const qrCodeData = `table_${tableId}_${uuidv4()}`;
    
    // Construct the customer menu URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const menuUrl = `${frontendUrl}/menu/table/${qrCodeData}`;
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    // Upload QR code to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(qrCodeDataUrl, {
      folder: 'qr-codes',
      public_id: `table_${tableNumber}_${branchId}_${Date.now()}`,
      resource_type: 'image',
      overwrite: false,
    });
    
    return {
      qrCodeData,
      qrCodeUrl: uploadResult.secure_url,
      menuUrl,
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code as buffer (for direct download)
 * @param menuUrl - Customer menu URL
 * @returns QR code image buffer
 */
export const generateQRCodeBuffer = async (menuUrl: string): Promise<Buffer> => {
  try {
    const buffer = await QRCode.toBuffer(menuUrl, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 400,
      margin: 2,
    });
    
    return buffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
};

/**
 * Regenerate QR code for an existing table
 * @param tableId - Table ID
 * @param tableNumber - Table number
 * @param branchId - Branch ID
 * @param oldQrCodeUrl - Old Cloudinary URL to delete
 * @returns New QR code data
 */
export const regenerateTableQRCode = async (
  tableId: string,
  tableNumber: string,
  branchId: string,
  oldQrCodeUrl?: string
): Promise<QRCodeResult> => {
  try {
    // Delete old QR code from Cloudinary if exists
    if (oldQrCodeUrl) {
      try {
        const publicId = extractPublicIdFromUrl(oldQrCodeUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        console.warn('Failed to delete old QR code:', error);
        // Continue anyway - not critical
      }
    }
    
    // Generate new QR code
    return await generateTableQRCode(tableId, tableNumber, branchId);
  } catch (error) {
    console.error('Error regenerating QR code:', error);
    throw new Error('Failed to regenerate QR code');
  }
};

/**
 * Extract Cloudinary public ID from URL
 * @param url - Cloudinary URL
 * @returns Public ID or null
 */
const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    // Example URL: https://res.cloudinary.com/xxx/image/upload/v1234/qr-codes/table_1_branch_1_timestamp.png
    const matches = url.match(/\/qr-codes\/(.+)\./);
    if (matches && matches[1]) {
      return `qr-codes/${matches[1]}`;
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Validate QR code data format
 * @param qrCodeData - QR code identifier
 * @returns Boolean indicating if valid
 */
export const validateQRCodeData = (qrCodeData: string): boolean => {
  // Format: table_{tableId}_{uuid}
  const pattern = /^table_[a-f0-9-]+_[a-f0-9-]+$/;
  return pattern.test(qrCodeData);
};

/**
 * Extract table ID from QR code data
 * @param qrCodeData - QR code identifier
 * @returns Table ID or null
 */
export const extractTableIdFromQRCode = (qrCodeData: string): string | null => {
  try {
    if (!validateQRCodeData(qrCodeData)) {
      return null;
    }
    
    // Format: table_{tableId}_{uuid}
    const parts = qrCodeData.split('_');
    if (parts.length >= 2) {
      return parts[1];
    }
    return null;
  } catch (error) {
    return null;
  }
};
