from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from .models import Expedition, Incident
from rest_framework.permissions import AllowAny
from .serializers import (
    ExpeditionListSerializer,
    ExpeditionDetailSerializer,
    ExpeditionCreateUpdateSerializer,
    IncidentListSerializer,
    IncidentDetailSerializer,
    IncidentCreateUpdateSerializer
)
def _add_months(dt, months):
    month_index = dt.month - 1 + months
    year = dt.year + month_index // 12
    month = month_index % 12 + 1
    return dt.replace(year=year, month=month, day=1)


def _month_range(months):
    now = timezone.now()
    start = _add_months(now.replace(day=1, hour=0, minute=0, second=0, microsecond=0), -(months - 1))
    end = _add_months(start, months)
    month_starts = [_add_months(start, i) for i in range(months)]
    return start, end, month_starts

class ExpeditionViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les expéditions.
    
    Endpoints:
    - GET /api/expeditions/ : Liste toutes les expéditions
    - POST /api/expeditions/ : Créer une expédition
    - GET /api/expeditions/{id}/ : Détails d'une expédition
    - PUT /api/expeditions/{id}/ : Modifier une expédition
    - DELETE /api/expeditions/{id}/ : Supprimer une expédition
    - GET /api/expeditions/statistiques/ : Stats des expéditions
    - GET /api/expeditions/par_statut/ : Grouper par statut
    """
    permission_classes = [AllowAny]
    queryset = Expedition.objects.select_related('code_client', 'tarification').all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # Filtres disponibles
    filterset_fields = ['statut', 'code_client', 'tarification']
    search_fields = ['numexp', 'description', 'code_client__nom']
    ordering_fields = ['date_creation', 'montant_estime', 'poids', 'volume']
    ordering = ['-date_creation']
    
    def get_serializer_class(self):
        """Choisir le serializer selon l'action"""
        if self.action == 'list':
            return ExpeditionListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ExpeditionCreateUpdateSerializer
        return ExpeditionDetailSerializer
    
    def destroy(self, request, *args, **kwargs):
        """Vérifier avant suppression"""
        instance = self.get_object()
        if not instance.peut_etre_supprime():
            return Response(
                {"error": "Cette expédition ne peut pas être supprimée (déjà facturée)."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Statistiques globales des expéditions"""
        total = self.queryset.count()
        par_statut = self.queryset.values('statut').annotate(count=Count('numexp'))
        
        stats = {
            'total_expeditions': total,
            'par_statut': list(par_statut),
            'montant_total_estime': sum(
                exp.montant_estime for exp in self.queryset if exp.montant_estime
            )
        }
        return Response(stats)
    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        expedition = self.get_object()
        if expedition.statut not in ['EN_ATTENTE', 'EN_TRANSIT']:
            return Response(
                {"error": "Cette expédition ne peut pas être validée"},
                status=status.HTTP_400_BAD_REQUEST
            )
        expedition.statut = 'LIVRE'
        expedition.save()
        serializer = ExpeditionDetailSerializer(expedition)
        return Response(serializer.data)  
    
    @action(detail=False, methods=['get'])
    def par_statut(self, request):
        """Grouper les expéditions par statut"""
        statut = request.query_params.get('statut', None)
        if statut:
            expeditions = self.queryset.filter(statut=statut)
        else:
            expeditions = self.queryset
        
        serializer = ExpeditionListSerializer(expeditions, many=True)
        return Response(serializer.data)
    @action(detail=False, methods=['get'])
    def evolution(self, request):
        """Taux d'Ç¸volution mensuel du nombre d'expÇ¸ditions"""
        try:
            months = int(request.query_params.get('months', 12))
        except ValueError:
            months = 12
        if months < 1:
            months = 1

        start, end, month_starts = _month_range(months)
        grouped = (
            self.queryset.filter(date_creation__gte=start, date_creation__lt=end)
            .annotate(month=TruncMonth('date_creation'))
            .values('month')
            .annotate(total=Count('numexp'))
            .order_by('month')
        )
        totals = {item['month'].strftime('%Y-%m'): item['total'] for item in grouped}

        data = []
        prev_total = None
        for month_start in month_starts:
            key = month_start.strftime('%Y-%m')
            total = totals.get(key, 0)
            if prev_total in (None, 0):
                evolution = None
            else:
                evolution = round(((total - prev_total) / prev_total) * 100, 2)
            data.append({
                'month': key,
                'total_expeditions': total,
                'evolution_percent': evolution,
            })
            prev_total = total

        return Response({'months': months, 'data': data})
    @action(detail=True, methods=['get'])
    def incidents(self, request, pk=None):
        """Liste des incidents d'une expédition"""
        expedition = self.get_object()
        incidents = expedition.incidents.all()
        serializer = IncidentListSerializer(incidents, many=True)
        return Response(serializer.data)


class IncidentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les incidents.
    
    Endpoints:
    - GET /api/incidents/ : Liste tous les incidents
    - POST /api/incidents/ : Créer un incident
    - GET /api/incidents/{id}/ : Détails d'un incident
    - PUT /api/incidents/{id}/ : Modifier un incident
    - DELETE /api/incidents/{id}/ : Supprimer un incident
    - GET /api/incidents/statistiques/ : Stats des incidents
    - POST /api/incidents/{id}/resoudre/ : Marquer comme résolu
    """
    
    queryset = Incident.objects.select_related('numexp').all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    permission_classes = [AllowAny]
    # Filtres disponibles
    filterset_fields = ['type', 'etat', 'numexp']
    search_fields = ['code_inc', 'commentaire', 'resolution']
    ordering_fields = ['date_creation', 'date_resolution', 'etat']
    ordering = ['-date_creation']
    
    def get_serializer_class(self):
        """Choisir le serializer selon l'action"""
        if self.action == 'list':
            return IncidentListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return IncidentCreateUpdateSerializer
        return IncidentDetailSerializer
    def update(self, request, *args, **kwargs):
        """
        Mise à jour complète (PUT)
        Permet de mettre à jour tous les champs
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Pour PUT, on assure que tous les champs requis sont présents
        data = request.data.copy()
        
        # Si des champs obligatoires manquent, on les prend de l'instance existante
        if not partial:
            if 'type' not in data:
                data['type'] = instance.type
            if 'commentaire' not in data:
                data['commentaire'] = instance.commentaire
            if 'numexp' not in data:
                data['numexp'] = instance.numexp.pk if instance.numexp else None
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Utiliser le serializer de détail pour la réponse
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(IncidentDetailSerializer(instance).data)
    
    def partial_update(self, request, *args, **kwargs):
        """
        Mise à jour partielle (PATCH)
        Permet de mettre à jour seulement certains champs
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Statistiques des incidents"""
        total = self.queryset.count()
        par_type = self.queryset.values('type').annotate(count=Count('code_inc'))
        par_etat = self.queryset.values('etat').annotate(count=Count('code_inc'))
        
        stats = {
            'total_incidents': total,
            'par_type': list(par_type),
            'par_etat': list(par_etat),
            'non_resolus': self.queryset.filter(
                ~Q(etat__in=['RESOLU', 'FERME'])
            ).count()
        }
        return Response(stats)
    @action(detail=False, methods=['get'])
    def zones(self, request):
        """Zones gÇ¸ographiques avec le plus d'incidents"""
        try:
            limit = int(request.query_params.get('limit', 10))
        except ValueError:
            limit = 10
        if limit < 1:
            limit = 1

        zones = (
            self.queryset.exclude(wilaya__isnull=True)
            .exclude(wilaya__exact='')
            .values('wilaya', 'commune')
            .annotate(total=Count('code_inc'))
            .order_by('-total')
        )
        if limit:
            zones = zones[:limit]
        return Response(list(zones))
    @action(detail=True, methods=['post'])
    def resoudre(self, request, pk=None):
        """Marquer un incident comme résolu"""
        incident = self.get_object()
        resolution = request.data.get('resolution', '')
        
        if not resolution:
            return Response(
                {"error": "La résolution est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        incident.etat = 'RESOLU'
        incident.resolution = resolution
        incident.save()
        
        serializer = IncidentDetailSerializer(incident)
        return Response(serializer.data)