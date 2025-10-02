export interface File {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
  file_hash: string;
  is_duplicate: boolean;
  reference_count: number;
}

export interface StorageStats {
  total_files_uploaded: number;
  unique_files_stored: number;
  total_size_uploaded: number;
  actual_size_stored: number;
  space_saved: number;
  space_saved_mb: number;
  total_size_mb: number;
  actual_size_mb: number;
  savings_percentage: number;
  last_updated: string;
}