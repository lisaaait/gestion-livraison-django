from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Imports des vues de tes collègues
from expeditions.views import ExpeditionViewSet, IncidentViewSet
from facturation.views import FactureViewSet, PaiementViewSet, EtreFactureViewSet

# Imports de TES vues (Logistique)
from logistique.api_views import (
    ChauffeurViewSet, VehiculeViewSet, DestinationViewSet, 
    TarificationViewSet, TourneeViewSet , StatistiquesLogistiqueView
)

# Création du router global unique
from clients.views import ClientViewSet,HistoriqueViewSet,ReclamationViewSet,RapportViewSet, ContientViewSet





# Création d’un router global
router = DefaultRouter()

# 1. Routes de l'app Logistique (Ton travail)
router.register('chauffeurs', ChauffeurViewSet, basename='chauffeur')
router.register('vehicules', VehiculeViewSet, basename='vehicule')
router.register('destinations', DestinationViewSet, basename='destination')
router.register('tarifs', TarificationViewSet, basename='tarif')
router.register('tournees', TourneeViewSet, basename='tournee')

# 2. Routes de l'app Expeditions (Travail collègue)
router.register('expeditions', ExpeditionViewSet, basename='expedition')
router.register('incidents', IncidentViewSet, basename='incident')

# 3. Routes de l'app Facturation (Travail collègue)
router.register('factures', FactureViewSet, basename='facture')
router.register('paiements', PaiementViewSet, basename='paiement')
router.register('expeditions-facturees', EtreFactureViewSet, basename='etre-facture')

#routes pour lapp clients 

router.register('clients', ClientViewSet, basename='client')
router.register('historiques', HistoriqueViewSet, basename='historique')
router.register('reclamations', ReclamationViewSet, basename='reclamation')
router.register('rapports', RapportViewSet, basename='rapport')
router.register('contient', ContientViewSet, basename='contient')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('home/', include('dashboard.urls')),
    path('api/stats/logistique/', StatistiquesLogistiqueView.as_view(), name='api-stats-logistique'),
    path('api/', include(router.urls)), 
]