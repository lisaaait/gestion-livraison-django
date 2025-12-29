from django.shortcuts import render

# Create your views here.
from rest_framework.viewsets import ModelViewSet
from .models import Client, Historique, Reclamation, Rapport, Contient
from .serializers import (
    ClientSerializer, HistoriqueSerializer, ReclamationSerializer, RapportSerializer, ContientSerializer
)

class ClientViewSet(ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer


class HistoriqueViewSet(ModelViewSet):
    queryset = Historique.objects.all()
    serializer_class = HistoriqueSerializer


class ReclamationViewSet(ModelViewSet):
    queryset = Reclamation.objects.all()
    serializer_class = ReclamationSerializer


class RapportViewSet(ModelViewSet):
    queryset = Rapport.objects.all()
    serializer_class = RapportSerializer


class ContientViewSet(ModelViewSet):
    queryset = Contient.objects.all()
    serializer_class = ContientSerializer




    #the class clientViewSet is one responsible for doing all the crud operations by taking care of the ret api operations so no need to write post get ..
    