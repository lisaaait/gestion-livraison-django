from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClientViewSet, HistoriqueViewSet,
    ReclamationViewSet, RapportViewSet, ContientViewSet
)

router = DefaultRouter()
router.register('clients', ClientViewSet)
router.register('historiques', HistoriqueViewSet)
router.register('reclamations', ReclamationViewSet)
router.register('rapports', RapportViewSet)
router.register('contient', ContientViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]