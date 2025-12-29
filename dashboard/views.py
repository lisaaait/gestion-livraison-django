from django.shortcuts import render
from django.contrib.auth.decorators import login_required

# Create your views here.
from django.shortcuts import render
from clients.models import Client
from expeditions.models import Expedition
from facturation.models import Facture
from logistique.models import Tournee
@login_required(login_url='/accounts/login/')

def home(request):
    context = {
        'clients': Client.objects.all(),
        'expeditions': Expedition.objects.all(),
        'invoices': Facture.objects.all(),
        'tours': Tournee.objects.all(),
    }
    return render(request, 'dashboard/home.html', context)
