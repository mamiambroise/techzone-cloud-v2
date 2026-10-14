# MAQUETTES — TECHZONE CLOUD AUTH + IAM + CONTEXT

**Version :** 1.0  
**But :** inventaire détaillé des écrans à maqueter avant génération visuelle.

---

# M01 — Login

**Route :** `/login`  
**Objectif :** authentifier un utilisateur sans révéler l’existence du compte.

Composants :
- Logo Techzone Cloud ;
- Identifier ;
- Password ;
- Voir/masquer mot de passe ;
- Connexion ;
- Mot de passe oublié ;
- zone erreur générique ;
- CAPTCHA conditionnel.

États :
- idle ;
- authenticating ;
- captcha required ;
- temporary lock ;
- error.

---

# M02 — MFA Challenge

**Route :** étape du login / `/security/mfa`

Composants :
- code TOTP ;
- timer/expiration UX sans révéler détails internes ;
- Valider ;
- Retour connexion ;
- message d’erreur contrôlé.

États :
- awaiting code ;
- verifying ;
- invalid ;
- expired ;
- success.

---

# M03 — Recovery Request

Composants :
- email/identifier ;
- Envoyer ;
- confirmation générique.

Règle :
- même résultat visuel que le compte existe ou non.

---

# M04 — Recovery Complete

Composants :
- nouveau mot de passe ;
- confirmation ;
- strength ;
- validations ;
- action enregistrer.

---

# M05 — IAM Overview

Cards :
- Active Users ;
- Active Sessions ;
- Failed Logins ;
- Temporary Locks ;
- MFA Coverage ;
- Security Alerts.

Sections :
- security events récents ;
- modifications IAM récentes ;
- sessions à surveiller.

---

# M06 — Liste Utilisateurs

Table :
- utilisateur ;
- status ;
- tenant/memberships ;
- roles ;
- MFA ;
- last activity ;
- actions.

Filtres :
- status ;
- tenant ;
- role ;
- MFA.

---

# M07 — Détail Utilisateur

Header :
- identité ;
- status ;
- actions principales.

Tabs :
- Profil ;
- Memberships ;
- Roles ;
- Sessions ;
- MFA ;
- Security ;
- Audit.

---

# M08 — Création / Invitation Utilisateur

Champs selon périmètre :
- prénom ;
- nom ;
- username/email ;
- tenant ;
- membership ;
- role initial ;
- activation/invitation policy.

Ne pas forcer des champs non supportés par le backend réel.

---

# M09 — Memberships

Table :
- identity ;
- tenant ;
- organization/site ;
- roles ;
- status ;
- validity.

Actions :
- ajouter ;
- modifier ;
- suspendre ;
- revoke.

---

# M10 — Rôles

Table :
- nom ;
- scope ;
- nombre permissions ;
- assignments ;
- status.

Actions :
- créer ;
- dupliquer si supporté ;
- éditer ;
- désactiver.

---

# M11 — Éditeur de rôle

Layout :
- identité rôle à gauche ;
- permissions groupées par module ;
- recherche permission ;
- selected permissions ;
- résumé changements.

Actions :
- sauvegarder ;
- annuler.

---

# M12 — Permission Registry

Table :
- key ;
- module ;
- description ;
- scope ;
- sensitivity ;
- state.

Mode administrateur contrôlé.

---

# M13 — Organizations & Sites

Vue hiérarchique :

```text
Tenant
├── Organization A
│   ├── Site A1
│   └── Site A2
└── Organization B
```

Actions selon permission.

---

# M14 — Mes Sessions

Cards/table :
- device ;
- browser ;
- date ;
- last activity ;
- current badge.

Actions :
- revoke ;
- revoke all others.

---

# M15 — Sessions Administration

Filtres :
- tenant ;
- user ;
- status ;
- age.

Action :
- revoke permissionnée.

---

# M16 — MFA Management

Utilisateur :
- status Enabled/Disabled ;
- méthode TOTP ;
- enroll ;
- remove ;
- recovery status.

Admin :
- coverage ;
- policy ;
- uniquement données autorisées.

---

# M17 — MFA Enrollment

Étapes visuelles :

```text
1 Introduction
2 Scan QR
3 Enter TOTP
4 Confirm
5 Recovery codes if supported
6 Done
```

---

# M18 — Context Selector

Header dropdown :

- Tenant actif ;
- Organization/Site éventuel ;
- autres contextes autorisés.

États :
- loading ;
- switching ;
- forbidden ;
- success.

---

# M19 — Security Events

Table :
- timestamp ;
- severity ;
- event ;
- actor ;
- tenant ;
- result ;
- traceId.

Drawer détail.

---

# M20 — Audit

Filtres :
- période ;
- actor ;
- action ;
- tenant ;
- result.

Timeline/table.

---

# M21 — Policies

Liste :
- policy ;
- scope ;
- status ;
- last changed.

Détail :
- règle ;
- cible ;
- effet ;
- priorité ;
- audit.

Ne pas créer un éditeur de policy avancé si le moteur réel ne le supporte pas.

---

# M22 — Forbidden 403

Écran commun :
- icône ;
- message ;
- retour ;
- trace ID optionnel non sensible.

---

# M23 — Session Expired

Modal/page :
- session expirée ;
- reconnecter ;
- préserver uniquement état non sensible.

---

# M24 — Temporary Lock

Message :
- authentification temporairement limitée ;
- ne pas révéler la logique anti-abus exacte ;
- option recovery si policy.

---

# M25 — Mobile IAM

Maquette responsive :
- navigation drawer ;
- cards compactes ;
- tables transformées ;
- MFA facile au clavier numérique ;
- actions critiques confirmées.

---

# Convention de chaque maquette visuelle

Chaque image à générer devra respecter :

- sidebar bleu nuit Techzone Cloud ;
- fond très clair ;
- cartes blanches arrondies ;
- accents bleu/indigo/violet ;
- badges propres ;
- icônes Lucide ;
- typographie nette ;
- responsive ;
- états réels, pas de faux KPI ;
- aucune donnée secrète.

---

# Priorité de génération des images

```text
P0 UI
M01 Login
M02 MFA
M18 Context Selector
M22 Forbidden
M23 Session Expired

P1 Admin
M05 IAM Overview
M06 Users
M07 User Detail
M09 Memberships
M10 Roles
M11 Role Editor
M14 Sessions
M16 MFA Management
M19 Security Events
M20 Audit

P2
M08 Create User
M12 Permission Registry
M13 Organizations/Sites
M17 MFA Enrollment
M21 Policies
M24 Temporary Lock
M25 Mobile
```
