from rest_framework import serializers
from .models import Client, Historique, Reclamation, Rapport, Contient

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'


class HistoriqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Historique
        fields = '__all__'


class ReclamationSerializer(serializers.ModelSerializer):
   client_nom = serializers.CharField(source="CodeClient.Nom", read_only=True)
   client_prenom = serializers.CharField(source="CodeClient.Prenom", read_only=True)
   class Meta:
        model = Reclamation
        fields = ['CodeREC', 'Nature', 'Date', 'Etat', 'CodeClient', 'client_nom', 'client_prenom']
        read_only_fields = ['CodeREC', 'Date'] # Ces champs sont gérés par la DB

class RapportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rapport
        fields = '__all__'


class ContientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contient
        fields = '__all__'



#this class is responible into turning the complex data into simple data that can be rendered into json