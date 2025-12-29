from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from expeditions.views import ExpeditionViewSet, IncidentViewSet
from facturation.views import FactureViewSet, PaiementViewSet, EtreFactureViewSet

# Création d’un router global
router = DefaultRouter()
# Routes pour l’app Expeditions
router.register('expeditions', ExpeditionViewSet, basename='expedition')
router.register('incidents', IncidentViewSet, basename='incident')

# Routes pour l’app Facturation
router.register('factures', FactureViewSet, basename='facture')
router.register('paiements', PaiementViewSet, basename='paiement')
router.register('expeditions-facturees', EtreFactureViewSet, basename='etre-facture')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('home/', include('dashboard.urls')),
    path('api/', include(router.urls)),  # Toutes les API passent par ce router
]
