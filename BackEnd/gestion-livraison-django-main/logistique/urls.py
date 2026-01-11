from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views
from .api_views import (
    ChauffeurViewSet, VehiculeViewSet, 
    DestinationViewSet, TarificationViewSet, TourneeViewSet
)

# 1. Configuration du routeur API
router = DefaultRouter()
router.register(r'chauffeurs', ChauffeurViewSet, basename='api-chauffeur')
router.register(r'vehicules', VehiculeViewSet, basename='api-vehicule')
router.register(r'destinations', DestinationViewSet, basename='api-destination')
router.register(r'tarifs', TarificationViewSet, basename='api-tarif')
router.register(r'tournees', TourneeViewSet, basename='api-tournee')

urlpatterns = [
    # --- AUTHENTIFICATION ---
    path('login/', api_views.ConnexionUtilisateur.as_view(), name='login'),
    path('logout/', api_views.LogoutView.as_view(next_page='login'), name='logout'),
    path('api/', include(router.urls)),

    
]