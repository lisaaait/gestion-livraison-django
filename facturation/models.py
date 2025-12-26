from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal
from expeditions.models import Expedition


class Facture(models.Model):
    """
    Modèle pour gérer les factures clients.
    Une facture regroupe une ou plusieurs expéditions d'un même client.
    Calcule automatiquement HT, TVA et TTC.
    """
    
    # Taux de TVA standard en Algérie
    TAUX_TVA = Decimal('0.19')  # 19%
    
    code_facture = models.AutoField(
        primary_key=True,
        verbose_name="Code Facture"
    )
    
    date_f = models.DateField(
        verbose_name="Date de facturation",
        help_text="Date d'émission de la facture"
    )
    
    # Clé étrangère vers CLIENT (NULL pour l'instant)
    code_client = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Code Client",
        help_text="Référence au client (FK vers table CLIENT)"
    )
    
    # Montant HT = somme des montants des expéditions (calculé automatiquement)
    ht = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Montant HT (DA)",
        help_text="Montant Hors Taxes (somme des expéditions, calculé automatiquement)",
        editable=False,  # Lecture seule, calculé automatiquement
        default=Decimal('0.00')
    )
    
    # TVA = HT × 19% (calculé automatiquement)
    tva = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Montant TVA (DA)",
        help_text="TVA calculée sur HT (19%, calculé automatiquement)",
        editable=False,  # Lecture seule, calculé automatiquement
        default=Decimal('0.00')
    )
    
    # TTC = HT + TVA (calculé automatiquement)
    ttc = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Montant TTC (DA)",
        help_text="Montant Total Toutes Taxes Comprises (HT + TVA, calculé automatiquement)",
        editable=False,  # Lecture seule, calculé automatiquement
        default=Decimal('0.00')
    )
    
    # Champs supplémentaires utiles
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    
    remarques = models.TextField(
        blank=True,
        null=True,
        verbose_name="Remarques",
        help_text="Notes ou commentaires sur la facture"
    )
    
    est_payee = models.BooleanField(
        default=False,
        verbose_name="Payée intégralement",
        help_text="Indique si la facture est totalement payée"
    )
    
    class Meta:
        db_table = 'facture'
        verbose_name = "Facture"
        verbose_name_plural = "Factures"
        ordering = ['-date_f', '-code_facture']
        indexes = [
            models.Index(fields=['code_client']),
            models.Index(fields=['date_f']),
            models.Index(fields=['est_payee']),
        ]
    
    def __str__(self):
        return f"FACT-{self.code_facture} - {self.ttc} DA"
    
    def calculer_montants(self):
        """
        Calcule automatiquement HT, TVA et TTC.
        
        Formules :
        - HT = somme des montants_estime des expéditions facturées
        - TVA = HT × 0.19 (taux standard en Algérie)
        - TTC = HT + TVA
        """
        # Calculer HT = somme des montants des expéditions
        expeditions = self.expeditions_facturees.all()
        self.ht = sum(exp.numexp.montant_estime or Decimal('0.00') for exp in expeditions)
        
        # Calculer TVA
        self.tva = self.ht * self.TAUX_TVA
        
        # Calculer TTC
        self.ttc = self.ht + self.tva
    
    def calculer_montant_depuis_expeditions(self):
        """
        Recalcule les montants HT, TVA et TTC à partir des expéditions liées.
        Utilisé après ajout/suppression d'une expédition dans la facture.
        """
        self.calculer_montants()  # Même logique que calculer_montants()
    
    def montant_paye(self):
        """
        Calcule le montant total déjà payé pour cette facture.
        """
        total = self.paiements.aggregate(
            total=models.Sum('montant_verse')
        )['total']
        return total or Decimal('0.00')
    
    def reste_a_payer(self):
        """
        Calcule le montant restant à payer.
        """
        return self.ttc - self.montant_paye()
    
    def verifier_paiement_complet(self):
        """
        Vérifie si la facture est payée intégralement.
        Met à jour le champ est_payee.
        """
        reste = self.reste_a_payer()
        self.est_payee = (reste <= Decimal('0.00'))
        self.save(update_fields=['est_payee'])
    
    def save(self, *args, **kwargs):
        """
        Override de save pour calculer automatiquement HT, TVA et TTC.
        """
        # Toujours calculer les montants
        self.calculer_montants()
        
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """
        Override de delete pour gérer les implications.
        La suppression d'une facture doit :
        1. Supprimer tous les paiements associés
        2. Mettre à jour le solde client (à gérer plus tard)
        """
        # Les paiements seront supprimés automatiquement via CASCADE
        super().delete(*args, **kwargs)


class Paiement(models.Model):
    """
    Modèle pour gérer les paiements des factures.
    Permet de suivre les paiements partiels ou complets.
    """
    
    # Choix pour le mode de paiement
    MODE_PAIEMENT_CHOICES = [
        ('ESPECES', 'Espèces'),
        ('CHEQUE', 'Chèque'),
        ('VIREMENT', 'Virement bancaire'),
        ('CARTE', 'Carte bancaire'),
        ('MOBILE', 'Paiement mobile'),
    ]
    
    reference_p = models.AutoField(
        primary_key=True,
        verbose_name="Référence Paiement"
    )
    
    date = models.DateField(
        verbose_name="Date du paiement"
    )
    
    montant_verse = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Montant versé (DA)",
        help_text="Montant payé par le client"
    )
    
    mode_paiement = models.CharField(
        max_length=20,
        choices=MODE_PAIEMENT_CHOICES,
        default='ESPECES',
        verbose_name="Mode de paiement"
    )
    
    # Clé étrangère vers FACTURE
    code_facture = models.ForeignKey(
        Facture,
        on_delete=models.CASCADE,
        verbose_name="Facture",
        related_name='paiements'
    )
    
    # Champs supplémentaires
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'enregistrement"
    )
    
    remarques = models.TextField(
        blank=True,
        null=True,
        verbose_name="Remarques",
        help_text="Notes sur le paiement (numéro de chèque, etc.)"
    )
    
    class Meta:
        db_table = 'paiement'
        verbose_name = "Paiement"
        verbose_name_plural = "Paiements"
        ordering = ['-date', '-reference_p']
        indexes = [
            models.Index(fields=['code_facture']),
            models.Index(fields=['date']),
            models.Index(fields=['mode_paiement']),
        ]
    
    def __str__(self):
        return f"PAIE-{self.reference_p} - {self.montant_verse} DA"
    
    def clean(self):
        """
        Validation personnalisée pour vérifier que le montant versé
        ne dépasse pas le reste à payer de la facture.
        """
        if self.code_facture:
            reste = self.code_facture.reste_a_payer()
            
            # Si c'est une modification, exclure le montant actuel
            if self.pk:
                ancien_montant = Paiement.objects.get(pk=self.pk).montant_verse
                reste += ancien_montant
            
            if self.montant_verse > reste:
                raise ValidationError(
                    f"Le montant versé ({self.montant_verse} DA) dépasse le reste à payer ({reste} DA)"
                )
    
    def save(self, *args, **kwargs):
        """
        Override de save pour :
        1. Valider le montant
        2. Mettre à jour le statut de paiement de la facture
        3. Mettre à jour le solde client (à implémenter plus tard)
        """
        self.full_clean()  # Appeler la validation
        super().save(*args, **kwargs)
        
        # Vérifier si la facture est maintenant payée intégralement
        self.code_facture.verifier_paiement_complet()
    
    def delete(self, *args, **kwargs):
        """
        Override de delete pour mettre à jour le statut de la facture après suppression.
        """
        facture = self.code_facture
        super().delete(*args, **kwargs)
        
        # Réévaluer le statut de paiement de la facture
        facture.verifier_paiement_complet()


class EtreFacture(models.Model):
    """
    Table de liaison entre Expédition et Facture.
    Permet de regrouper plusieurs expéditions dans une même facture.
    """
    
    numexp = models.ForeignKey(
        Expedition,
        on_delete=models.CASCADE,
        verbose_name="Expédition",
        related_name='etre_facture_set'
    )
    
    code_facture = models.ForeignKey(
        Facture,
        on_delete=models.CASCADE,
        verbose_name="Facture",
        related_name='expeditions_facturees'
    )
    
    # Date d'ajout de l'expédition à la facture
    date_ajout = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'ajout"
    )
    
    class Meta:
        db_table = 'etre_facture'
        verbose_name = "Expédition facturée"
        verbose_name_plural = "Expéditions facturées"
        unique_together = ['numexp', 'code_facture']
        indexes = [
            models.Index(fields=['numexp']),
            models.Index(fields=['code_facture']),
        ]
    
    def __str__(self):
        return f"EXP-{self.numexp.numexp} → FACT-{self.code_facture.code_facture}"
    
    def clean(self):
        """
        Validation pour s'assurer que :
        1. L'expédition et la facture appartiennent au même client
        2. L'expédition n'est pas déjà facturée ailleurs
        """
        # Vérifier que l'expédition n'est pas déjà dans une autre facture
        if self.pk is None:  # Seulement pour les nouveaux enregistrements
            if EtreFacture.objects.filter(numexp=self.numexp).exists():
                raise ValidationError(
                    f"L'expédition {self.numexp.numexp} est déjà facturée."
                )
        
        # Vérifier que client de l'expédition = client de la facture
        # (à activer quand les FK vers CLIENT seront fonctionnelles)
        # if self.numexp.code_client != self.code_facture.code_client:
        #     raise ValidationError(
        #         "L'expédition et la facture doivent appartenir au même client."
        #     )
    
    def save(self, *args, **kwargs):
        """
        Override de save pour recalculer le montant de la facture
        après ajout d'une expédition.
        """
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Recalculer le montant total de la facture
        self.code_facture.calculer_montant_depuis_expeditions()
        self.code_facture.save()
    
    def delete(self, *args, **kwargs):
        """
        Override de delete pour recalculer le montant de la facture
        après retrait d'une expédition.
        """
        facture = self.code_facture
        super().delete(*args, **kwargs)
        
        # Recalculer le montant de la facture
        facture.calculer_montant_depuis_expeditions()
        facture.save()