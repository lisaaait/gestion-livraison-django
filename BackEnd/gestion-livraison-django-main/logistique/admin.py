from django.contrib import admin
from .models import Chauffeur, Vehicule, Tarification, Tournee, Utilisateur

admin.site.register(Utilisateur)
admin.site.register(Chauffeur)
admin.site.register(Vehicule)
admin.site.register(Tarification)
admin.site.register(Tournee)