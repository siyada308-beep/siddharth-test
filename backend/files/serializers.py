from rest_framework import serializers
from .models import File, FileReference, StorageStats

class FileSerializer(serializers.ModelSerializer):
    is_duplicate = serializers.SerializerMethodField()
    reference_count = serializers.SerializerMethodField()
    
    class Meta:
        model = File
        fields = ['id', 'file', 'original_filename', 'file_type', 'size', 
                  'file_hash', 'uploaded_at', 'is_duplicate', 'reference_count']
        read_only_fields = ['id', 'uploaded_at', 'file_hash']
    
    def get_is_duplicate(self, obj):
        return obj.references.count() > 0
    
    def get_reference_count(self, obj):
        return obj.references.count() + 1  # +1 for original

class FileReferenceSerializer(serializers.ModelSerializer):
    original_file = FileSerializer(read_only=True)
    
    class Meta:
        model = FileReference
        fields = ['id', 'original_file', 'reference_filename', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

class StorageStatsSerializer(serializers.ModelSerializer):
    space_saved_mb = serializers.SerializerMethodField()
    total_size_mb = serializers.SerializerMethodField()
    actual_size_mb = serializers.SerializerMethodField()
    savings_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = StorageStats
        fields = ['total_files_uploaded', 'unique_files_stored', 
                  'total_size_uploaded', 'actual_size_stored', 'space_saved',
                  'space_saved_mb', 'total_size_mb', 'actual_size_mb',
                  'savings_percentage', 'last_updated']
    
    def get_space_saved_mb(self, obj):
        return round(obj.space_saved / (1024 * 1024), 2)
    
    def get_total_size_mb(self, obj):
        return round(obj.total_size_uploaded / (1024 * 1024), 2)
    
    def get_actual_size_mb(self, obj):
        return round(obj.actual_size_stored / (1024 * 1024), 2)
    
    def get_savings_percentage(self, obj):
        if obj.total_size_uploaded == 0:
            return 0
        return round((obj.space_saved / obj.total_size_uploaded) * 100, 2)