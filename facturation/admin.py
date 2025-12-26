from django.contrib import admin
from django.utils.html import format_html
from .models import Facture, Paiement, EtreFacture


class EtreFactureInline(admin.TabularInline):
    """
    Inline pour afficher les expéditions d'une facture.
    """
    model = EtreFacture
    extra = 1
    readonly_fields = ['date_ajout']
    autocomplete_fields = ['numexp']


class PaiementInline(admin.TabularInline):
    """
    Inline pour afficher les paiements d'une facture.
    """
    model = Paiement
    extra = 1
    readonly_fields = ['reference_p', 'date_creation']
    fields = ['reference_p', 'date', 'montant_verse', 'mode_paiement', 'remarques']


@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour les factures.
    """
    
    list_display = [
        'code_facture',
        'code_client',
        'date_f',
        'ht_display',
        'tva_display',
        'ttc_display',
        'statut_paiement',
        'nb_expeditions',
        'nb_paiements',
    ]
    
    list_filter = [
        'est_payee',
        'date_f',
    ]
    
    search_fields = [
        'code_facture',
        'code_client',
        'remarques',
    ]
    
    readonly_fields = [
        'code_facture',
        'ht',
        'tva',
        'ttc',
        'date_creation',
        'montant_paye_display',
        'reste_a_payer_display',
    ]
    
    fieldsets = (
        ('Informations principales', {
            'fields': ('code_facture', 'code_client', 'date_f')
        }),
        ('Montants', {
            'fields': (
                'montant',
                'ht',
                'tva',
                'ttc',
                'montant_paye_display',
                'reste_a_payer_display',
                'est_payee',
            )
        }),
        ('Détails', {
            'fields': ('remarques', 'date_creation'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [EtreFactureInline, PaiementInline]
    
    ordering = ['-date_f', '-code_facture']
    
    def ht_display(self, obj):
        """Affiche le montant HT formaté"""
        return f"{obj.ht:,.2f} DA"
    ht_display.short_description = 'HT'
    ht_display.admin_order_field = 'ht'
    
    def tva_display(self, obj):
        """Affiche la TVA formatée"""
        return f"{obj.tva:,.2f} DA"
    tva_display.short_description = 'TVA'
    tva_display.admin_order_field = 'tva'
    
    def ttc_display(self, obj):
        """Affiche le montant TTC formaté"""
        return format_html(
            '<strong>{:,.2f} DA</strong>',
            obj.ttc
        )
    ttc_display.short_description = 'TTC'
    ttc_display.admin_order_field = 'ttc'
    
    def montant_paye_display(self, obj):
        """Affiche le montant déjà payé"""
        montant = obj.montant_paye()
        return format_html(
            '<span style="color: green; font-weight: bold;">{:,.2f} DA</span>',
            montant
        )
    montant_paye_display.short_description = 'Montant payé'
    
    def reste_a_payer_display(self, obj):
        """Affiche le reste à payer"""
        reste = obj.reste_a_payer()
        color = 'red' if reste > 0 else 'green'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:,.2f} DA</span>',
            color,
            reste
        )
    reste_a_payer_display.short_description = 'Reste à payer'
    
    def statut_paiement(self, obj):
        """Affiche le statut de paiement avec badge"""
        if obj.est_payee:
            return format_html(
                '<span style="background-color: green; color: white; padding: 3px 10px; border-radius: 3px;">PAYÉE</span>'
            )
        else:
            reste = obj.reste_a_payer()
            if reste == obj.ttc:
                status = 'NON PAYÉE'
                color = 'red'
            else:
                status = 'PARTIELLE'
                color = 'orange'
            return format_html(
                '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
                color,
                status
            )
    statut_paiement.short_description = 'Statut'
    
    def nb_expeditions(self, obj):
        """Affiche le nombre d'expéditions"""
        count = obj.expeditions_facturees.count()
        return format_html('<strong>{}</strong>', count)
    nb_expeditions.short_description = 'Expéditions'
    
    def nb_paiements(self, obj):
        """Affiche le nombre de paiements"""
        count = obj.paiements.count()
        return format_html('<strong>{}</strong>', count)
    nb_paiements.short_description = 'Paiements'
    
    actions = ['recalculer_montants']
    
    def recalculer_montants(self, request, queryset):
        """Action pour recalculer les montants des factures sélectionnées"""
        for facture in queryset:
            facture.calculer_montant_depuis_expeditions()
            facture.save()
        self.message_user(request, f"{queryset.count()} facture(s) recalculée(s).")
    recalculer_montants.short_description = "Recalculer les montants"


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour les paiements.
    """
    
    list_display = [
        'reference_p',
        'code_facture',
        'date',
        'montant_verse_display',
        'mode_paiement_badge',
        'date_creation',
    ]
    
    list_filter = [
        'mode_paiement',
        'date',
    ]
    
    search_fields = [
        'reference_p',
        'code_facture__code_facture',
        'remarques',
    ]
    
    readonly_fields = [
        'reference_p',
        'date_creation',
    ]
    
    fieldsets = (
        ('Informations principales', {
            'fields': ('reference_p', 'code_facture', 'date')
        }),
        ('Détails du paiement', {
            'fields': ('montant_verse', 'mode_paiement')
        }),
        ('Remarques', {
            'fields': ('remarques', 'date_creation'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-date', '-reference_p']
    
    autocomplete_fields = ['code_facture']
    
    def montant_verse_display(self, obj):
        """Affiche le montant versé formaté"""
        return format_html(
            '<strong style="color: green;">{:,.2f} DA</strong>',
            obj.montant_verse
        )
    montant_verse_display.short_description = 'Montant versé'
    montant_verse_display.admin_order_field = 'montant_verse'
    
    def mode_paiement_badge(self, obj):
        """Affiche le mode de paiement avec badge"""
        colors = {
            'ESPECES': 'green',
            'CHEQUE': 'blue',
            'VIREMENT': 'purple',
            'CARTE': 'orange',
            'MOBILE': 'cyan',
        }
        color = colors.get(obj.mode_paiement, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_mode_paiement_display()
        )
    mode_paiement_badge.short_description = 'Mode de paiement'


@admin.register(EtreFacture)
class EtreFactureAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour la table de liaison EtreFacture.
    """
    
    list_display = [
        'numexp',
        'code_facture',
        'date_ajout',
    ]
    
    list_filter = [
        'date_ajout',
    ]
    
    search_fields = [
        'numexp__numexp',
        'code_facture__code_facture',
    ]
    
    readonly_fields = [
        'date_ajout',
    ]
    
    ordering = ['-date_ajout']
    
    autocomplete_fields = ['numexp', 'code_facture']