from rest_framework import viewsets , permissions
from .models import Chauffeur, Vehicule, Destination, Tarification, Tournee
from .serializers import (
    ChauffeurSerializer, VehiculeSerializer, 
    DestinationSerializer, TarificationSerializer, TourneeSerializer
)

class ChauffeurViewSet(viewsets.ModelViewSet):
    queryset = Chauffeur.objects.all()
    serializer_class = ChauffeurSerializer
    permission_classes = [IsAgentLogistique]

class VehiculeViewSet(viewsets.ModelViewSet):
    queryset = Vehicule.objects.all()
    serializer_class = VehiculeSerializer
    permission_classes = [IsAgentLogistique]

class DestinationViewSet(viewsets.ModelViewSet):
    queryset = Destination.objects.all()
    serializer_class = DestinationSerializer
    permission_classes = [IsAgentLogistique]

class TarificationViewSet(viewsets.ModelViewSet):
    queryset = Tarification.objects.all()
    serializer_class = TarificationSerializer
    permission_classes = [IsAgentLogistique]

class TourneeViewSet(viewsets.ModelViewSet):
    queryset = Tournee.objects.all()
    serializer_class = TourneeSerializer
    permission_classes = [IsAgentLogistique]

class IsAgentLogistique(permissions.BasePermission):
    def has_permission(self, request, view):
        # Vérifie si l'utilisateur est connecté et s'il a le rôle AGENT
        return request.user.is_authenticated and request.user.role == 'AGENT_LOGISTIQUE'