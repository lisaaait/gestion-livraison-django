from rest_framework import serializers
from .models import Facture, Paiement, EtreFacture
from expeditions.models import Expedition

class FactureListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des factures (fields compatibles front)"""
    code_client = serializers.PrimaryKeyRelatedField(read_only=True)
    client_nom = serializers.CharField(source='code_client.Nom', read_only=True)
    client_prenom = serializers.CharField(source='code_client.Prenom', read_only=True)
    nb_expeditions = serializers.SerializerMethodField()
    montant_paye = serializers.SerializerMethodField()
    date_echeance = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = [
             'code_facture', 'date_f', 'code_client', 'client_nom', 'client_prenom',
            'ht', 'tva', 'ttc', 'est_payee', 'nb_expeditions',
            'montant_paye', 'montant_restant', 'date_echeance', 'date_creation', 'remarques'
        ]

    def get_nb_expeditions(self, obj):
        return obj.expeditions_facturees.count()

    def get_montant_paye(self, obj):
        try:
            return float(obj.montant_paye())
        except Exception:
            return 0.0
    
    def get_montant_restant(self, obj):
        try:
            return float(obj.reste_a_payer())
        except Exception:
            ttc = getattr(obj, 'ttc', 0) or 0
            try:
                return float(ttc) - float(obj.montant_paye())
            except Exception:
                return 0.0

    def get_date_echeance(self, obj):
        if obj.date_f:
            from datetime import timedelta
            return (obj.date_f + timedelta(days=30)).isoformat()
        return None


class FactureDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour une facture (format compatible front pour paiements)"""
    client_nom = serializers.CharField(source='code_client.Nom', read_only=True)
    client_prenom = serializers.CharField(source='code_client.Prenom', read_only=True)
    expeditions = serializers.SerializerMethodField()
    paiements = serializers.SerializerMethodField()
    montant_paye = serializers.SerializerMethodField()
    montant_restant = serializers.SerializerMethodField()
    date_echeance = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = '__all__'

    def get_expeditions(self, obj):
        from expeditions.serializers import ExpeditionListSerializer
        expeditions = [ef.numexp for ef in obj.expeditions_facturees.all()]
        return ExpeditionListSerializer(expeditions, many=True).data

    def get_paiements(self, obj):
        paiements = obj.paiements.all()
        result = []
        for p in paiements:
            result.append({
                'id': p.reference_p,  # ← ID du paiement
                'date_paiement': p.date.isoformat() if getattr(p, 'date', None) else None,
                'montant': float(getattr(p, 'montant_verse', 0) or 0),
                'mode_paiement': p.mode_paiement,
                'reference': f"PAY-{p.reference_p:05d}",  # ← Formatage de la référence
                'remarques': getattr(p, 'remarques', '') or ''
            })
        return result

    def get_montant_paye(self, obj):
        try:
            return float(obj.montant_paye())
        except Exception:
            return 0.0

    def get_montant_restant(self, obj):
        try:
            return float(obj.reste_a_payer())
        except Exception:
            ttc = getattr(obj, 'ttc', 0) or 0
            try:
                return float(ttc) - float(obj.montant_paye())
            except Exception:
                return 0.0

    def get_date_echeance(self, obj):
        if obj.date_f:
            from datetime import timedelta
            return (obj.date_f + timedelta(days=30)).isoformat()
        return None


class FactureCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour créer/modifier une facture — accepte les champs front"""
    class Meta:
        model = Facture
        fields = [ 'code_facture', 'date_f', 'code_client', 'ht', 'tva', 'ttc', 'date_creation', 'remarques', 'est_payee']
        extra_kwargs = {
            'code_facture': {'required': False, 'allow_blank': True},
            'remarques': {'required': False, 'allow_blank': True},
            'est_payee': {'required': False, 'default': False},
            'date_f': {'required': False},
            'ht': {'required': False, 'default': 0},
            'tva': {'required': False, 'default': 0},
        }
    
    def validate(self, data):
        if not data.get('code_facture'):
            from django.utils import timezone
            derniere_facture = Facture.objects.order_by('-code_facture').first()
            if derniere_facture and derniere_facture.code_facture:
                try:
                    dernier_num = int(derniere_facture.code_facture.split('-')[-1])
                    data['code_facture'] = f"FACT-{dernier_num + 1:05d}"
                except:
                    data['code_facture'] = f"FACT-{timezone.now().strftime('%Y%m%d%H%M%S')}"
            else:
                data['code_facture'] = f"FACT-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        
        if 'ttc' not in data or data['ttc'] is None:
            ht = data.get('ht', 0) or 0
            tva = data.get('tva', 0) or 0
            data['ttc'] = ht + tva
        
        return data


class PaiementListSerializer(serializers.ModelSerializer):
    """Serializer pour renvoyer paiements (liste) — conserve champs DB"""
    id = serializers.IntegerField(source='reference_p', read_only=True)
    mode_paiement_display = serializers.CharField(source='get_mode_paiement_display', read_only=True)
    reference = serializers.SerializerMethodField()
    code_facture = serializers.CharField(source='code_facture.code_facture', read_only=True)
    
    class Meta:
        model = Paiement
        fields = [
            'id', 'reference', 'date', 'montant_verse', 'mode_paiement',
            'mode_paiement_display', 'code_facture', 'date_creation', 'remarques'
        ]
    
    def get_reference(self, obj):
        """Formater la référence pour l'affichage"""
        return f"PAY-{obj.reference_p:05d}"


class PaiementDetailSerializer(serializers.ModelSerializer):
    mode_paiement_display = serializers.CharField(source='get_mode_paiement_display', read_only=True)
    facture_info = FactureListSerializer(source='code_facture', read_only=True)
    code_facture_str = serializers.CharField(source='code_facture.code_facture', read_only=True)
    reference = serializers.SerializerMethodField()

    class Meta:
        model = Paiement
        fields = '__all__'
    
    def get_reference(self, obj):
        return f"PAY-{obj.reference_p:05d}"


class PaiementCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer pour créer/modifier un paiement.
    
    IMPORTANT: reference_p est un AutoField (clé primaire auto-incrémentée),
    donc on ne l'inclut PAS dans les champs éditables.
    """
    code_facture = serializers.CharField(write_only=True)
    
    class Meta:
        model = Paiement
        # ✅ CORRECTION: Ne PAS inclure reference_p car c'est un AutoField (PK)
        fields = ['date', 'montant_verse', 'mode_paiement', 'code_facture', 'remarques']
        extra_kwargs = {
            'remarques': {'required': False, 'allow_blank': True},
            'date': {'required': True},
            'montant_verse': {'required': True},
            'mode_paiement': {'required': True},
        }
    
    def validate_code_facture(self, value):
        """Convertir le code_facture (string) en objet Facture"""
        try:
            facture = Facture.objects.get(code_facture=value)
            return facture
        except Facture.DoesNotExist:
            raise serializers.ValidationError(
                f"La facture {value} n'existe pas."
            )
    
    def validate(self, data):
        """Validation du montant par rapport au reste à payer"""
        facture = data.get('code_facture')
        montant = data.get('montant_verse')
        
        if facture and montant is not None:
            reste = facture.reste_a_payer()
            
            # Si on modifie un paiement existant, ajouter son ancien montant au reste
            if self.instance:
                reste += self.instance.montant_verse
            
            if montant > reste:
                raise serializers.ValidationError({
                    'montant_verse': f"Le montant ({montant} DA) dépasse le reste à payer ({reste} DA)."
                })
        
        return data
    
    def create(self, validated_data):
        """Créer le paiement et mettre à jour la facture"""
        paiement = super().create(validated_data)
        
        # Mettre à jour automatiquement le statut de la facture
        facture = paiement.code_facture
        if facture.reste_a_payer() <= 0:
            facture.est_payee = True
            facture.save()
        
        return paiement

    def update(self, instance, validated_data):
        """Mettre à jour le paiement et recalculer la facture"""
        old_facture = instance.code_facture
        
        paiement = super().update(instance, validated_data)
        
        # Mettre à jour le statut de l'ancienne facture
        if old_facture.reste_a_payer() > 0:
            old_facture.est_payee = False
        else:
            old_facture.est_payee = True
        old_facture.save()
        
        # Mettre à jour le statut de la nouvelle facture (si changée)
        new_facture = paiement.code_facture
        if new_facture != old_facture:
            if new_facture.reste_a_payer() <= 0:
                new_facture.est_payee = True
            else:
                new_facture.est_payee = False
            new_facture.save()
        
        return paiement


class EtreFactureSerializer(serializers.ModelSerializer):
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
    class Meta:
        model = EtreFacture
        fields = ['numexp', 'code_facture']

    def validate_numexp(self, value):
        if EtreFacture.objects.filter(numexp=value).exists():
            raise serializers.ValidationError(
                f"L'expédition {value.numexp} est déjà facturée."
            )
        return value