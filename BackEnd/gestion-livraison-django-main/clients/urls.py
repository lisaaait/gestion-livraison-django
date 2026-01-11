from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClientViewSet, HistoriqueViewSet,
    ReclamationViewSet, RapportViewSet, ContientViewSet
)

router = DefaultRouter()
router.register('clients', ClientViewSet, basename='client')
router.register('historiques', HistoriqueViewSet, basename='historique')
router.register('reclamations', ReclamationViewSet, basename='reclamation')
router.register('rapports', RapportViewSet, basename='rapport')
router.register('contient', ContientViewSet, basename='contient')

urlpatterns = router.urls  # ← Changez ici