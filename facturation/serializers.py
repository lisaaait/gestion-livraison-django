from rest_framework import serializers
from .models import Facture, Paiement, EtreFacture
from expeditions.models import Expedition


class FactureListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des factures"""
    client_nom = serializers.CharField(source='code_client.nom', read_only=True)
    nb_expeditions = serializers.SerializerMethodField()
    montant_paye = serializers.SerializerMethodField()
    reste_a_payer = serializers.SerializerMethodField()
    
    class Meta:
        model = Facture
        fields = [
            'code_facture', 'date_f', 'code_client', 'client_nom',
            'ht', 'tva', 'ttc', 'est_payee', 'nb_expeditions',
            'montant_paye', 'reste_a_payer'
        ]
    
    def get_nb_expeditions(self, obj):
        return obj.expeditions_facturees.count()
    
    def get_montant_paye(self, obj):
        return obj.montant_paye()
    
    def get_reste_a_payer(self, obj):
        return obj.reste_a_payer()


class FactureDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour une facture"""
    client_nom = serializers.CharField(source='code_client.nom', read_only=True)
    expeditions = serializers.SerializerMethodField()
    paiements = serializers.SerializerMethodField()
    montant_paye = serializers.SerializerMethodField()
    reste_a_payer = serializers.SerializerMethodField()
    
    class Meta:
        model = Facture
        fields = '__all__'
    
    def get_expeditions(self, obj):
        from expeditions.serializers import ExpeditionListSerializer
        expeditions = [ef.numexp for ef in obj.expeditions_facturees.all()]
        return ExpeditionListSerializer(expeditions, many=True).data
    
    def get_paiements(self, obj):
        paiements = obj.paiements.all()
        return PaiementListSerializer(paiements, many=True).data
    
    def get_montant_paye(self, obj):
        return obj.montant_paye()
    
    def get_reste_a_payer(self, obj):
        return obj.reste_a_payer()


class FactureCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour créer/modifier une facture"""
    
    class Meta:
        model = Facture
        fields = ['date_f', 'code_client', 'remarques']


class PaiementListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des paiements"""
    mode_paiement_display = serializers.CharField(source='get_mode_paiement_display', read_only=True)
    facture_ref = serializers.CharField(source='code_facture.__str__', read_only=True)
    
    class Meta:
        model = Paiement
        fields = [
            'reference_p', 'date', 'montant_verse', 'mode_paiement',
            'mode_paiement_display', 'code_facture', 'facture_ref', 'date_creation'
        ]


class PaiementDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour un paiement"""
    mode_paiement_display = serializers.CharField(source='get_mode_paiement_display', read_only=True)
    facture_info = FactureListSerializer(source='code_facture', read_only=True)
    
    class Meta:
        model = Paiement
        fields = '__all__'


class PaiementCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour créer/modifier un paiement"""
    
    class Meta:
        model = Paiement
        fields = ['date', 'montant_verse', 'mode_paiement', 'code_facture', 'remarques']
    
    def validate(self, data):
        """Validation : montant ne doit pas dépasser reste à payer"""
        facture = data.get('code_facture')
        montant = data.get('montant_verse')
        
        if facture and montant:
            reste = facture.reste_a_payer()
            
            # Si modification, ajouter l'ancien montant au reste
            if self.instance:
                reste += self.instance.montant_verse
            
            if montant > reste:
                raise serializers.ValidationError(
                    f"Le montant ({montant} DA) dépasse le reste à payer ({reste} DA)."
                )
        
        return data


class EtreFactureSerializer(serializers.ModelSerializer):
    """Serializer pour la liaison Expedition-Facture"""
    expedition_info = serializers.SerializerMethodField()
    facture_info = serializers.SerializerMethodField()
    
    class Meta:
        model = EtreFacture
        fields = '__all__'
    
    def get_expedition_info(self, obj):
        return {
            'numexp': obj.numexp.numexp,
            'montant': obj.numexp.montant_estime,
            'statut': obj.numexp.get_statut_display()
        }
    
    def get_facture_info(self, obj):
        return {
            'code_facture': obj.code_facture.code_facture,
            'ttc': obj.code_facture.ttc,
            'date': obj.code_facture.date_f
        }


class EtreFactureCreateSerializer(serializers.ModelSerializer):
    """Serializer pour ajouter une expédition à une facture"""
    
    class Meta:
        model = EtreFacture
        fields = ['numexp', 'code_facture']
    
    def validate_numexp(self, value):
        """Vérifier que l'expédition n'est pas déjà facturée"""
        if EtreFacture.objects.filter(numexp=value).exists():
            raise serializers.ValidationError(
                f"L'expédition {value.numexp} est déjà facturée."
            )
        return value