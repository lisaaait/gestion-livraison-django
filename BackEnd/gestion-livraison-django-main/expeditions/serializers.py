from rest_framework import serializers
from .models import Expedition, Incident
from clients.models import Client
from logistique.models import Tarification

class ExpeditionListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des expéditions"""
    client_nom = serializers.CharField(source='code_client.nom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    peut_etre_modifie = serializers.SerializerMethodField()
    peut_etre_supprime = serializers.SerializerMethodField()

    class Meta:
        model = Expedition
        fields = [
            'numexp', 'poids', 'volume', 'statut', 'statut_display',
            'code_client', 'client_nom', 'montant_estime', 'date_creation',
            'peut_etre_modifie', 'peut_etre_supprime',
        ]

    def get_peut_etre_modifie(self, obj):
        try:
            return bool(obj.peut_etre_modifie())
        except Exception:
            return False

    def get_peut_etre_supprime(self, obj):
        try:
            return bool(obj.peut_etre_supprime())
        except Exception:
            return False


class ExpeditionDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour une expédition"""
    client_nom = serializers.CharField(source='code_client.nom', read_only=True)
    tarification_nom = serializers.CharField(source='tarification.type_service.nom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    peut_etre_modifie = serializers.SerializerMethodField()
    peut_etre_supprime = serializers.SerializerMethodField()
    nb_incidents = serializers.SerializerMethodField()
    
    class Meta:
        model = Expedition
        fields = [
            'numexp', 'code_client', 'client_nom', 'poids', 'volume', 
            'statut', 'statut_display', 'tarification', 'tarification_nom',
            'description', 'montant_estime', 'date_creation', 'date_modification',
            'peut_etre_modifie', 'peut_etre_supprime', 'nb_incidents',
        ]
    
    def get_nb_incidents(self, obj):
        return obj.incidents.count()

    def get_peut_etre_modifie(self, obj):
        try:
            return bool(obj.peut_etre_modifie())
        except Exception:
            return False
    
    def get_peut_etre_supprime(self, obj):
        try:
            return bool(obj.peut_etre_supprime())
        except Exception:
            return False


class ExpeditionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour créer/modifier une expédition"""
    numexp = serializers.CharField(read_only=True)
    code_client = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        required=False,
        allow_null=True
    )
    poids = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        min_value=0.01,
        required=True
    )
    volume = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        min_value=0.01,
        required=True
    )
    tarification = serializers.PrimaryKeyRelatedField(
        queryset=Tarification.objects.all(),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Expedition
        fields = [
            'numexp',
            'poids', 'volume', 'statut', 'code_client',
            'tarification', 'description',
        ]
    
    def validate(self, data):
        """Validation personnalisée"""
        if self.instance:
            try:
                if not self.instance.peut_etre_modifie():
                    raise serializers.ValidationError(
                        "Cette expédition ne peut plus être modifiée (statut avancé)."
                    )
            except AttributeError:
                pass
        
        if data.get('poids') is not None and data['poids'] < 0:
            raise serializers.ValidationError({"poids": "Le poids doit être positif"})
        
        if data.get('volume') is not None and data['volume'] < 0:
            raise serializers.ValidationError({"volume": "Le volume doit être positif"})
        
        return data


class IncidentListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des incidents"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    etat_display = serializers.CharField(source='get_etat_display', read_only=True)
    expedition = serializers.SerializerMethodField()
    
    class Meta:
        model = Incident
        fields = [
            'code_inc', 'type', 'type_display', 'etat', 'etat_display',
            'numexp', 'expedition', 'wilaya', "commune",'commentaire', 'date_creation', 
            
        ]
    
    def get_expedition(self, obj):
     return f"EXP-{obj.numexp.numexp}" if obj.numexp else None


class IncidentDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour un incident"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    etat_display = serializers.CharField(source='get_etat_display', read_only=True)
    expedition_info = ExpeditionListSerializer(source='numexp', read_only=True)
    expedition = serializers.SerializerMethodField()
    
    class Meta:
        model = Incident
        fields = [
            'code_inc', 'type', 'type_display', 'etat', 'etat_display',
            'numexp', 'expedition','wilaya','commune' 'expedition_info', 'commentaire', 
            'piece_jointe', 'resolution', 'date_creation', 'date_resolution'
        ]
    
    def get_expedition(self, obj):
     return f"EXP-{obj.numexp.numexp}" if obj.numexp else None

    def get_expedition_info(self, obj):
        if obj.numexp:
            return {
                "id": obj.numexp.pk,
                "numexp": obj.numexp.numexp,
                "statut": obj.numexp.statut
            }
        return None
class IncidentCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour créer/modifier un incident"""
    code_inc = serializers.CharField(read_only=True)
    
    class Meta:
        model = Incident
        fields = [
            'code_inc', 'type', 'commentaire', 'piece_jointe', 
            'etat', 'resolution', 'numexp','wilaya', 'commune'
        ]
        extra_kwargs = {
            'commentaire': {'required': False, 'allow_blank': True},  # Plus flexible
            'numexp': {'required': False},  # Plus flexible pour PATCH
            'etat': {'required': False},
            'resolution': {'required': False, 'allow_blank': True},
            'wilaya': {'required': True},
            'commune': {'required': True},
        }
    
    def validate_commentaire(self, value):
        """Valider le commentaire seulement s'il est fourni"""
        if value and len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Le commentaire doit contenir au moins 10 caractères."
            )
        return value.strip() if value else value
    
    def validate(self, data):
        """Validation globale"""
        # Pour la création, commentaire et numexp sont obligatoires
        if not self.instance:  # Mode création
            if not data.get('commentaire'):
                raise serializers.ValidationError({
                    'commentaire': 'Le commentaire est obligatoire lors de la création.'
                })
            if not data.get('numexp'):
                raise serializers.ValidationError({
                    'numexp': 'L\'expédition est obligatoire lors de la création.'
                })
            if not data.get('wilaya'):
                raise serializers.ValidationError({'wilaya': 'La wilaya est obligatoire.'})
            if not data.get('commune'):
                raise serializers.ValidationError({'commune': 'La commune est obligatoire.'})
        
        # Si on résout l'incident, la résolution est obligatoire
        if data.get('etat') == 'RESOLU' and not data.get('resolution'):
            # Vérifier si l'instance existe déjà avec une résolution
            if not (self.instance and self.instance.resolution):
                raise serializers.ValidationError({
                    'resolution': 'La résolution est obligatoire pour un incident résolu.'
                })
        
        return data