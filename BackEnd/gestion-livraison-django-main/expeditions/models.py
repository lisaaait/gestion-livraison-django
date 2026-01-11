from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Expedition(models.Model):
    """
    Modèle pour gérer les expéditions de colis.
    Calcule automatiquement le montant total basé sur poids, volume et tarification.
    """
    
    # Choix pour le statut de l'expédition
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('EN_PREPARATION', 'En préparation'),
        ('EN_TRANSIT', 'En transit'),
        ('EN_CENTRE_TRI', 'En centre de tri'),
        ('EN_COURS_LIVRAISON', 'En cours de livraison'),
        ('LIVRE', 'Livré'),
        ('ECHEC_LIVRAISON', 'Échec de livraison'),
        ('RETOUR', 'Retourné à l\'expéditeur'),
    ]
    
    numexp = models.AutoField(
        primary_key=True,
        verbose_name="Numéro d'expédition"
    )
    
    poids = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Poids (kg)",
        help_text="Poids du colis en kilogrammes"
    )
    
    volume = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Volume (m³)",
        help_text="Volume du colis en mètres cubes"
    )
    
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='EN_ATTENTE',
        verbose_name="Statut"
    )
    
    # ✅ ForeignKey vers Client
    code_client = models.ForeignKey(
        'clients.Client',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Client",
        related_name='expeditions',
        help_text="Client qui envoie le colis"
    )
    
    # ✅ ForeignKey vers Tarification
    tarification = models.ForeignKey(
        'logistique.Tarification',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Tarification",
        related_name='expeditions',
        help_text="Tarif appliqué pour cette expédition"
    )
    
    # Informations complémentaires
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name="Dernière modification"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Description du colis",
        help_text="Description détaillée du contenu"
    )
    
    # Montant calculé automatiquement
    montant_estime = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Montant estimé (DA)",
        help_text="Montant calculé automatiquement"
    )
    
    class Meta:
        db_table = 'expedition'
        verbose_name = "Expédition"
        verbose_name_plural = "Expéditions"
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['statut']),
            models.Index(fields=['code_client']),
            models.Index(fields=['date_creation']),
        ]
    
    def __str__(self):
        return f"EXP-{self.numexp} - {self.get_statut_display()}"
    
    def save(self, *args, **kwargs):
        """
        Calcul automatique du montant estimé
        Formule : Montant = Tarif base + (Poids × Tarif poids) + (Volume × Tarif volume)
        """
        if self.tarification:
            p_dec = Decimal(str(self.poids))
            v_dec = Decimal(str(self.volume))
            self.montant_estime = (
                self.tarification.tarif_base_destination + 
                (p_dec * self.tarification.tarif_poids) + 
                (v_dec * self.tarification.tarif_volume)
            )
        else:
            self.montant_estime = None
        super().save(*args, **kwargs)
    
    def peut_etre_modifie(self):
        """
        Vérifie si l'expédition peut encore être modifiée.
        """
        return self.statut in ['EN_ATTENTE', 'EN_TRANSIT','LIVRE']
    
    def peut_etre_supprime(self):
        """
        Vérifie si l'expédition peut être supprimée.
        """
        return not self.etre_facture_set.exists()


class Incident(models.Model):
    """
    Modèle pour gérer les incidents liés aux expéditions.
    """
    
    TYPE_CHOICES = [
        ('RETARD', 'Retard de livraison'),
        ('PERTE', 'Colis perdu'),
        ('ENDOMMAGEMENT', 'Colis endommagé'),
        ('PROBLEME_TECHNIQUE', 'Problème technique'),
        ('ADRESSE_INCORRECTE', 'Adresse incorrecte'),
        ('DESTINATAIRE_ABSENT', 'Destinataire absent'),
        ('REFUS_RECEPTION', 'Refus de réception'),
        ('ACCIDENT', 'Accident'),
        ('AUTRE', 'Autre'),
    ]
    
    ETAT_CHOICES = [
        ('OUVERT', 'Ouvert'),
        ('EN_COURS', 'En cours de traitement'),
        ('RESOLU', 'Résolu'),
        ('FERME', 'Fermé'),
        ('ANNULE', 'Annulé'),
    ]
    
    code_inc = models.AutoField(
        primary_key=True,
        verbose_name="Code incident"
    )
    
    type = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES,
        verbose_name="Type d'incident"
    )
    
    commentaire = models.TextField(
        verbose_name="Commentaire",
        help_text="Description détaillée de l'incident"
    )
    
    piece_jointe = models.FileField(
        upload_to='incidents/%Y/%m/%d/',
        null=True,
        blank=True,
        verbose_name="Pièce jointe",
        help_text="Photo ou document justificatif"
    )
    
    etat = models.CharField(
        max_length=20,
        choices=ETAT_CHOICES,
        default='OUVERT',
        verbose_name="État"
    )
    
    resolution = models.TextField(
        blank=True,
        null=True,
        verbose_name="Résolution",
        help_text="Description de la solution apportée"
    )
    wilaya = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Wilaya",
        help_text="Wilaya où l'incident a eu lieu"
    )
    commune = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Commune",
        help_text="Commune oÇù l'incident a eu lieu"
    )
    # FK vers EXPEDITION
    numexp = models.ForeignKey(
        Expedition,
        on_delete=models.CASCADE,
        verbose_name="Expédition concernée",
        related_name='incidents'
    )
    
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de signalement"
    )
    
    date_resolution = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de résolution"
    )
    
    class Meta:
        db_table = 'incident'
        verbose_name = "Incident"
        verbose_name_plural = "Incidents"
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['type']),
            models.Index(fields=['etat']),
            models.Index(fields=['numexp']),
        ]
    
    def __str__(self):
        return f"INC-{self.code_inc} - {self.get_type_display()} ({self.get_etat_display()})"
    
    def save(self, *args, **kwargs):
        """
        Met à jour le statut de l'expédition en cas d'incident grave.
        """
        if self.type in ['PERTE', 'ENDOMMAGEMENT'] and self.etat == 'RESOLU':
            self.numexp.statut = 'ECHEC_LIVRAISON'
            self.numexp.save()
        
        if self.etat in ['RESOLU', 'FERME'] and not self.date_resolution:
            from django.utils import timezone
            self.date_resolution = timezone.now()
        
        super().save(*args, **kwargs)
