from django.shortcuts import render
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import datetime
from .models import File, FileReference, StorageStats, calculate_file_hash
from .serializers import FileSerializer, FileReferenceSerializer, StorageStatsSerializer

class FileViewSet(viewsets.ModelViewSet):
    serializer_class = FileSerializer

    def get_queryset(self):
        queryset = File.objects.all()
        
        # Search by filename
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(original_filename__icontains=search)
            )
        
        # Filter by file type
        file_type = self.request.query_params.get('file_type', None)
        if file_type:
            queryset = queryset.filter(file_type__icontains=file_type)
        
        # Filter by size range (in bytes)
        min_size = self.request.query_params.get('min_size', None)
        max_size = self.request.query_params.get('max_size', None)
        if min_size:
            queryset = queryset.filter(size__gte=int(min_size))
        if max_size:
            queryset = queryset.filter(size__lte=int(max_size))
        
        # Filter by upload date range
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                queryset = queryset.filter(uploaded_at__gte=date_from_obj)
            except ValueError:
                pass
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                queryset = queryset.filter(uploaded_at__lte=date_to_obj)
            except ValueError:
                pass
        
        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate file hash for deduplication
        file_hash = calculate_file_hash(file_obj)
        file_obj.seek(0)  # Reset file pointer after reading
        
        # Check if file already exists
        existing_file = File.objects.filter(file_hash=file_hash).first()
        
        if existing_file:
            # File is a duplicate - create a reference instead
            file_reference = FileReference.objects.create(
                original_file=existing_file,
                reference_filename=file_obj.name
            )
            
            # Update storage stats
            self._update_storage_stats()
            
            # Return the original file data with duplicate info
            serializer = self.get_serializer(existing_file)
            return Response({
                'file': serializer.data,
                'is_duplicate': True,
                'message': f'Duplicate file detected. Linked to existing file.',
                'space_saved': existing_file.size
            }, status=status.HTTP_201_CREATED)
        
        # New unique file - store it
        data = {
            'file': file_obj,
            'original_filename': file_obj.name,
            'file_type': file_obj.content_type,
            'size': file_obj.size,
            'file_hash': file_hash
        }
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Update storage stats
        self._update_storage_stats()
        
        headers = self.get_success_headers(serializer.data)
        return Response({
            'file': serializer.data,
            'is_duplicate': False,
            'message': 'File uploaded successfully'
        }, status=status.HTTP_201_CREATED, headers=headers)
    
    def _update_storage_stats(self):
        """Update or create storage statistics"""
        stats, created = StorageStats.objects.get_or_create(id=1)
        stats.update_stats()
    
    @action(detail=False, methods=['get'])
    def storage_stats(self, request):
        """Get storage statistics including deduplication savings"""
        stats, created = StorageStats.objects.get_or_create(id=1)
        if created:
            stats.update_stats()
        
        serializer = StorageStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def file_types(self, request):
        """Get list of all unique file types for filtering"""
        file_types = File.objects.values_list('file_type', flat=True).distinct()
        return Response({'file_types': list(file_types)})
    
    @action(detail=True, methods=['get'])
    def references(self, request, pk=None):
        """Get all references to a specific file"""
        file = self.get_object()
        references = file.references.all()
        serializer = FileReferenceSerializer(references, many=True)
        return Response({
            'original_file': FileSerializer(file).data,
            'references': serializer.data,
            'total_references': references.count()
        })