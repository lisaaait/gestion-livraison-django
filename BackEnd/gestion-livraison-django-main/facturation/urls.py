from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FactureViewSet, PaiementViewSet, EtreFactureViewSet

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'factures', FactureViewSet, basename='facture')
router.register(r'paiements', PaiementViewSet, basename='paiement')
router.register(r'expeditions-facturees', EtreFactureViewSet, basename='etre-facture')

urlpatterns = [
    path('', include(router.urls)),
]