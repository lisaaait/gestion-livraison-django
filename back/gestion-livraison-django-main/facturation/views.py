from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from decimal import Decimal
from rest_framework.permissions import AllowAny
import traceback
import sys

from .models import Facture, Paiement, EtreFacture
from .serializers import (
    FactureListSerializer,
    FactureDetailSerializer,
    FactureCreateUpdateSerializer,
    PaiementListSerializer,
    PaiementDetailSerializer,
    PaiementCreateUpdateSerializer,
    EtreFactureSerializer,
    EtreFactureCreateSerializer
)

# --------- Fonctions utilitaires ---------

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


# --------- FactureViewSet ---------

class FactureViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les factures.
    """
    permission_classes = [AllowAny]
    queryset = Facture.objects.all()
    lookup_field = 'code_facture'
    lookup_url_kwarg = 'code_facture'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['code_client', 'est_payee', 'date_f']
    search_fields = ['code_facture', 'remarques', 'code_client__nom']
    ordering_fields = ['date_f', 'ttc', 'date_creation']
    ordering = ['-date_f']

    # Serializer selon action
    def get_serializer_class(self):
        if self.action == 'list':
            return FactureListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return FactureCreateUpdateSerializer
        return FactureDetailSerializer

    # Create avec debug
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            tb = traceback.format_exc()
            print("=== Exception lors de la création d'une facture ===", file=sys.stderr)
            print(tb, file=sys.stderr)
            print("Request data:", request.data, file=sys.stderr)
            return Response(
                {
                    "detail": "Exception on server during create facture",
                    "error": str(e),
                    "traceback": tb.splitlines()[-20:],
                    "request_data": request.data,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # Stats globales
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        total = self.queryset.count()
        total_ttc = self.queryset.aggregate(total=Sum('ttc'))['total'] or 0
        total_paye = sum(f.montant_paye() for f in self.queryset)

        stats = {
            'total_factures': total,
            'factures_payees': self.queryset.filter(est_payee=True).count(),
            'factures_impayees': self.queryset.filter(est_payee=False).count(),
            'montant_total_ttc': float(total_ttc),
            'montant_total_paye': float(total_paye),
            'montant_reste_a_payer': float(total_ttc - total_paye)
        }
        return Response(stats)

    # Evolution du CA
    @action(detail=False, methods=['get'])
    def evolution_chiffre_affaires(self, request):
        try:
            months = int(request.query_params.get('months', 12))
        except ValueError:
            months = 12
        months = max(1, months)

        start, end, month_starts = _month_range(months)
        grouped = (
            self.queryset.filter(date_f__gte=start.date(), date_f__lt=end.date())
            .annotate(month=TruncMonth('date_f'))
            .values('month')
            .annotate(total=Sum('ttc'))
            .order_by('month')
        )
        totals = {item['month'].strftime('%Y-%m'): item['total'] or Decimal('0.00') for item in grouped}

        data = []
        prev_total = None
        for month_start in month_starts:
            key = month_start.strftime('%Y-%m')
            total = totals.get(key, Decimal('0.00'))
            if prev_total in (None, Decimal('0.00')):
                evolution = None
            else:
                evolution = round(((total - prev_total) / prev_total) * 100, 2)
            data.append({
                'month': key,
                'total_ttc': float(total),
                'evolution_percent': float(evolution) if evolution is not None else None,
            })
            prev_total = total

        return Response({'months': months, 'data': data})

    # Factures impayées
    @action(detail=False, methods=['get'])
    def impayees(self, request):
        factures = self.queryset.filter(est_payee=False)
        serializer = FactureListSerializer(factures, many=True)
        return Response(serializer.data)

    # Ajouter expédition à une facture
    @action(detail=True, methods=['post'])
    def ajouter_expedition(self, request, code_facture=None):
        facture = self.get_object()
        numexp = request.data.get('numexp')
        if not numexp:
            return Response({"error": "Le numéro d'expédition est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = EtreFactureCreateSerializer(data={'numexp': numexp, 'code_facture': facture.code_facture})
        if serializer.is_valid():
            serializer.save()
            facture.refresh_from_db()
            return Response(FactureDetailSerializer(facture).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Paiements d'une facture
    @action(detail=True, methods=['get'])
    def paiements(self, request, code_facture=None):
        facture = self.get_object()
        paiements = facture.paiements.all()
        serializer = PaiementListSerializer(paiements, many=True)
        return Response(serializer.data)


# --------- PaiementViewSet ---------

class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.select_related('code_facture').all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    permission_classes = [AllowAny]
    filterset_fields = ['code_facture', 'mode_paiement', 'date']
    search_fields = ['reference_p', 'remarques']
    ordering_fields = ['date', 'montant_verse', 'date_creation']
    ordering = ['-date']

    def get_serializer_class(self):
        if self.action == 'list':
            return PaiementListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PaiementCreateUpdateSerializer
        return PaiementDetailSerializer

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)

            paiement = serializer.instance
            response_serializer = PaiementListSerializer(paiement)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            tb = traceback.format_exc()
            print("=== Exception lors de la création d'un paiement ===", file=sys.stderr)
            print(tb, file=sys.stderr)
            print("Request data:", request.data, file=sys.stderr)
            return Response(
                {
                    "detail": "Erreur lors de la création du paiement",
                    "error": str(e),
                    "traceback": tb.splitlines()[-10:],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    def perform_destroy(self, instance):
        facture = instance.code_facture
        super().perform_destroy(instance)
        if facture.reste_a_payer() > 0:
            facture.est_payee = False
            facture.save()

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        total = self.queryset.count()
        total_montant = self.queryset.aggregate(total=Sum('montant_verse'))['total'] or 0
        par_mode = self.queryset.values('mode_paiement').annotate(
            count=Count('reference_p'),
            total=Sum('montant_verse')
        )
        stats = {
            'total_paiements': total,
            'montant_total': float(total_montant),
            'par_mode_paiement': list(par_mode)
        }
        return Response(stats)


# --------- EtreFactureViewSet ---------

class EtreFactureViewSet(viewsets.ModelViewSet):
    queryset = EtreFacture.objects.select_related('numexp', 'code_facture').all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['numexp', 'code_facture']

    def get_serializer_class(self):
        if self.action == 'create':
            return EtreFactureCreateSerializer
        return EtreFactureSerializer

    def destroy(self, request, *args, **kwargs):
        """Recalculer le montant de la facture après suppression"""
        return super().destroy(request, *args, **kwargs)