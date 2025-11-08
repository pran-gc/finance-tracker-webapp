// Sync Service - Following SOLID principles
import { driveService } from './drive';
import { getTransactions, getCategories, getCurrencies, getAppSettings, addTransaction, addCategory, addCurrency, updateAppSettings, type AppSettings } from './data';

export interface ISyncService {
  backupToDrive(): Promise<void>;
  restoreFromDrive(): Promise<void>;
  getLastBackupTime(): Promise<Date | null>;
  setLastBackupTime(time: Date): Promise<void>;
}

export interface BackupData {
  transactions: any[];
  categories: any[];
  currencies: any[];
  settings: any;
  timestamp: string;
  version: string;
}

export class GoogleDriveSyncService implements ISyncService {
  private static instance: GoogleDriveSyncService;
  // Single-file backup configuration: per user's request we keep ONE file
  // inside a single folder named 'FinanceTracker' and the file is named
  // 'financetracker.db'. This file is overwritten on each backup so Drive
  // acts as a single source-of-truth snapshot for cross-device restores.
  private readonly BACKUP_FOLDER_NAME = 'FinanceTracker';
  private readonly BACKUP_FILE_NAME = 'financetracker.db';
  private readonly CURRENT_VERSION = '1.0.0';

  private constructor() {}

  static getInstance(): GoogleDriveSyncService {
    if (!GoogleDriveSyncService.instance) {
      GoogleDriveSyncService.instance = new GoogleDriveSyncService();
    }
    return GoogleDriveSyncService.instance;
  }

  async backupToDrive(): Promise<void> {
    try {
      console.log('Starting backup to Google Drive...');

      // Get all data
      const [transactions, categories, currencies, settings] = await Promise.all([
        getTransactions(1000), // Get more transactions for backup
        getCategories(),
        getCurrencies(),
        getAppSettings(),
      ]);

      // Create backup data
      const backupData: BackupData = {
        transactions,
        categories,
        currencies,
        settings,
        timestamp: new Date().toISOString(),
        version: this.CURRENT_VERSION,
      };

      // Find or create backup folder (single folder named 'FinanceTracker')
      let folderId = await driveService.findFolder(this.BACKUP_FOLDER_NAME);
      if (!folderId) {
        folderId = await driveService.createFolder(this.BACKUP_FOLDER_NAME);
      }

      // Use a single file name and overwrite it if it exists
      const fileName = this.BACKUP_FILE_NAME;
      const existingFileId = await driveService.findFile(fileName, folderId);
      if (existingFileId) {
        // update existing file
        await driveService.updateFile(existingFileId, JSON.stringify(backupData, null, 2));
      } else {
        // upload new file into the folder
        await driveService.uploadFile(JSON.stringify(backupData, null, 2), fileName, folderId);
      }

      // Update last backup time
      await this.setLastBackupTime(new Date());

      console.log('Backup completed successfully');
    } catch (error) {
      console.error('Backup failed:', error);
      throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async restoreFromDrive(): Promise<void> {
    try {
      console.log('Starting restore from Google Drive...');

      // Find backup folder and single backup file. If folder or file is missing
      // create them and seed the file from the local DB so Drive always has
      // a single deterministically-named file.
      let folderId = await driveService.findFolder(this.BACKUP_FOLDER_NAME);
      if (!folderId) {
        // create the folder if missing
        folderId = await driveService.createFolder(this.BACKUP_FOLDER_NAME);
      }

      let fileId = await driveService.findFile(this.BACKUP_FILE_NAME, folderId);
      if (!fileId) {
        // No backup file exists yet on Drive. Create one by uploading the
        // current local DB state so the Drive file becomes the single source.
        const [transactions, categories, currencies, settings] = await Promise.all([
          getTransactions(1000),
          getCategories(),
          getCurrencies(),
          getAppSettings(),
        ]);

        const initialBackup: BackupData = {
          transactions,
          categories,
          currencies,
          settings,
          timestamp: new Date().toISOString(),
          version: this.CURRENT_VERSION,
        };

        fileId = await driveService.uploadFile(JSON.stringify(initialBackup, null, 2), this.BACKUP_FILE_NAME, folderId);
      }

      // Download backup data
      const backupContent = await driveService.downloadFile(fileId);

      let backupData: BackupData | null = null
      try {
        backupData = JSON.parse(backupContent)
      } catch (e) {
        console.warn('Failed to parse backup content as JSON; treating as corrupted backup', e)
        backupData = null
      }

      // Validate backup data. If corrupted or invalid, overwrite the Drive file with the
      // current local DB snapshot so the Drive file becomes healthy, then exit gracefully.
      if (!backupData || !this.isValidBackupData(backupData)) {
        console.warn('Invalid backup data format detected on Drive; recreating backup from local state')

        // Create an initial backup from local data
        const [transactions, categories, currencies, settings] = await Promise.all([
          getTransactions(1000),
          getCategories(),
          getCurrencies(),
          getAppSettings(),
        ]);

        const replacement: BackupData = {
          transactions,
          categories,
          currencies,
          settings,
          timestamp: new Date().toISOString(),
          version: this.CURRENT_VERSION,
        };

        // Overwrite the corrupted file with a fresh snapshot
        try {
          await driveService.updateFile(fileId, JSON.stringify(replacement, null, 2))
          console.info('Replaced corrupted Drive backup with a fresh snapshot from local DB')
        } catch (err) {
          console.warn('Failed to replace corrupted backup file on Drive', err)
          // If update failed, attempt to upload a new file alongside
          try {
            const tsName = `financetracker_repaired_${new Date().toISOString().replace(/[:.]/g, '-')}.db`
            await driveService.uploadFile(JSON.stringify(replacement, null, 2), tsName, folderId)
            console.info('Uploaded repaired backup as', tsName)
          } catch (err2) {
            console.error('Failed to upload repaired backup file', err2)
            throw err2
          }
        }

        // Do not attempt to restore from a corrupted backup; return so caller can continue.
        return
      }

      // Restore data
      await this.restoreData(backupData);

      console.log('Restore completed successfully');
    } catch (error) {
      console.error('Restore failed:', error);
      throw new Error(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private isValidBackupData(data: any): data is BackupData {
    return (
      data &&
      Array.isArray(data.transactions) &&
      Array.isArray(data.categories) &&
      Array.isArray(data.currencies) &&
      data.settings &&
      typeof data.timestamp === 'string' &&
      typeof data.version === 'string'
    );
  }

  private async restoreData(backupData: BackupData): Promise<void> {
    // Note: In a real implementation, you might want to clear existing data first
    // But for safety, we'll just add/update data

    // Restore currencies
    for (const currency of backupData.currencies) {
      try {
        await addCurrency(currency);
      } catch (error) {
        console.warn(`Failed to restore currency ${currency.code}:`, error);
      }
    }

    // Restore categories
    for (const category of backupData.categories) {
      try {
        await addCategory(category);
      } catch (error) {
        console.warn(`Failed to restore category ${category.name}:`, error);
      }
    }

    // Restore transactions
    for (const transaction of backupData.transactions) {
      try {
        await addTransaction(transaction);
      } catch (error) {
        console.warn(`Failed to restore transaction ${transaction.id}:`, error);
      }
    }

    // Restore settings
    try {
      await updateAppSettings(backupData.settings);
    } catch (error) {
      console.warn('Failed to restore app settings:', error);
    }
  }

  async getLastBackupTime(): Promise<Date | null> {
    try {
      const settings = await getAppSettings();
      return settings?.last_backup_time ? new Date(settings.last_backup_time) : null;
    } catch (error) {
      console.warn('Failed to get last backup time:', error);
      return null;
    }
  }

  async setLastBackupTime(time: Date): Promise<void> {
    try {
      const settings = await getAppSettings();
      await updateAppSettings({
        ...(settings || {}),
        last_backup_time: time.toISOString(),
      });
    } catch (error) {
      console.warn('Failed to set last backup time:', error);
      throw error;
    }
  }
}

// Global sync instance
export const syncService = GoogleDriveSyncService.getInstance();