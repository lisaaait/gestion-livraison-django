from rest_framework import serializers
from .models import Expedition, Incident


class ExpeditionListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des expéditions"""
    client_nom = serializers.CharField(source='code_client.nom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Expedition
        fields = [
            'numexp', 'poids', 'volume', 'statut', 'statut_display',
            'code_client', 'client_nom', 'montant_estime', 'date_creation'
        ]


class ExpeditionDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour une expédition"""
    client_nom = serializers.CharField(source='code_client.nom', read_only=True)
    tarification_nom = serializers.CharField(source='tarification.type_service.nom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    peut_etre_modifie = serializers.BooleanField(read_only=True)
    peut_etre_supprime = serializers.BooleanField(read_only=True)
    
    # Nombre d'incidents liés
    nb_incidents = serializers.SerializerMethodField()
    
    class Meta:
        model = Expedition
        fields = '__all__'
    
    def get_nb_incidents(self, obj):
        return obj.incidents.count()


class ExpeditionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour créer/modifier une expédition"""
    
    class Meta:
        model = Expedition
        fields = [
            'poids', 'volume', 'statut', 'code_client',
            'tarification', 'description'
        ]
    
    def validate(self, data):
        """Validation personnalisée"""
        # Vérifier si l'expédition peut être modifiée
        if self.instance and not self.instance.peut_etre_modifie():
            raise serializers.ValidationError(
                "Cette expédition ne peut plus être modifiée (statut avancé)."
            )
        return data


class IncidentListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des incidents"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    etat_display = serializers.CharField(source='get_etat_display', read_only=True)
    expedition = serializers.CharField(source='numexp.__str__', read_only=True)
    
    class Meta:
        model = Incident
        fields = [
            'code_inc', 'type', 'type_display', 'etat', 'etat_display',
            'numexp', 'expedition', 'wilaya', 'commune', 'date_creation'
        ]


class IncidentDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour un incident"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    etat_display = serializers.CharField(source='get_etat_display', read_only=True)
    expedition_info = ExpeditionListSerializer(source='numexp', read_only=True)
    
    class Meta:
        model = Incident
        fields = '__all__'


class IncidentCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour créer/modifier un incident"""
    
    class Meta:
        model = Incident
        fields = [
            'type', 'commentaire', 'piece_jointe', 'etat',
            'resolution', 'wilaya', 'commune', 'numexp'
        ]
    
    def validate_numexp(self, value):
        """Vérifier que l'expédition existe"""
        if not value:
            raise serializers.ValidationError("L'expédition est obligatoire.")
        return value
