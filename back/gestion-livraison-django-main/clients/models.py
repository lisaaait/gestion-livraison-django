from django.db import models

# CLIENT table
class Client(models.Model):
    CodeClient = models.AutoField(primary_key=True)  # PK, auto-increment
    Nom = models.CharField(max_length=100)
    Prenom = models.CharField(max_length=100)
    Adresse = models.TextField()
    Tel = models.CharField(max_length=20)
    Email = models.EmailField(unique=True)  # ensure unique emails
    Solde = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)

    def __str__(self):
        return f"{self.Nom} {self.Prenom}"


# HISTORIQUE table
class Historique(models.Model):
    CodeHist = models.AutoField(primary_key=True)
    DateAction = models.DateTimeField(auto_now_add=True)  # automatically set the current datetime
    TypeAction = models.CharField(max_length=50)
    Description = models.TextField()
    CodeClient = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,  # if client deleted, delete historique
        related_name='historiques'
    )

    def __str__(self):
        return f"{self.TypeAction} - {self.DateAction}"


# RECLAMATION table
class Reclamation(models.Model):
    CodeREC = models.AutoField(primary_key=True)
    Nature = models.CharField(max_length=100)
    Date = models.DateField(auto_now_add=True)
    Etat = models.CharField(
        max_length=50,
        choices=[('Nouvelle', 'Nouvelle'),('En cours', 'En cours'), ('Résolue', 'Résolue'), ('Annulée', 'Annulée')],
        default='Nouvelle'
    )
    CodeClient = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='reclamations'
    )

    def __str__(self):
        return f"{self.Nature} - {self.Etat}"


# RAPPORT table
class Rapport(models.Model):
    CodeRapport = models.AutoField(primary_key=True)
    MotifR = models.TextField()
    Delais = models.IntegerField(help_text="Délai en jours")
    NbrREC = models.IntegerField(default=0)

    def __str__(self):
        return f"Rapport {self.CodeRapport} - {self.MotifR}"


# CONTIENT table: many-to-many relation between Reclamation and Rapport
class Contient(models.Model):
    CodeREC = models.ForeignKey(Reclamation, on_delete=models.CASCADE, related_name='rapports')
    CodeRapport = models.ForeignKey(Rapport, on_delete=models.CASCADE, related_name='reclamations')

    class Meta:
        unique_together = ('CodeREC', 'CodeRapport')  # prevent duplicate associations

    def __str__(self):
        return f"Reclamation {self.CodeREC.CodeREC} -> Rapport {self.CodeRapport.CodeRapport}"