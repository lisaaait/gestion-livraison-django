from rest_framework import viewsets , permissions
from .models import Chauffeur, Vehicule, Destination, Tarification, Tournee , Expedition

from .serializers import (
    ChauffeurSerializer, VehiculeSerializer, 
    DestinationSerializer, TarificationSerializer, TourneeSerializer , ExpeditionSerializer
)

class ChauffeurViewSet(viewsets.ModelViewSet):
    queryset = Chauffeur.objects.all()
    serializer_class = ChauffeurSerializer
    permission_classes = [permissions.IsAuthenticated]

class VehiculeViewSet(viewsets.ModelViewSet):
    queryset = Vehicule.objects.all()
    serializer_class = VehiculeSerializer
    permission_classes = [permissions.IsAuthenticated]

class DestinationViewSet(viewsets.ModelViewSet):
    queryset = Destination.objects.all()
    serializer_class = DestinationSerializer
    permission_classes = [permissions.IsAuthenticated]

class TarificationViewSet(viewsets.ModelViewSet):
    queryset = Tarification.objects.all()
    serializer_class = TarificationSerializer
    permission_classes = [permissions.IsAuthenticated]

class TourneeViewSet(viewsets.ModelViewSet):
  
    queryset = Tournee.objects.all()
    serializer_class = TourneeSerializer
    permission_classes = [permissions.IsAuthenticated]

class ExpeditionViewSet(viewsets.ModelViewSet):
    queryset = Expedition.objects.all()
    serializer_class = ExpeditionSerializer
    permission_classes = [permissions.IsAuthenticated]
