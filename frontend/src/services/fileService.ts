import axios from 'axios';
import { File as FileType, StorageStats } from '../types/file';
import { FilterOptions } from '../components/SearchFilter';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const fileService = {
  async uploadFile(file: File): Promise<{ file: FileType; is_duplicate: boolean; message: string; space_saved?: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/files/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getFiles(filters?: FilterOptions): Promise<FileType[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.fileType) params.append('file_type', filters.fileType);
      if (filters.minSize) params.append('min_size', filters.minSize);
      if (filters.maxSize) params.append('max_size', filters.maxSize);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
    }

    const response = await axios.get(`${API_URL}/files/?${params.toString()}`);
    return response.data;
  },

  async deleteFile(id: string): Promise<void> {
    await axios.delete(`${API_URL}/files/${id}/`);
  },

  async downloadFile(fileUrl: string, filename: string): Promise<void> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'blob',
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download file');
    }
  },

  async getStorageStats(): Promise<StorageStats> {
    const response = await axios.get(`${API_URL}/files/storage_stats/`);
    return response.data;
  },

  async getFileTypes(): Promise<{ file_types: string[] }> {
    const response = await axios.get(`${API_URL}/files/file_types/`);
    return response.data;
  },

  async getFileReferences(fileId: string): Promise<{ original_file: FileType; references: any[]; total_references: number }> {
    const response = await axios.get(`${API_URL}/files/${fileId}/references/`);
    return response.data;
  },
};