from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q, F, Avg, Sum
from django.db.models.functions import TruncMonth, ExtractWeekDay
from .models import Chauffeur, Vehicule, Destination, Tarification, Tournee 
from expeditions.models import Expedition, Incident
from .serializers import (
    ChauffeurSerializer, VehiculeSerializer, 
    DestinationSerializer, TarificationSerializer, TourneeSerializer, ExpeditionSerializer
)

# --- VIEWSETS CLASSIQUES (CRUD) ---

class ChauffeurViewSet(viewsets.ModelViewSet):
    queryset = Chauffeur.objects.all()
    serializer_class = ChauffeurSerializer
    permission_classes = [permissions.IsAuthenticated]

class VehiculeViewSet(viewsets.ModelViewSet):
    queryset = Vehicule.objects.all()
    serializer_class = VehiculeSerializer
    permission_classes = [permissions.IsAuthenticated]

class DestinationViewSet(viewsets.ModelViewSet):
    queryset = Destination.objects.all()
    serializer_class = DestinationSerializer
    permission_classes = [permissions.IsAuthenticated]

class TarificationViewSet(viewsets.ModelViewSet):
    queryset = Tarification.objects.all()
    serializer_class = TarificationSerializer
    permission_classes = [permissions.IsAuthenticated]

class TourneeViewSet(viewsets.ModelViewSet):
    queryset = Tournee.objects.all()
    serializer_class = TourneeSerializer
    permission_classes = [permissions.IsAuthenticated]

class ExpeditionViewSet(viewsets.ModelViewSet):
    queryset = Expedition.objects.all()
    serializer_class = ExpeditionSerializer
    permission_classes = [permissions.IsAuthenticated]


# --- VUE DES STATISTIQUES (BUSINESS INTELLIGENCE) ---

class StatistiquesLogistiqueView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Destinations : Volume ET Performance Financière (Chiffre d'Affaires)
        dest_stats = Expedition.objects.values(
            nom_ville=F('tarification__destination__ville')
        ).annotate(
            total_colis=Count('numexp'),
            chiffre_affaires=Sum('montant_estime')
        ).order_by('-chiffre_affaires')[:5]

        # 2. Heatmap : Activité par Jour de la Semaine (Optimisation des plannings)
        # 1=Dimanche, 2=Lundi ... 7=Samedi
        heatmap_jours = Expedition.objects.annotate(
            jour_semaine=ExtractWeekDay('date_creation')
        ).values('jour_semaine').annotate(
            volume=Count('numexp')
        ).order_by('jour_semaine')

        # 3. Évolution mensuelle et Taux de croissance des tournées
        evolution_query = Tournee.objects.annotate(
            mois=TruncMonth('date_tournee')
        ).values('mois').annotate(
            nb_tournees=Count('code_t')
        ).order_by('mois')
        
        evolution_data = list(evolution_query)
        for i in range(len(evolution_data)):
            if i > 0 and evolution_data[i-1]['nb_tournees'] > 0:
                prev = evolution_data[i-1]['nb_tournees']
                curr = evolution_data[i]['nb_tournees']
                evolution_data[i]['taux_croissance'] = round(((curr - prev) / prev) * 100, 2)
            else:
                evolution_data[i]['taux_croissance'] = 0

        # 4. Performance Chauffeurs (Top 5 - Fiabilité et efficacité)
        top_chauffeurs = Chauffeur.objects.annotate(
            tournees_total=Count('tournee'),
            tournees_reussies=Count('tournee', filter=Q(tournee__statut='TERMINEE')),
            nb_retards=Count('tournee__expeditions__incidents', filter=Q(tournee__expeditions__incidents__type='RETARD')),
        ).order_by('-tournees_reussies', 'nb_retards')[:5]

        # 5. Pics d'activité mensuels (Volume global par mois)
        pics_activite = Expedition.objects.annotate(
            mois=TruncMonth('date_creation')
        ).values('mois').annotate(
            volume_colis=Count('numexp')
        ).order_by('mois')

        # RÉPONSE UNIQUE
        return Response({
            "destinations_performance": list(dest_stats),
            "heatmap_hebdomadaire": list(heatmap_jours),
            "evolution_mensuelle": evolution_data,
            "pics_activite_mensuelle": list(pics_activite),
            "performance_chauffeurs": list(top_chauffeurs.values(
                'nom', 'tournees_reussies', 'tournees_total', 'nb_retards'
            ))
        })