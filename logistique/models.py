from django.db import models
from django.core.validators import MinValueValidator, RegexValidator
from django.core.exceptions import ValidationError
from decimal import Decimal
from django.contrib.auth.models import AbstractUser
from django.db import models

# --- VALIDATEURS ---
valideur_permis = RegexValidator(regex=r'^[0-9]{10}$', message="Le permis doit contenir exactement 10 chiffres.")
valideur_matricule = RegexValidator(regex=r'^[0-9]{6}$', message="Le matricule doit contenir exactement 6 chiffres.")

class Destination(models.Model):
    ZONE_CHOICES = [('NORD', 'Nord'), ('SUD', 'Sud'), ('EST', 'Est'), ('OUEST', 'Ouest'), ('CENTRE', 'Centre')]
    code_d = models.CharField(max_length=10, primary_key=True)
    ville = models.CharField(max_length=100)
    pays = models.CharField(max_length=100, default="Algérie")
    zone_geo = models.CharField("Zone Géographique", max_length=10, choices=ZONE_CHOICES)
    def __str__(self): return f"{self.ville} ({self.get_zone_geo_display()})"

class Tarification(models.Model):
    SERVICE_CHOICES = [('STANDARD', 'Standard'), ('EXPRESS', 'Express'), ('INTERNATIONAL', 'International')]
    code_tarif = models.CharField(max_length=10, primary_key=True)
    type_service = models.CharField(max_length=20, choices=SERVICE_CHOICES)
    tarif_base_destination = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tarif_poids = models.DecimalField(max_digits=10, decimal_places=2)
    tarif_volume = models.DecimalField(max_digits=10, decimal_places=2)
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE)
    def __str__(self): return f"{self.get_type_service_display()} - {self.destination.ville}"

class Expedition(models.Model):
    numexp = models.AutoField(primary_key=True)
    poids = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    volume = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    tarification = models.ForeignKey(Tarification, on_delete=models.SET_NULL, null=True)
    montant_estime = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        p_dec = Decimal(str(self.poids))
        v_dec = Decimal(str(self.volume))
        if self.tarification:
            # Correction : Utilisation du nom de champ correct 'montant_estime'
            self.montant_estime = (self.tarification.tarif_base_destination + 
                               (p_dec * self.tarification.tarif_poids) + 
                                  (v_dec * self.tarification.tarif_volume))
        super().save(*args, **kwargs)

class Chauffeur(models.Model):
    CATEGORIE_PERMIS = [('A', 'Moto (A)'), ('B', 'Voiture (B)'), ('C', 'Camion (C)')]
    code_chauffeur = models.CharField(max_length=10, primary_key=True)
    nom = models.CharField(max_length=100)
    num_permis = models.CharField(max_length=10, unique=True, validators=[valideur_permis])
    categorie_permis = models.CharField(max_length=1, choices=CATEGORIE_PERMIS)
    statut_dispo = models.BooleanField(default=True, verbose_name="Disponible")
    def __str__(self): return f"{self.nom} (Permis {self.categorie_permis})"

class Vehicule(models.Model):
    TYPE_VEHICULE = [('MOTO', 'Moto'), ('VOITURE', 'Voiture'), ('CAMION', 'Camion')]
    matricule = models.CharField(max_length=6, primary_key=True, validators=[valideur_matricule])
    type_vehicule = models.CharField(max_length=10, choices=TYPE_VEHICULE)
    capacite_poids = models.FloatField("Capacité Max Poids (kg)")
    capacite_volume = models.FloatField("Capacité Max Volume (m3)")
    etat = models.CharField(max_length=50, default="Opérationnel")

    def clean(self):
        if self.type_vehicule == 'MOTO' and self.capacite_poids > 100:
            raise ValidationError("Une moto ne peut pas supporter plus de 100 kg.")
        if self.type_vehicule == 'VOITURE' and self.capacite_poids > 500:
            raise ValidationError("Une voiture ne peut pas dépasser 500 kg.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    def __str__(self): return f"{self.get_type_vehicule_display()} - {self.matricule}"

class Tournee(models.Model):
    code_t = models.CharField(max_length=10, primary_key=True)
    date_tournee = models.DateField()
    vehicule = models.ForeignKey(Vehicule, on_delete=models.CASCADE)
    chauffeur = models.ForeignKey(Chauffeur, on_delete=models.CASCADE)
    expeditions = models.ManyToManyField(Expedition, related_name='tournees', blank=True)

    def clean(self):
        permis = self.chauffeur.categorie_permis
        v_type = self.vehicule.type_vehicule
        if v_type == 'CAMION' and permis != 'C':
            raise ValidationError("Le chauffeur n'a pas le permis Camion (C).")
        if v_type == 'VOITURE' and permis not in ['B', 'C']:
            raise ValidationError("Le chauffeur n'a pas le permis requis pour une voiture.")
        if v_type == 'MOTO' and permis != 'A':
            raise ValidationError("Incohérence : Une moto nécessite un permis A spécifique.")
        if not self.pk and not self.chauffeur.statut_dispo:
            raise ValidationError(f"Le chauffeur {self.chauffeur.nom} est déjà en mission.")
        if self.pk: 
          expeditions = self.expeditions.all()
          if expeditions.exists():
            zones = set(e.tarification.destination.zone_geo for e in expeditions if e.tarification)
            if len(zones) > 1:
                raise ValidationError(
                    f"ERREUR LOGISTIQUE : Une tournée ne peut pas couvrir plusieurs zones. "
                    f"Zones détectées dans ce chargement : {zones}"
                )
    def verifier_capacite(self):
        """Vérification manuelle pour les tests de surcharge"""
        total_poids = sum(e.poids for e in self.expeditions.all())
        total_vol = sum(e.volume for e in self.expeditions.all())
        if total_poids > Decimal(str(self.vehicule.capacite_poids)):
            raise ValidationError(f"SURCHARGE POIDS : {total_poids}kg / {self.vehicule.capacite_poids}kg")
        if total_vol > Decimal(str(self.vehicule.capacite_volume)):
            raise ValidationError(f"SURCHARGE VOLUME : {total_vol}m3 / {self.vehicule.capacite_volume}m3")

    def save(self, *args, **kwargs):
        self.full_clean()
        if not self.pk:
            self.chauffeur.statut_dispo = False
            self.chauffeur.save()
        super().save(*args, **kwargs)

class Utilisateur(AbstractUser):
    # L'e-mail est obligatoire et unique pour la connexion 
    email = models.EmailField(unique=True)
    
    # Définition des rôles pour l'autorisation par rôle 
    ROLES = (
        ('AGENT_LOGISTIQUE', 'Agent de Transport / Logistique'),
        ('ADMIN', 'Administrateur'),
    )
    role = models.CharField(max_length=20, choices=ROLES, default='AGENT_LOGISTIQUE')

    # Configuration pour utiliser l'email à la place du username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username'] 

    def __str__(self):
        return self.email