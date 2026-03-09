# 🚀 Déploiement e-Colis sur Railway

## Comptes de démo (pré-chargés automatiquement)
| Rôle     | Email               | Mot de passe |
|----------|---------------------|--------------|
| Marchand | marc@boutique.fr    | (n'importe lequel) |
| Livreur  | karim@livreur.fr    | (n'importe lequel) |
| Admin    | admin@ecolis.fr     | (n'importe lequel) |

---

## Étapes de déploiement (5 min)

### 1. Créer un dépôt GitHub
- Va sur https://github.com/new
- Crée un dépôt nommé `e-colis` (privé ou public)

### 2. Pousser le code
```bash
cd e-colis
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/e-colis.git
git push -u origin main
```

### 3. Déployer sur Railway
1. Va sur https://railway.app et connecte-toi avec GitHub
2. Clique **"New Project"** → **"Deploy from GitHub repo"**
3. Sélectionne ton dépôt `e-colis`
4. Railway détecte automatiquement la config (`railway.json`)
5. Attends 2-3 minutes que le build termine
6. Clique sur **"Generate Domain"** pour obtenir ton URL publique

### 4. C'est prêt ! 🎉
Tu reçois une URL du type : `https://e-colis-production.up.railway.app`

---

## Notes importantes
- La base de données SQLite est stockée dans `/tmp` (données réinitialisées au redémarrage)
- Les données de démo sont chargées automatiquement au premier démarrage
- Railway offre 500 heures gratuites/mois (largement suffisant pour une présentation)
