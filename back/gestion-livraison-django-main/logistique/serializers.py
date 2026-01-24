from rest_framework import serializers
from .models import Chauffeur, Vehicule, Destination, Tarification, Tournee, Expedition

class DestinationSerializer(serializers.ModelSerializer):
    code_d = serializers.ReadOnlyField() # ajoutéé par zaki
    class Meta:
        model = Destination
        fields = '__all__'

class TarificationSerializer(serializers.ModelSerializer):
    # On affiche le nom de la ville au lieu du code ID pour le front-end
    destination_nom = serializers.ReadOnlyField(source='destination.ville')

    class Meta:
        model = Tarification
        fields = '__all__'

class ChauffeurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chauffeur
        fields = '__all__'

class VehiculeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicule
        fields = '__all__'
class ExpeditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expedition
        fields = '__all__'
class TourneeSerializer(serializers.ModelSerializer):
    # Pour React, il est utile d'avoir les détails du chauffeur et du véhicule
    expeditions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Expedition.objects.all(),
        required=False
    )
    chauffeur = serializers.SlugRelatedField(
        slug_field='code_chauffeur',
        queryset=Chauffeur.objects.all()
    )
    vehicule = serializers.SlugRelatedField(
        slug_field='matricule',
        queryset=Vehicule.objects.all()
    )
  
    chauffeur_nom = serializers.ReadOnlyField(source='chauffeur.nom')
    vehicule_info = serializers.ReadOnlyField(source='vehicule.matricule')
   

    class Meta:
         model = Tournee
         fields = '__all__'

