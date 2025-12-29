from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .api_views import (
    ChauffeurViewSet, VehiculeViewSet, 
    DestinationViewSet, TarificationViewSet, TourneeViewSet
)

# 1. Configuration du routeur API
# On définit ici uniquement la fin de l'URL (ex: 'chauffeurs')
router = DefaultRouter()
router.register(r'chauffeurs', ChauffeurViewSet, basename='api-chauffeur')
router.register(r'vehicules', VehiculeViewSet, basename='api-vehicule')
router.register(r'destinations', DestinationViewSet, basename='api-destination')
router.register(r'tarifs', TarificationViewSet, basename='api-tarif')
router.register(r'tournees', TourneeViewSet, basename='api-tournee')

urlpatterns = [
    # --- AUTHENTIFICATION ---
    path('login/', views.ConnexionUtilisateur.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(next_page='login'), name='logout'),

    # --- API (Pour React) ---
    # Cette ligne regroupe toutes les routes enregistrées dans le router ci-dessus
    # L'URL finale sera http://localhost:8000/api/chauffeurs/
    path('api/', include(router.urls)),

    # --- ROUTES VÉHICULES (HTML) ---
    path('vehicules/', views.liste_vehicules, name='liste_vehicules'),
    path('vehicules/ajouter/', views.ajouter_vehicule, name='ajouter_vehicule'),
    path('vehicules/modifier/<str:pk>/', views.modifier_vehicule, name='modifier_vehicule'),
    path('vehicules/supprimer/<str:pk>/', views.supprimer_vehicule, name='supprimer_vehicule'),

    # --- ROUTES CHAUFFEURS (HTML) ---
    path('chauffeurs/', views.liste_chauffeurs, name='liste_chauffeurs'),
    path('chauffeurs/ajouter/', views.ajouter_chauffeur, name='ajouter_chauffeur'),
    path('chauffeurs/modifier/<str:pk>/', views.modifier_chauffeur, name='modifier_chauffeur'),
    path('chauffeurs/supprimer/<str:pk>/', views.supprimer_chauffeur, name='supprimer_chauffeur'),

    # --- ROUTES DESTINATIONS (HTML) ---
    path('destinations/', views.liste_destinations, name='liste_destinations'),
    path('destinations/ajouter/', views.ajouter_destination, name='ajouter_destination'),
    path('destinations/modifier/<str:pk>/', views.modifier_destination, name='modifier_destination'),
    path('destinations/supprimer/<str:pk>/', views.supprimer_destination, name='supprimer_destination'),

    # --- ROUTES TARIFS (HTML) ---
    path('tarifs/', views.liste_tarifs, name='liste_tarifs'),
    path('tarifs/ajouter/', views.ajouter_tarif, name='ajouter_tarif'),
    path('tarifs/modifier/<str:pk>/', views.modifier_tarif, name='modifier_tarif'),
    path('tarifs/supprimer/<str:pk>/', views.supprimer_tarif, name='supprimer_tarif'),

    # --- ROUTES EXPÉDITIONS (HTML) ---
    path('expeditions/', views.liste_expeditions, name='liste_expeditions'),
    path('expeditions/ajouter/', views.ajouter_expedition, name='ajouter_expedition'),
    path('expeditions/modifier/<int:pk>/', views.modifier_expedition, name='modifier_expedition'),
    path('expeditions/supprimer/<int:pk>/', views.supprimer_expedition, name='supprimer_expedition'),

    # --- ROUTES TOURNÉES (HTML) ---
    path('tournees/', views.liste_tournees, name='liste_tournees'),
    path('tournees/ajouter/', views.ajouter_tournee, name='ajouter_tournee'),
    path('tournees/modifier/<str:pk>/', views.modifier_tournee, name='modifier_tournee'),
    path('tournees/supprimer/<str:pk>/', views.supprimer_tournee, name='supprimer_tournee'),
]