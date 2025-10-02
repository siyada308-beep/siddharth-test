from django.db import models
import uuid
import os
import hashlib

def file_upload_path(instance, filename):
    """Generate file path for new file upload"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('uploads', filename)

def calculate_file_hash(file):
    """Calculate SHA256 hash of file content"""
    hash_sha256 = hashlib.sha256()
    for chunk in file.chunks():
        hash_sha256.update(chunk)
    return hash_sha256.hexdigest()

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to=file_upload_path)
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    size = models.BigIntegerField()
    file_hash = models.CharField(max_length=64, db_index=True)  # SHA256 hash
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['file_hash']),
            models.Index(fields=['file_type']),
            models.Index(fields=['original_filename']),
            models.Index(fields=['uploaded_at']),
        ]
    
    def __str__(self):
        return self.original_filename

class FileReference(models.Model):
    """Track references to the same file uploaded multiple times"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='references')
    reference_filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"Reference to {self.original_file.original_filename}"

class StorageStats(models.Model):
    """Track storage savings from deduplication"""
    total_files_uploaded = models.IntegerField(default=0)
    unique_files_stored = models.IntegerField(default=0)
    total_size_uploaded = models.BigIntegerField(default=0)  # bytes
    actual_size_stored = models.BigIntegerField(default=0)  # bytes
    space_saved = models.BigIntegerField(default=0)  # bytes
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Storage Statistics"
    
    def update_stats(self):
        """Recalculate storage statistics"""
        total_files = File.objects.count() + FileReference.objects.count()
        unique_files = File.objects.count()
        
        # Calculate total size if all files were stored separately
        total_uploaded_size = 0
        for file in File.objects.all():
            ref_count = file.references.count() + 1  # +1 for original
            total_uploaded_size += file.size * ref_count
        
        # Calculate actual stored size
        actual_stored_size = sum(File.objects.values_list('size', flat=True))
        
        self.total_files_uploaded = total_files
        self.unique_files_stored = unique_files
        self.total_size_uploaded = total_uploaded_size
        self.actual_size_stored = actual_stored_size
        self.space_saved = total_uploaded_size - actual_stored_size
        self.save()