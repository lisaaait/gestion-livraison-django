# Gestion Livraison (Backend Docker + Frontend local)

Ce projet lance le backend Django dans Docker et le frontend React/Vite en local.

## Prerequis
- Docker Desktop (avec Docker Compose)
- Node.js + npm
- Base de donnees (Docker) : PostgreSQL

## Structure du projet
- Backend Django (Docker) : `back/gestion-livraison-django-main`
- Frontend React/Vite (local) : racine du repo

## Demarrage rapide

### 1) Preparation locale (venv + requirements) dans le cas ou on n'utilise pas docker 
```
pip install -r .\back\gestion-livraison-django-main\requirements.txt
python C:\Projet_Django\back\gestion-livraison-django-main\manage.py runserver
```

### 2) Backend (Docker)
```
docker-compose -f C:\Projet_Django\back\gestion-livraison-django-main\docker-compose.yml up -d --build
docker-compose -f C:\Projet_Django\back\gestion-livraison-django-main\docker-compose.yml exec web python manage.py makemigrations
docker-compose -f C:\Projet_Django\back\gestion-livraison-django-main\docker-compose.yml exec web python manage.py migrate
```

### 3) Frontend (local)
```
npm install
npm run dev
```

## Acces / URLs
- Frontend : http://localhost:5173
- Backend API : http://localhost:8000/api
- Admin Django : http://localhost:8000/admin

## Commandes utiles
Creer un superuser (docker):
```
docker-compose -f C:\Projet_Django\back\gestion-livraison-django-main\docker-compose.yml exec web python manage.py createsuperuser
```
Creer un superuser (sans docker):
```
python C:\Projet_Django\back\gestion-livraison-django-main\manage.py createsuperuser
```
Reconstruire les images :

```powershell
docker compose -f C:\Projet_Django\back\gestion-livraison-django-main\docker-compose.yml build
```


Voir les logs :
```
docker-compose -f C:\Projet_Django\back\gestion-livraison-django-main\docker-compose.yml logs -f web
```

Arreter le backend :
```
docker-compose -f C:\Projet_Django\back\gestion-livraison-django-main\docker-compose.yml down
```

## Notes
- Le backend tourne dans Docker; le frontend tourne en local.
- Les dependances Python sont installees pendant le build Docker a partir de `back/gestion-livraison-django-main/requirements.txt`.
- La base de donnees est incluse dans le compose; le frontend n'est pas dans Docker.
- Le backend vit dans `back/gestion-livraison-django-main` et le frontend a la racine du repo.
