from rest_framework import viewsets
from .models import AutoPart
from .serializers import AutoPartSerializer

class AutoPartViewSet(viewsets.ModelViewSet):
    queryset = AutoPart.objects.all()
    serializer_class = AutoPartSerializer