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
    class Meta:
        model = Reclamation
        fields = '__all__'


class RapportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rapport
        fields = '__all__'


class ContientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contient
        fields = '__all__'



#this class is responible into turning 