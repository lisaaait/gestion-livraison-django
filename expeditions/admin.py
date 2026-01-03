from django.contrib import admin
from django.utils.html import format_html
from .models import Expedition, Incident


@admin.register(Expedition)
class ExpeditionAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour les expéditions.
    """
    
    list_display = [
        'numexp',
        'code_client',
        'poids',
        'volume',
        'montant_estime_display',
        'statut_badge',
        'date_creation',
        'nb_incidents',
    ]
    
    list_filter = [
        'statut',
        'date_creation',
    ]
    
    search_fields = [
        'numexp',
        'code_client',
        'description',
    ]
    
    readonly_fields = [
        'numexp',
        'date_creation',
        'date_modification',
    ]
    
    fieldsets = (
        ('Informations principales', {
            'fields': ('numexp', 'code_client', 'statut')
        }),
        ('Détails du colis', {
            'fields': ('poids', 'volume', 'description', 'montant_estime')
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-date_creation']
    
    def statut_badge(self, obj):
        """Affiche le statut avec une couleur"""
        colors = {
            'EN_ATTENTE': 'gray',
            'EN_PREPARATION': 'blue',
            'EN_TRANSIT': 'orange',
            'EN_CENTRE_TRI': 'purple',
            'EN_COURS_LIVRAISON': 'cyan',
            'LIVRE': 'green',
            'ECHEC_LIVRAISON': 'red',
            'RETOUR': 'darkred',
        }
        color = colors.get(obj.statut, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_statut_display()
        )
    statut_badge.short_description = 'Statut'
    
    def montant_estime_display(self, obj):
        """Affiche le montant estimé formaté"""
        if obj.montant_estime:
            return f"{obj.montant_estime:,.2f} DA"
        return "-"
    montant_estime_display.short_description = 'Montant estimé'
    
    def nb_incidents(self, obj):
        """Affiche le nombre d'incidents"""
        count = obj.incidents.count()
        if count > 0:
            return format_html(
                '<span style="color: red; font-weight: bold;">{}</span>',
                count
            )
        return 0
    nb_incidents.short_description = 'Incidents'
    
    actions = ['marquer_en_transit', 'marquer_livre']
    
    def marquer_en_transit(self, request, queryset):
        """Action pour marquer les expéditions sélectionnées comme en transit"""
        updated = queryset.update(statut='EN_TRANSIT')
        self.message_user(request, f"{updated} expédition(s) marquée(s) en transit.")
    marquer_en_transit.short_description = "Marquer comme 'En transit'"
    
    def marquer_livre(self, request, queryset):
        """Action pour marquer les expéditions sélectionnées comme livrées"""
        updated = queryset.update(statut='LIVRE')
        self.message_user(request, f"{updated} expédition(s) marquée(s) comme livrée(s).")
    marquer_livre.short_description = "Marquer comme 'Livré'"


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour les incidents.
    """
    
    list_display = [
        'code_inc',
        'numexp',
        'type',
        'wilaya',
        'commune',
        'etat_badge',
        'date_creation',
        'date_resolution',
        'a_piece_jointe',
    ]
    
    list_filter = [
        'type',
        'etat',
        'date_creation',
    ]
    
    search_fields = [
        'code_inc',
        'numexp__numexp',
        'commentaire',
        'resolution',
    ]
    
    readonly_fields = [
        'code_inc',
        'date_creation',
        'date_resolution',
    ]
    
    fieldsets = (
        ('Informations principales', {
            'fields': ('code_inc', 'numexp', 'type', 'etat')
        }),
        ('Détails', {
            'fields': ('commentaire', 'piece_jointe', 'wilaya', 'commune')
        }),
        ('Résolution', {
            'fields': ('resolution', 'date_resolution')
        }),
        ('Dates', {
            'fields': ('date_creation',),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-date_creation']
    
    def etat_badge(self, obj):
        """Affiche l'état avec une couleur"""
        colors = {
            'OUVERT': 'red',
            'EN_COURS': 'orange',
            'RESOLU': 'green',
            'FERME': 'gray',
            'ANNULE': 'darkgray',
        }
        color = colors.get(obj.etat, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_etat_display()
        )
    etat_badge.short_description = 'État'
    
    def a_piece_jointe(self, obj):
        """Indique si une pièce jointe est présente"""
        if obj.piece_jointe:
            return format_html('<span style="color: green;">✓</span>')
        return format_html('<span style="color: red;">✗</span>')
    a_piece_jointe.short_description = 'PJ'
    
    actions = ['marquer_en_cours', 'marquer_resolu']
    
    def marquer_en_cours(self, request, queryset):
        """Action pour marquer les incidents comme en cours"""
        updated = queryset.update(etat='EN_COURS')
        self.message_user(request, f"{updated} incident(s) marqué(s) en cours.")
    marquer_en_cours.short_description = "Marquer comme 'En cours'"
    
    def marquer_resolu(self, request, queryset):
        """Action pour marquer les incidents comme résolus"""
        from django.utils import timezone
        updated = queryset.update(etat='RESOLU', date_resolution=timezone.now())
        self.message_user(request, f"{updated} incident(s) marqué(s) comme résolu(s).")
    marquer_resolu.short_description = "Marquer comme 'Résolu'"
