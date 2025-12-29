from django.shortcuts import render, redirect , get_object_or_404
from .models import Vehicule , Chauffeur , Destination , Tarification , Expedition , Tournee
from .forms import VehiculeForm , ChauffeurForm , DestinationForm , TarificationForm , ExpeditionForm , TourneeForm ,  ConnexionForm
from django.contrib.auth.decorators import login_required
from .decorators import agent_logistique_required
from django.contrib.auth.views import LoginView, LogoutView
# 1. READ : Voir tous les véhicules
def liste_vehicules(request):
    vehicules = Vehicule.objects.all()
    return render(request, 'logistique/liste_vehicules.html', {'vehicules': vehicules})

# 2. CREATE : Ajouter un véhicule
def ajouter_vehicule(request):
    if request.method == 'POST':
        form = VehiculeForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('liste_vehicules')
    else:
        form = VehiculeForm()
    return render(request, 'logistique/form_vehicule.html', {'form': form})
# 3. UPDATE : Modifier un véhicule
def modifier_vehicule(request, pk):
    vehicule = get_object_or_404(Vehicule, pk=pk)
    if request.method == 'POST':
        form = VehiculeForm(request.POST, instance=vehicule)
        if form.is_valid():
            form.save()
            return redirect('liste_vehicules')
    else:
        form = VehiculeForm(instance=vehicule)
    return render(request, 'logistique/form_vehicule.html', {'form': form})

def supprimer_vehicule(request, pk):
    vehicule = get_object_or_404(Vehicule, pk=pk)
    if request.method == 'POST':
        vehicule.delete()
        return redirect('liste_vehicules')
    return render(request, 'logistique/confirmer_suppression.html', {'vehicule': vehicule})

# LISTE
def liste_chauffeurs(request):
    chauffeurs = Chauffeur.objects.all()
    return render(request, 'logistique/liste_chauffeurs.html', {'chauffeurs': chauffeurs})

# AJOUTER
def ajouter_chauffeur(request):
    if request.method == 'POST':
        form = ChauffeurForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('liste_chauffeurs')
    else:
        form = ChauffeurForm()
    return render(request, 'logistique/form_chauffeur.html', {'form': form, 'titre': "Ajouter un Chauffeur"})

# MODIFIER
def modifier_chauffeur(request, pk):
    chauffeur = get_object_or_404(Chauffeur, pk=pk)
    if request.method == 'POST':
        form = ChauffeurForm(request.POST, instance=chauffeur)
        if form.is_valid():
            form.save()
            return redirect('liste_chauffeurs')
    else:
        form = ChauffeurForm(instance=chauffeur)
    return render(request, 'logistique/form_chauffeur.html', {'form': form, 'titre': "Modifier le Chauffeur"})

# SUPPRIMER
def supprimer_chauffeur(request, pk):
    chauffeur = get_object_or_404(Chauffeur, pk=pk)
    if request.method == 'POST':
        chauffeur.delete()
        return redirect('liste_chauffeurs')
    return render(request, 'logistique/confirmer_suppression.html', {'item': chauffeur, 'type': "le chauffeur"})

# LISTE
def liste_destinations(request):
    destinations = Destination.objects.all()
    return render(request, 'logistique/liste_destinations.html', {'destinations': destinations})

# AJOUTER
def ajouter_destination(request):
    if request.method == 'POST':
        form = DestinationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('liste_destinations')
    else:
        form = DestinationForm()
    return render(request, 'logistique/form_destination.html', {'form': form, 'titre': "Ajouter une Destination"})

# MODIFIER
def modifier_destination(request, pk):
    dest = get_object_or_404(Destination, pk=pk)
    if request.method == 'POST':
        form = DestinationForm(request.POST, instance=dest)
        if form.is_valid():
            form.save()
            return redirect('liste_destinations')
    else:
        form = DestinationForm(instance=dest)
    return render(request, 'logistique/form_destination.html', {'form': form, 'titre': "Modifier la Destination"})

# SUPPRIMER
def supprimer_destination(request, pk):
    dest = get_object_or_404(Destination, pk=pk)
    if request.method == 'POST':
        dest.delete()
        return redirect('liste_destinations')
    return render(request, 'logistique/confirmer_suppression.html', {'item': dest, 'type': "la destination"})

# LISTE
def liste_tarifs(request):
    tarifs = Tarification.objects.all().select_related('destination')
    return render(request, 'logistique/liste_tarifs.html', {'tarifs': tarifs})

# AJOUTER
def ajouter_tarif(request):
    if request.method == 'POST':
        form = TarificationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('liste_tarifs')
    else:
        form = TarificationForm()
    return render(request, 'logistique/form_tarif.html', {'form': form, 'titre': "Créer un nouveau Tarif"})

# MODIFIER
def modifier_tarif(request, pk):
    tarif = get_object_or_404(Tarification, pk=pk)
    if request.method == 'POST':
        form = TarificationForm(request.POST, instance=tarif)
        if form.is_valid():
            form.save()
            return redirect('liste_tarifs')
    else:
        form = TarificationForm(instance=tarif)
    return render(request, 'logistique/form_tarif.html', {'form': form, 'titre': "Modifier le Tarif"})

# SUPPRIMER
def supprimer_tarif(request, pk):
    tarif = get_object_or_404(Tarification, pk=pk)
    if request.method == 'POST':
        tarif.delete()
        return redirect('liste_tarifs')
    return render(request, 'logistique/confirmer_suppression.html', {'item': tarif, 'type': "le tarif"})

def liste_expeditions(request):
    expeditions = Expedition.objects.all().select_related('tarification__destination')
    return render(request, 'logistique/liste_expeditions.html', {'expeditions': expeditions})

def ajouter_expedition(request):
    if request.method == 'POST':
        form = ExpeditionForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('liste_expeditions')
    else:
        form = ExpeditionForm()
    return render(request, 'logistique/form_expedition.html', {'form': form, 'titre': "Nouvelle Expédition"})

def modifier_expedition(request, pk):
    exp = get_object_or_404(Expedition, pk=pk)
    if request.method == 'POST':
        form = ExpeditionForm(request.POST, instance=exp)
        if form.is_valid():
            form.save()
            return redirect('liste_expeditions')
    else:
        form = ExpeditionForm(instance=exp)
    return render(request, 'logistique/form_expedition.html', {'form': form, 'titre': "Modifier l'expédition"})

def supprimer_expedition(request, pk):
    exp = get_object_or_404(Expedition, pk=pk)
    if request.method == 'POST':
        exp.delete()
        return redirect('liste_expeditions')
    return render(request, 'logistique/confirmer_suppression.html', {'item': exp, 'type': "l'expédition"})

# LISTE
def liste_tournees(request):
    # On récupère tout d'un coup pour que ce soit rapide
    tournees = Tournee.objects.all().select_related('vehicule', 'chauffeur').prefetch_related('expeditions')
    return render(request, 'logistique/liste_tournees.html', {'tournees': tournees})

# AJOUTER
def ajouter_tournee(request):
    if request.method == 'POST':
        form = TourneeForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('liste_tournees')
    else:
        form = TourneeForm()
    return render(request, 'logistique/form_tournee.html', {'form': form, 'titre': "Planifier une Tournée"})

# MODIFIER
def modifier_tournee(request, pk):
    tournee = get_object_or_404(Tournee, pk=pk)
    if request.method == 'POST':
        form = TourneeForm(request.POST, instance=tournee)
        if form.is_valid():
            form.save()
            return redirect('liste_tournees')
    else:
        form = TourneeForm(instance=tournee)
    return render(request, 'logistique/form_tournee.html', {'form': form, 'titre': "Modifier la Tournée"})

# SUPPRIMER
def supprimer_tournee(request, pk):
    tournee = get_object_or_404(Tournee, pk=pk)
    if request.method == 'POST':
        tournee.delete()
        return redirect('liste_tournees')
    return render(request, 'logistique/confirmer_suppression.html', {'item': tournee, 'type': "la tournée"})

# --- SECTION 1 : TABLES (ACCÈS COMPLET REQUIS)  ---

# GESTION DES CHAUFFEURS
@login_required
@agent_logistique_required
def liste_chauffeurs(request):
    chauffeurs = Chauffeur.objects.all()
    return render(request, 'logistique/liste_chauffeurs.html', {'chauffeurs': chauffeurs})

@login_required
@agent_logistique_required
def ajouter_chauffeur(request):
    if request.method == 'POST':
        form = ChauffeurForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('liste_chauffeurs')
    else:
        form = ChauffeurForm()
    return render(request, 'logistique/form_chauffeur.html', {'form': form})
@login_required
@agent_logistique_required
def modifier_chauffeur(request, pk):
    chauffeur = get_object_or_404(Chauffeur, pk=pk)
    if request.method == 'POST':
        form = ChauffeurForm(request.POST, instance=chauffeur)
        if form.is_valid():
            form.save()
            return redirect('liste_chauffeurs')
    else:
        form = ChauffeurForm(instance=chauffeur)
    return render(request, 'logistique/form_chauffeur.html', {'form': form, 'edit_mode': True})

@login_required
@agent_logistique_required
def supprimer_chauffeur(request, pk):
    chauffeur = get_object_or_404(Chauffeur, pk=pk)
    if request.method == 'POST':
        chauffeur.delete()
        return redirect('liste_chauffeurs')
    return render(request, 'logistique/confirmer_suppression.html', {'objet': chauffeur, 'retour': 'liste_chauffeurs'})
# GESTION DES VÉHICULES
@login_required
@agent_logistique_required
def liste_vehicules(request):
    vehicules = Vehicule.objects.all()
    return render(request, 'logistique/liste_vehicules.html', {'vehicules': vehicules})

@login_required
@agent_logistique_required
def ajouter_vehicule(request):
    if request.method == 'POST':
        form = VehiculeForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('liste_vehicules')
    else:
        form = VehiculeForm()
    return render(request, 'logistique/form_vehicule.html', {'form': form})

@login_required
@agent_logistique_required
def modifier_vehicule(request, pk):
    vehicule = get_object_or_404(Vehicule, pk=pk)
    if request.method == 'POST':
        form = VehiculeForm(request.POST, instance=vehicule)
        if form.is_valid():
            form.save()
            return redirect('liste_vehicules')
    else:
        form = VehiculeForm(instance=vehicule)
    return render(request, 'logistique/form_vehicule.html', {'form': form, 'edit_mode': True})

@login_required
@agent_logistique_required
def supprimer_vehicule(request, pk):
    vehicule = get_object_or_404(Vehicule, pk=pk)
    if request.method == 'POST':
        vehicule.delete()
        return redirect('liste_vehicules')
    return render(request, 'logistique/confirmer_suppression.html', {'objet': vehicule, 'retour': 'liste_vehicules'})
# GESTION DES DESTINATIONS ET TARIFICATIONS [cite: 41, 43]
@login_required
@agent_logistique_required
def liste_tarifs(request):
    tarifs = Tarification.objects.all().select_related('destination')
    return render(request, 'logistique/liste_tarifs.html', {'tarifs': tarifs})

@login_required
@agent_logistique_required
def ajouter_tarif(request):
    if request.method == 'POST':
        form = TarificationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('liste_tarifs')
    else:
        form = TarificationForm()
    return render(request, 'logistique/form_tarif.html', {'form': form})
@login_required
@agent_logistique_required
def modifier_destination(request, pk):
    destination = get_object_or_404(Destination, pk=pk)
    if request.method == 'POST':
        form = DestinationForm(request.POST, instance=destination)
        if form.is_valid():
            form.save()
            return redirect('liste_destinations')
    else:
        form = DestinationForm(instance=destination)
    return render(request, 'logistique/form_destination.html', {'form': form, 'edit_mode': True})

@login_required
@agent_logistique_required
def supprimer_destination(request, pk):
    destination = get_object_or_404(Destination, pk=pk)
    if request.method == 'POST':
        destination.delete()
        return redirect('liste_destinations')
    return render(request, 'logistique/confirmer_suppression.html', {'objet': destination, 'retour': 'liste_destinations'})

@login_required
@agent_logistique_required
def modifier_tarif(request, pk):
    tarif = get_object_or_404(Tarification, pk=pk)
    if request.method == 'POST':
        form = TarificationForm(request.POST, instance=tarif)
        if form.is_valid():
            form.save()
            return redirect('liste_tarifs')
    else:
        form = TarificationForm(instance=tarif)
    return render(request, 'logistique/form_tarif.html', {'form': form, 'edit_mode': True})

@login_required
@agent_logistique_required
def supprimer_tarif(request, pk):
    tarif = get_object_or_404(Tarification, pk=pk)
    if request.method == 'POST':
        tarif.delete()
        return redirect('liste_tarifs')
    return render(request, 'logistique/confirmer_suppression.html', {'objet': tarif, 'retour': 'liste_tarifs'})
# --- SECTION 2 : EXPÉDITIONS ET TOURNÉES [cite: 46, 60] ---

@login_required
@agent_logistique_required
def liste_expeditions(request):
    # L'agent peut consulter et suivre les expéditions [cite: 47]
    expeditions = Expedition.objects.all().select_related('tarification__destination')
    return render(request, 'logistique/liste_expeditions.html', {'expeditions': expeditions})

@login_required
@agent_logistique_required
def ajouter_expedition(request):
    # Création avec calcul automatique du montant (fait dans le modèle) [cite: 49, 50]
    if request.method == 'POST':
        form = ExpeditionForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('liste_expeditions')
    else:
        form = ExpeditionForm()
    return render(request, 'logistique/form_expedition.html', {'form': form})

@login_required
@agent_logistique_required
def liste_tournees(request):
    # Gestion des tournées affectées à un chauffeur et un véhicule [cite: 61, 62]
    tournees = Tournee.objects.all().select_related('vehicule', 'chauffeur').prefetch_related('expeditions')
    return render(request, 'logistique/liste_tournees.html', {'tournees': tournees})

@login_required
@agent_logistique_required
def modifier_expedition(request, pk):
    expedition = get_object_or_404(Expedition, pk=pk)
    if request.method == 'POST':
        form = ExpeditionForm(request.POST, instance=expedition)
        if form.is_valid():
            form.save() # Le calcul automatique se déclenchera à nouveau si défini dans le modèle
            return redirect('liste_expeditions')
    else:
        form = ExpeditionForm(instance=expedition)
    return render(request, 'logistique/form_expedition.html', {'form': form, 'edit_mode': True})

@login_required
@agent_logistique_required
def supprimer_expedition(request, pk):
    expedition = get_object_or_404(Expedition, pk=pk)
    if request.method == 'POST':
        expedition.delete()
        return redirect('liste_expeditions')
    return render(request, 'logistique/confirmer_suppression.html', {'objet': expedition, 'retour': 'liste_expeditions'})

@login_required
@agent_logistique_required
def ajouter_tournee(request):
    if request.method == 'POST':
        form = TourneeForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('liste_tournees')
    else:
        form = TourneeForm()
    return render(request, 'logistique/form_tournee.html', {'form': form})

@login_required
@agent_logistique_required
def modifier_tournee(request, pk):
    tournee = get_object_or_404(Tournee, pk=pk)
    if request.method == 'POST':
        form = TourneeForm(request.POST, instance=tournee)
        if form.is_valid():
            form.save()
            return redirect('liste_tournees')
    else:
        form = TourneeForm(instance=tournee)
    return render(request, 'logistique/form_tournee.html', {'form': form, 'edit_mode': True})

@login_required
@agent_logistique_required
def supprimer_tournee(request, pk):
    tournee = get_object_or_404(Tournee, pk=pk)
    if request.method == 'POST':
        tournee.delete()
        return redirect('liste_tournees')
    return render(request, 'logistique/confirmer_suppression.html', {'objet': tournee, 'retour': 'liste_tournees'})
    
class ConnexionUtilisateur(LoginView):
    template_name = 'logistique/login.html'
    authentication_form = ConnexionForm