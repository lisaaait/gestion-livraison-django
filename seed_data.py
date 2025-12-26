import os
import django
from datetime import date

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transport_system.settings')
django.setup()

from gestion_transport.models import Destination, Tarification, Chauffeur, Vehicule, Expedition, Tournee
from django.core.exceptions import ValidationError

def run_seed():
    print("--- Initialisation des données ---")

    # 1. Destinations
    d1, _ = Destination.objects.get_or_create(code_d="AL-01", ville="Alger", zone_geo="CENTRE")
    print("Destination Alger prête.")

    # 2. Tarification
    t1, _ = Tarification.objects.get_or_create(
        code_tarif="STD-AL", type_service="STANDARD", 
        tarif_base_destination=500, tarif_poids=50, tarif_volume=100, destination=d1
    )
    print("Tarification Alger prête.")

    # 3. Logistique
    c_moto, _ = Chauffeur.objects.get_or_create(code_chauffeur="CH-M1", nom="Amine Moto", num_permis="1234567890", categorie_permis="A")
    c_camion, _ = Chauffeur.objects.get_or_create(code_chauffeur="CH-C1", nom="Karim Camion", num_permis="0987654321", categorie_permis="C")
    v_moto, _ = Vehicule.objects.get_or_create(matricule="000001", type_vehicule="MOTO", capacite_poids=50, capacite_volume=0.2)
    v_camion, _ = Vehicule.objects.get_or_create(matricule="000002", type_vehicule="CAMION", capacite_poids=5000, capacite_volume=30)
    print("Chauffeurs et Véhicules créés.")

    print("\n--- Tests Métier ---")

    # Test Montant
    e1 = Expedition.objects.create(poids=10, volume=0.1, tarification=t1)
    e1.refresh_from_db()
    print(f"Montant calculé Expédition 1 : {e1.montant_estime} DA")

    # Test Permis
    print("\nTest Sécurité : Karim (Permis C) sur une Moto (Permis A)...")
    try:
        t_fail = Tournee(code_t="T-FAIL", date_tournee=date.today(), vehicule=v_moto, chauffeur=c_camion)
        t_fail.full_clean()
        print("ERREUR : Le permis C a été accepté pour la moto.")
    except ValidationError as e:
        print(f"BLOCAGE RÉUSSI : {e}")

    # Test Surcharge
    print("\nTest Sécurité : Surcharge de la moto (Colis 150kg sur 50kg max)...")
    e_lourde = Expedition.objects.create(poids=150, volume=0.3, tarification=t1)
    t_moto = Tournee.objects.create(code_t="T-MOTO", date_tournee=date.today(), vehicule=v_moto, chauffeur=c_moto)
    t_moto.expeditions.add(e_lourde)
    try:
        t_moto.verifier_capacite()
        print("ERREUR : La surcharge a été ignorée.")
    except ValidationError as e:
        print(f"BLOCAGE RÉUSSI : {e}")

    print("\n--- Fin du script ---")

    # 4. Test de Conflit Géographique 
    print("\nTest Sécurité : Conflit de Zone (Tentative de mélange Alger/Oran)...")
    d2, _ = Destination.objects.get_or_create(code_d="OR-31", ville="Oran", zone_geo="OUEST")
    # On crée une tarification pour Oran
    t_oran, _ = Tarification.objects.get_or_create(
        code_tarif="STD-OR", type_service="STANDARD", 
        tarif_base_destination=800,
        tarif_poids=60,
        tarif_volume=120, 
        destination=d2
    )
    
    # On crée deux expéditions dans des zones différentes
    e_alger = Expedition.objects.create(poids=5, volume=0.1, tarification=t1) # Zone CENTRE
    e_oran = Expedition.objects.create(poids=5, volume=0.1, tarification=t_oran) # Zone OUEST
    
    # On prépare une tournée pour le camion de Karim
    t_conflit = Tournee.objects.create(code_t="T-ZONES", date_tournee=date.today(), vehicule=v_camion, chauffeur=c_camion)
    
    # On ajoute les deux colis
    t_conflit.expeditions.add(e_alger, e_oran)
    
    try:
        # On force la validation pour vérifier les zones
        t_conflit.full_clean()
        print("ERREUR : Le système a accepté de mélanger Alger et Oran.")
    except ValidationError as e:
        print(f"BLOCAGE RÉUSSI : {e}")

if __name__ == "__main__":
    run_seed()