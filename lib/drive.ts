// Google Drive Service - Following SOLID principles
import { getAccessToken as getToken } from './googleDrive';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime?: string;
  size?: string;
}

export interface IDriveService {
  createFolder(name: string, parentId?: string): Promise<string>;
  findFolder(name: string): Promise<string | null>;
  uploadFile(localPath: string, fileName: string, parentId?: string): Promise<string>;
  downloadFile(fileId: string): Promise<string>;
  findFile(name: string, parentId?: string): Promise<string | null>;
  updateFile(fileId: string, content: string): Promise<void>;
  listFiles(query?: string): Promise<DriveFile[]>;
  deleteFile(fileId: string): Promise<void>;
}

export class GoogleDriveService implements IDriveService {
  private static instance: GoogleDriveService;
  private baseUrl = 'https://www.googleapis.com/drive/v3';
  private uploadUrl = 'https://www.googleapis.com/upload/drive/v3';

  private constructor() {}

  static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  private async getAccessToken(): Promise<string> {
    // Delegate to the client-side token helper (GIS-based)
    return await getToken();
  }

  async createFolder(name: string, parentId?: string): Promise<string> {
    const accessToken = await this.getAccessToken();

    const metadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    };

    const response = await fetch(`${this.baseUrl}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Created folder ${name} with ID: ${result.id}`);
    return result.id;
  }

  async findFolder(name: string): Promise<string | null> {
    const accessToken = await this.getAccessToken();

    const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const response = await fetch(`${this.baseUrl}/files?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search for folder: ${response.statusText}`);
    }

    const result = await response.json();
    return result.files.length > 0 ? result.files[0].id : null;
  }

  async uploadFile(content: string, fileName: string, parentId?: string): Promise<string> {
    const accessToken = await this.getAccessToken();

    const metadata = {
      name: fileName,
      parents: parentId ? [parentId] : undefined,
    };

    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const close_delim = '\r\n--' + boundary + '--';

    const body =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      content +
      close_delim;

      // If uploading to the special appDataFolder, include spaces=appDataFolder
      const spacesParam = parentId === 'appDataFolder' ? '&spaces=appDataFolder' : ''
      const response = await fetch(`${this.uploadUrl}/files?uploadType=multipart${spacesParam}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Uploaded file ${fileName} with ID: ${result.id}`);
    return result.id;
  }

  async downloadFile(fileId: string): Promise<string> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return await response.text();
  }

  async findFile(name: string, parentId?: string): Promise<string | null> {
    const accessToken = await this.getAccessToken();

    // Special-case searching in the appDataFolder: use spaces=appDataFolder instead of parent id predicate.
    let response: Response
    if (parentId === 'appDataFolder') {
      const q = `name='${name}' and trashed=false`;
      response = await fetch(`${this.baseUrl}/files?spaces=appDataFolder&q=${encodeURIComponent(q)}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
    } else {
      let q = `name='${name}' and trashed=false`;
      if (parentId) q += ` and '${parentId}' in parents`;
      response = await fetch(`${this.baseUrl}/files?q=${encodeURIComponent(q)}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
    }

    if (!response.ok) {
      throw new Error(`Failed to search for file: ${response.statusText}`);
    }

    const result = await response.json();
    return result.files && result.files.length > 0 ? result.files[0].id : null;
  }

  async updateFile(fileId: string, content: string): Promise<void> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.uploadUrl}/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: content,
    });

    if (!response.ok) {
      throw new Error(`Failed to update file: ${response.statusText}`);
    }

    console.log(`Updated file with ID: ${fileId}`);
  }

  async listFiles(query?: string): Promise<DriveFile[]> {
    const accessToken = await this.getAccessToken();

    const defaultQuery = 'trashed=false';
    const finalQuery = query ? `${defaultQuery} and ${query}` : defaultQuery;

    const response = await fetch(`${this.baseUrl}/files?q=${encodeURIComponent(finalQuery)}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const result = await response.json();
    return result.files || [];
  }

  async deleteFile(fileId: string): Promise<void> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }

    console.log(`Deleted file with ID: ${fileId}`);
  }
}

// Global drive instance
export const driveService = GoogleDriveService.getInstance();