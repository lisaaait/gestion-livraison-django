from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from clients.models import Client
from expeditions.models import Expedition
from facturation.models import Facture
from logistique.models import Tournee, Chauffeur, Vehicule, Destination, Tarification

@login_required(login_url='/accounts/login/')
def home(request):
    context = {
        # Partie collègues
        'clients': Client.objects.all(),
        'expeditions': Expedition.objects.all(),
        'invoices': Facture.objects.all(),
        'tours': Tournee.objects.all(),
        
        # AJOUT DE TA PARTIE :
        'chauffeurs': Chauffeur.objects.all(),
        'vehicules': Vehicule.objects.all(),
        'destinations': Destination.objects.all(),
        'tarifications': Tarification.objects.all(),
    }
    return render(request, 'dashboard/home.html', context)