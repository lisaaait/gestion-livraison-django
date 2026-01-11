from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExpeditionViewSet, IncidentViewSet

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'expeditions', ExpeditionViewSet, basename='expedition')
router.register(r'incidents', IncidentViewSet, basename='incident')

urlpatterns = [
    path('', include(router.urls)),
]