from django.db import models
from django.core.validators import MinValueValidator, RegexValidator
from django.core.exceptions import ValidationError
from decimal import Decimal
from django.contrib.auth.models import AbstractUser
from django.db.models import Sum
from django.db.models.signals import post_save
from django.dispatch import receiver

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
    # Champ statut ajouté pour correspondre à la logique de tournée
    statut = models.CharField(max_length=20, default='EN_ATTENTE') 

    def save(self, *args, **kwargs):
        if self.tarification:
            p_dec = Decimal(str(self.poids))
            v_dec = Decimal(str(self.volume))
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
    expeditions = models.ManyToManyField(Expedition, related_name='tournees', verbose_name="Colis")
    statut = models.CharField(
        max_length=20,
        choices=[('EN_COURS', 'En cours'), ('TERMINEE', 'Terminée'), ('INCIDENT', 'Incident')],
        default='EN_COURS'
    )

    def clean(self):
        # Vérification des permis
        permis = self.chauffeur.categorie_permis
        v_type = self.vehicule.type_vehicule
        if v_type == 'CAMION' and permis != 'C':
            raise ValidationError("Le chauffeur n'a pas le permis Camion (C).")
        if v_type == 'VOITURE' and permis not in ['B', 'C']:
            raise ValidationError("Le chauffeur n'a pas le permis requis pour une voiture.")
        if v_type == 'MOTO' and permis != 'A':
            raise ValidationError("Incohérence : Une moto nécessite un permis A spécifique.")
        
        # Vérification disponibilité chauffeur
        if not self.pk and not self.chauffeur.statut_dispo:
            raise ValidationError(f"Le chauffeur {self.chauffeur.nom} est déjà en mission.")
        # 3. LOGIQUE DE PROXIMITÉ (Par Zone Géo)
        if self.pk: 
            expeditions = self.expeditions.all()
            if expeditions.exists():
                # On récupère les ZONES GÉOGRAPHIQUES des destinations
                # (ex: {'CENTRE', 'OUEST'})
                zones = set(e.tarification.destination.zone_geo for e in expeditions if e.tarification)
                
                if len(zones) > 1:
                    # Si on a plus d'une zone, c'est que c'est trop loin
                    raise ValidationError(
                        f"ERREUR GÉOGRAPHIQUE : Impossible de mélanger des villes de zones différentes. "
                        f"Zones détectées : {list(zones)}. Une tournée doit rester dans la même zone (ex: CENTRE uniquement)."
                    )

    def verifier_capacite(self):
        stats = self.expeditions.aggregate(total_poids=Sum('poids'), total_vol=Sum('volume'))
        poids_actuel = stats['total_poids'] or 0
        vol_actuel = stats['total_vol'] or 0
        if poids_actuel > Decimal(str(self.vehicule.capacite_poids)):
            raise ValidationError(f"SURCHARGE POIDS : {poids_actuel}kg / {self.vehicule.capacite_poids}kg")
        if vol_actuel > Decimal(str(self.vehicule.capacite_volume)):
            raise ValidationError(f"SURCHARGE VOLUME : {vol_actuel}m3 / {self.vehicule.capacite_volume}m3")

    def save(self, *args, **kwargs):
        self.full_clean()
        
        # 1. Bloquer le chauffeur à la création
        if not self.pk:
            self.chauffeur.statut_dispo = False
            self.chauffeur.save()

        # 2. Vérifier capacité si déjà existant
        if self.pk:
            self.verifier_capacite()
            
            # 3. Vérifier si tout est livré (Fermeture auto)
            exps = self.expeditions.all()
            if exps.exists() and not exps.exclude(statut='LIVREE').exists():
                self.statut = 'TERMINEE'

        # 4. Libérer le chauffeur si terminée
        if self.statut == 'TERMINEE':
            self.chauffeur.statut_dispo = True
            self.chauffeur.save()

        super().save(*args, **kwargs)

class Utilisateur(AbstractUser):
    email = models.EmailField(unique=True)
    ROLES = (('AGENT_LOGISTIQUE', 'Agent'), ('ADMIN', 'Admin'))
    role = models.CharField(max_length=20, choices=ROLES, default='AGENT_LOGISTIQUE')
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username'] 

@receiver(post_save, sender=Expedition)
def maj_statut_tournee_automatique(sender, instance, **kwargs):
    # On cherche la tournée via le lien ManyToMany
    tournees = instance.tournees.filter(statut='EN_COURS')
    for tournee in tournees:
        # Si tout est livré dans cette tournée, on la déclenche
        if not tournee.expeditions.exclude(statut='LIVREE').exists():
            tournee.save() # Le save() de Tournee s'occupe de la clôture et du chauffeur