-- Phase 10 — External Resource Links (additive only)
--
-- PrÃ©serve la correspondance local ID <-> external ERP ID pour les
-- ressources crÃ©Ã©es/synchronisÃ©es vers Dolibarr (CDC §15/§25, RG-INT-027).
-- L'identitÃ© Techzone n'est jamais remplacÃ©e par l'ID Dolibarr.
--
-- Aucune table/migration existante n'est modifiÃ©e.
-- Conventions baseline_v2 : id text (UUID gÃ©nÃ©rÃ© cÃ´tÃ© client Prisma),
-- timestamps timestamp(3) without time zone.

CREATE TABLE business_manager.external_resource_links (
    id text NOT NULL,
    "tenantId" uuid NOT NULL,
    "connectorId" text NOT NULL,
    "resourceType" varchar(100) NOT NULL,
    "localId" varchar(100) NOT NULL,
    "externalId" varchar(100) NOT NULL,
    "externalRef" varchar(100),
    "last_synced_at" timestamp(3) without time zone,
    metadata jsonb,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL
);

-- PK
ALTER TABLE ONLY business_manager.external_resource_links
    ADD CONSTRAINT external_resource_links_pkey PRIMARY KEY (id);

-- Unique : un lien local par (tenant, connecteur, type de ressource, id local)
CREATE UNIQUE INDEX external_resource_links_tenant_connector_resource_local_key
    ON business_manager.external_resource_links ("tenantId", "connectorId", "resourceType", "localId");

CREATE INDEX external_resource_links_tenantId_idx
    ON business_manager.external_resource_links ("tenantId");

CREATE INDEX external_resource_links_tenantId_resourceType_idx
    ON business_manager.external_resource_links ("tenantId", "resourceType");

CREATE INDEX external_resource_links_connectorId_idx
    ON business_manager.external_resource_links ("connectorId");

-- FK vers erp_registry(id) : suppression du connecteur -> suppression des liens
ALTER TABLE ONLY business_manager.external_resource_links
    ADD CONSTRAINT external_resource_links_connectorId_fkey
    FOREIGN KEY ("connectorId") REFERENCES business_manager.erp_registry(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
