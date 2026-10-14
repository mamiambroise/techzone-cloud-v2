# SPEC UI — TECHZONE CLOUD AUTH + IAM + CONTEXT

**Version :** 1.0  
**Référence :** CDC Auth/IAM Étape 1 + Étape 2  
**Objectif :** définir l’expérience utilisateur Auth/IAM sans déplacer la sécurité vers le frontend.

---

# 1. Principes UX

- interface claire, premium et cohérente avec Techzone Cloud ;
- aucune donnée sensible affichée inutilement ;
- aucune distinction permettant d’énumérer les comptes ;
- frontend = représentation, backend = autorité ;
- toute vue doit gérer loading, empty, error, forbidden et unavailable ;
- responsive desktop/tablet/mobile ;
- accessibilité clavier/focus/labels.

---

# 2. Navigation

Sous `PLATEFORME → Sécurité & IAM` :

```text
Sécurité & IAM
├── Vue d’ensemble
├── Identités
├── Utilisateurs
├── Organisations
├── Sites
├── Memberships
├── Rôles
├── Permissions
├── Policies
├── Sessions
├── MFA
├── Security Events
└── Audit
```

Espace utilisateur via profil :

```text
Mon compte
├── Profil
├── Mot de passe
├── Mes sessions
├── MFA
├── Recovery
└── Contexte actif
```

---

# 3. Routes indicatives

Adapter aux routes existantes.

```text
/login
/recovery
/recovery/complete
/security/mfa

/platform/security
/platform/security/identities
/platform/security/users
/platform/security/organizations
/platform/security/sites
/platform/security/memberships
/platform/security/roles
/platform/security/permissions
/platform/security/policies
/platform/security/sessions
/platform/security/mfa
/platform/security/events
/platform/security/audit
```

---

# 4. Écran Login

## Contenu

- logo Techzone Cloud ;
- titre ;
- identifier ;
- password ;
- bouton connexion ;
- mot de passe oublié ;
- erreur générique ;
- éventuel CAPTCHA ;
- état temporary lock.

## États

```text
IDLE
AUTHENTICATING
CAPTCHA_REQUIRED
MFA_REQUIRED
TEMPORARILY_LOCKED
ERROR
SUCCESS
```

## Règle

Après login password :

- si aucun MFA requis → finalisation session puis dashboard ;
- si MFA requis → écran MFA ;
- ne pas initialiser l’application protégée avant session/context validés.

---

# 5. Écran MFA Challenge

Affiche :

- titre « Vérification en deux étapes » ;
- explication neutre ;
- champ code TOTP ;
- validation ;
- état expiration challenge ;
- nombre d’essais non détaillé si cela affaiblit la sécurité ;
- lien retour connexion si autorisé.

Ne jamais afficher :
- secret TOTP ;
- challenge brut sensible ;
- détails internes ;
- information d’existence d’un autre compte.

---

# 6. MFA Enrollment

Étapes :

```text
1. Start enrollment
2. QR / secret setup
3. Confirm TOTP
4. Recovery codes if supported
5. Enabled
```

L’activation n’est effective qu’après confirmation.

Actions :
- activer ;
- régénérer/re-enroll selon policy ;
- désactiver avec re-authentication ;
- consulter statut.

---

# 7. Dashboard IAM

Cards proposées :

- utilisateurs actifs ;
- sessions actives ;
- failed logins ;
- temporary locks ;
- MFA coverage ;
- security alerts ;
- denied accesses.

Les métriques proviennent de données réelles.

Sections :
- incidents récents ;
- dernières modifications de rôles ;
- security events ;
- sessions suspectes ;
- raccourcis administration.

---

# 8. Utilisateurs

Liste :
- nom ;
- username/email masqué selon besoin ;
- status ;
- memberships count ;
- MFA status ;
- last activity ;
- actions.

Filtres :
- status ;
- Tenant ;
- MFA enabled ;
- role.

Actions permission-aware :
- ouvrir ;
- suspendre ;
- activer ;
- disable ;
- reset sessions ;
- gérer memberships.

---

# 9. User Detail

Tabs :

```text
Profil
Memberships
Roles
Sessions
MFA
Security Events
Audit
```

Chaque action sensible :
- confirmation ;
- justification si policy ;
- backend authorization ;
- audit.

---

# 10. Roles

Liste :
- name ;
- scope ;
- permissions count ;
- assignments ;
- status.

Detail :
- permissions ;
- memberships/identities concernées ;
- historique.

Édition :
- permission picker ;
- recherche ;
- groupement par module ;
- aucun rôle implicite non visible.

---

# 11. Permissions

Registry en lecture/administration selon privilège.

Colonnes :
- key ;
- module ;
- description ;
- scope ;
- sensitivity ;
- status.

Une permission inconnue côté serveur ne doit jamais être considérée comme autorisée.

---

# 12. Memberships

Afficher :

- user/identity ;
- tenant ;
- organization ;
- site ;
- roles ;
- status ;
- validity.

Actions :
- créer ;
- modifier rôle ;
- suspendre ;
- révoquer.

---

# 13. Sessions

Mes sessions :
- device ;
- navigateur ;
- IP approximative si policy ;
- createdAt ;
- lastSeen ;
- current session badge.

Actions :
- revoke ;
- revoke all others.

Admin :
- consultation selon permission ;
- révocation ;
- filtre tenant.

---

# 14. Context Selector

Dans le header global :

```text
Current Tenant
Current Organization / Site
User
Notifications
Profile
```

Switch :

```text
Select target
↓
loading
↓
backend validates membership
↓
success
↓
reload effective navigation/data
```

Sur refus :
- conserver contexte précédent ;
- message contrôlé ;
- aucun résidu du Tenant cible.

---

# 15. Security Events

Table :
- timestamp ;
- event type ;
- actor ;
- tenant ;
- severity ;
- result ;
- traceId.

Detail :
- contexte contrôlé ;
- aucune donnée secrète.

---

# 16. Audit

Filtres :
- date ;
- actor ;
- tenant ;
- action ;
- module ;
- result.

Detail :
- actor ;
- action ;
- target ;
- context ;
- timestamp ;
- result ;
- traceId.

---

# 17. Messages UX

Login invalide :

```text
Identifiants ou authentification invalides.
```

Ne pas dire :
- email inexistant ;
- username inconnu ;
- compte valide mais mot de passe faux.

Cross-tenant/refus :

```text
Vous n’êtes pas autorisé à accéder à cette ressource.
```

Session expirée :

```text
Votre session a expiré. Veuillez vous reconnecter.
```

---

# 18. Responsive

Desktop :
- sidebar complète ;
- tables riches.

Tablet :
- sidebar compacte ;
- drawers.

Mobile :
- navigation drawer ;
- cards/table responsive ;
- actions sensibles accessibles sans scroll horizontal critique.

---

# 19. Accessibilité

Obligatoire :
- tab order ;
- focus visible ;
- aria labels ;
- error association ;
- contraste ;
- OTP accessible ;
- modales accessibles ;
- pas de couleur comme seul indicateur.

---

# 20. Critères d’acceptation UI

- Login fonctionne desktop/mobile ;
- MFA fonctionne réellement ;
- aucune app protégée avant auth complète ;
- Context Switch recharge le contexte ;
- 401/403 gérés ;
- routes permission-aware ;
- utilisateurs/roles/sessions ont loading/empty/error ;
- aucun secret affiché ;
- navigation cohérente avec backend ;
- recette navigateur par rôle.
