from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Client, Historique, Reclamation, Rapport, Contient

admin.site.register(Client)
admin.site.register(Historique)
admin.site.register(Reclamation)
admin.site.register(Rapport)
admin.site.register(Contient)
