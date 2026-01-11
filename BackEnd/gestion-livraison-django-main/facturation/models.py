from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal
from expeditions.models import Expedition


class Facture(models.Model):
    """
    Modèle pour gérer les factures clients.
    Calcule automatiquement HT, TVA et TTC.
    """
    
    TAUX_TVA = Decimal('0.19')  # 19%
    
    code_facture = models.CharField(max_length=50, unique=True, blank=True, primary_key=True)
    
    date_f = models.DateField(
        verbose_name="Date de facturation",
        help_text="Date d'émission de la facture"
    )
    
    code_client = models.ForeignKey(
        'clients.Client',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Client",
        related_name='factures',
        help_text="Client à qui appartient la facture"
    )
    
    ht = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Montant HT (DA)",
        help_text="Montant Hors Taxes",
        editable=True,
        default=Decimal('0.00')
    )
    
    tva = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Montant TVA (DA)",
        help_text="TVA 19%",
        editable=True,
        default=Decimal('0.00')
    )
    
    ttc = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Montant TTC (DA)",
        help_text="Montant Total TTC",
        editable=True,
        default=Decimal('0.00')
    )
 
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    
    remarques = models.TextField(
        blank=True,
        null=True,
        verbose_name="Remarques"
    )
    
    est_payee = models.BooleanField(
        default=False,
        verbose_name="Payée intégralement"
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
        Calcule HT, TVA et TTC.
        HT = somme des montants des expéditions
        TVA = HT × 0.19
        TTC = HT + TVA
        """
        expeditions = self.expeditions_facturees.all()
        self.ht = sum(exp.numexp.montant_estime or Decimal('0.00') for exp in expeditions)
        self.tva = self.ht * self.TAUX_TVA
        self.ttc = self.ht + self.tva
    
    def calculer_montant_depuis_expeditions(self):
        """
        Recalcule les montants depuis les expéditions liées.
        """
        self.calculer_montants()
    
    def montant_paye(self):
        """
        Calcule le montant total payé en Decimal.
        """
        total = self.paiements.aggregate(
            total=models.Sum('montant_verse')
        )['total']
        return total or Decimal('0.00')
    
    def reste_a_payer(self):
        """
        Calcule le montant restant à payer en Decimal.
        """
        return self.ttc - self.montant_paye()
    
    def montant_restant(self):
        """
        ✅ CORRIGÉ: Alias pour reste_a_payer() retournant un float (compatibilité frontend)
        """
        return float(self.reste_a_payer())
    
    def verifier_paiement_complet(self):
        """
        Vérifie si la facture est payée intégralement.
        """
        reste = self.reste_a_payer()
        self.est_payee = (reste <= Decimal('0.00'))
        self.save(update_fields=['est_payee'])
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)


class Paiement(models.Model):
    """
    Modèle pour gérer les paiements des factures.
    """
    
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
        verbose_name="Montant versé (DA)"
    )
    
    mode_paiement = models.CharField(
        max_length=20,
        choices=MODE_PAIEMENT_CHOICES,
        default='ESPECES',
        verbose_name="Mode de paiement"
    )
    
    # ✅ FK vers FACTURE
    code_facture = models.ForeignKey(
        Facture,
        on_delete=models.CASCADE,
        verbose_name="Facture",
        related_name='paiements'
    )
    
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'enregistrement"
    )
    
    remarques = models.TextField(
        blank=True,
        null=True,
        verbose_name="Remarques"
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
        Validation : le montant versé ne doit pas dépasser le reste à payer.
        """
        if self.code_facture:
            reste = self.code_facture.reste_a_payer()
            
            if self.pk:
                ancien_paiement = Paiement.objects.get(pk=self.pk)
                if ancien_paiement.code_facture_id == self.code_facture_id:
                    reste += ancien_paiement.montant_verse
            
            if self.montant_verse > reste:
                raise ValidationError(
                    f"Le montant versé ({self.montant_verse} DA) dépasse le reste à payer ({reste} DA)"
                )
    
    def save(self, *args, **kwargs):
        """
        Valide et met à jour le statut de paiement de la facture.
        """
        ancienne_facture = None
        if self.pk:
            ancien_paiement = Paiement.objects.get(pk=self.pk)
            if ancien_paiement.code_facture_id != self.code_facture_id:
                ancienne_facture = ancien_paiement.code_facture
        self.full_clean()
        super().save(*args, **kwargs)
        self.code_facture.verifier_paiement_complet()
        if ancienne_facture:
            ancienne_facture.verifier_paiement_complet()
    
    def delete(self, *args, **kwargs):
        """
        Met à jour le statut de la facture après suppression.
        """
        facture = self.code_facture
        super().delete(*args, **kwargs)
        facture.verifier_paiement_complet()


class EtreFacture(models.Model):
    """
    Table de liaison entre Expédition et Facture.
    """
    
    # ✅ FK vers EXPEDITION
    numexp = models.ForeignKey(
        Expedition,
        on_delete=models.CASCADE,
        verbose_name="Expédition",
        related_name='etre_facture_set'
    )
    
    # ✅ FK vers FACTURE
    code_facture = models.ForeignKey(
        Facture,
        on_delete=models.CASCADE,
        verbose_name="Facture",
        related_name='expeditions_facturees'
    )
    
    date_ajout = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'ajout"
    )
    
    class Meta:
        db_table = 'etre_facture'
        verbose_name = "Expédition facturée"
        verbose_name_plural = "Expéditions facturées"
        unique_together = ['numexp', 'code_facture']
        constraints = [
            models.UniqueConstraint(fields=['numexp'], name='unique_expedition_facturee')
        ]
        indexes = [
            models.Index(fields=['numexp']),
            models.Index(fields=['code_facture']),
        ]
    
    def __str__(self):
        return f"EXP-{self.numexp.numexp} → FACT-{self.code_facture.code_facture}"
    
    def clean(self):
        """
        Validation : vérifier qu'une expédition n'est pas déjà facturée.
        """
        if EtreFacture.objects.filter(numexp=self.numexp).exclude(pk=self.pk).exists():
            if EtreFacture.objects.filter(numexp=self.numexp).exists():
                raise ValidationError(
                    f"L'expédition {self.numexp.numexp} est déjà facturée."
                )
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        self.code_facture.calculer_montant_depuis_expeditions()
        self.code_facture.save(update_fields=['ht', 'tva', 'ttc'])

    def delete(self, *args, **kwargs):
        """
        Recalcule le montant de la facture après retrait d'une expédition.
        """
        facture = self.code_facture
        super().delete(*args, **kwargs)
        facture.calculer_montant_depuis_expeditions()
        facture.save()
