/**
 * UI Builder — service (UI-BUILDER CDC V1).
 *
 * Responsabilités :
 *  - CRUD Pages (isolation tenant systématique, même pattern que DataModelService BM) ;
 *  - UI Definition (assemblage déclaratif versionné par Application Version) ;
 *  - Validation Engine (ERROR/WARNING/INFO : bindings BM, actions allowlist, routes) ;
 *  - Theme tokens (upsert par application version) ;
 *  - Audit via AuditEvent (table plateforme existante).
 *
 * Sécurité : aucune eval, aucune expression libre. Le lock de version empêche
 * la modification silencieuse d'une version publiée/active.
 */
import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformErrorCode } from '../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../common/errors/platform.exception';
import type {
  CreateUiPageDto,
  ReorderUiPagesDto,
  UpdateUiPageDto,
  UpsertUiThemeDto,
} from './dto/ui-page.dto';
import { UI_ACTION_TYPES } from './dto/ui-page.dto';

const RENDERABLE_COMPONENTS = new Set([
  'Container', 'Section', 'Card', 'Grid', 'Stack', 'Heading', 'Text',
  'Input', 'Textarea', 'Select', 'Checkbox', 'DatePicker', 'FormField',
  'Form', 'DataTable', 'Badge', 'Alert', 'Image', 'Link', 'Tabs', 'Spinner', 'Button',
]);
const ACTION_TYPES = new Set<string>(UI_ACTION_TYPES);

/** Statuts de version éditables via le UI Builder (CDC §10). */
const EDITABLE_VERSION_STATUSES = new Set(['DRAFT', 'CONFIGURING', 'VALIDATING']);

/** Context bindings supportés (allowlist, CDC §6). */
const CONTEXT_KEYS = new Set(['currentUser', 'currentTenant', 'currentApplication']);

type OverviewProgression = { status: 'TODO' | 'IN_PROGRESS' | 'READY'; detail: string };

@Injectable()
export class UiBuilderService {
  private readonly logger = new Logger(UiBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =====================================================================
  // VERSION RESOLUTION + LOCK
  // =====================================================================

  private async ensureVersion(applicationVersionId: string, tenantId: string | null) {
    const version = await this.prisma.applicationVersion.findFirst({
      where: { id: applicationVersionId, tenantId: tenantId ?? undefined },
    });
    if (!version) {
      throw new PlatformException(
        PlatformErrorCode.VERSION_NOT_FOUND,
        `Application version "${applicationVersionId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return version;
  }

  private async ensureVersionEditable(applicationVersionId: string, tenantId: string | null) {
    const version = await this.ensureVersion(applicationVersionId, tenantId);
    if (!EDITABLE_VERSION_STATUSES.has(version.status)) {
      throw new PlatformException(
        PlatformErrorCode.UI_VERSION_LOCKED,
        `Application version "${version.version}" is ${version.status} and cannot be modified by the UI Builder`,
        HttpStatus.CONFLICT,
      );
    }
    return version;
  }

  // =====================================================================
  // PAGES — CRUD
  // =====================================================================

  async listPages(applicationVersionId: string, tenantId: string | null) {
    await this.ensureVersion(applicationVersionId, tenantId);
    return this.prisma.uiPage.findMany({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createPage(dto: CreateUiPageDto, tenantId: string | null, userId: string) {
    await this.ensureVersionEditable(dto.applicationVersionId, tenantId);

    const version = await this.ensureVersion(dto.applicationVersionId, tenantId);
    const key = dto.key.trim().toLowerCase();

    const duplicateKey = await this.prisma.uiPage.findFirst({
      where: { applicationVersionId: dto.applicationVersionId, key, tenantId: tenantId ?? undefined },
    });
    if (duplicateKey) {
      throw new PlatformException(
        PlatformErrorCode.UI_PAGE_KEY_EXISTS,
        `A page with key "${key}" already exists for this application version`,
        HttpStatus.CONFLICT,
      );
    }

    const duplicateRoute = await this.prisma.uiPage.findFirst({
      where: { applicationVersionId: dto.applicationVersionId, route: dto.route, tenantId: tenantId ?? undefined },
    });
    if (duplicateRoute) {
      throw new PlatformException(
        PlatformErrorCode.UI_PAGE_ROUTE_EXISTS,
        `A page with route "${dto.route}" already exists for this application version`,
        HttpStatus.CONFLICT,
      );
    }

    const page = await this.prisma.uiPage.create({
      data: {
        applicationId: version.applicationId,
        applicationVersionId: dto.applicationVersionId,
        key,
        route: dto.route,
        title: dto.title,
        description: dto.description,
        type: (dto.type as never) ?? 'CUSTOM',
        layout: (dto.layout as never) ?? 'SIDEBAR',
        visibility: (dto.visibility as never) ?? 'ALWAYS',
        order: dto.order ?? 0,
        permissions: (dto.permissions ?? []) as unknown as Prisma.InputJsonValue,
        components: (dto.components ?? { root: 'root', nodes: { root: { id: 'root', type: 'Container', props: {}, children: [] } } }) as unknown as Prisma.InputJsonValue,
        metadata: (dto.metadata ?? {}) as unknown as Prisma.InputJsonValue,
        tenantId,
      },
    });

    await this.audit(tenantId, userId, 'ui.page.created', 'UiPage', page.id, { key: page.key, route: page.route });
    return page;
  }

  async updatePage(pageId: string, dto: UpdateUiPageDto, tenantId: string | null, userId: string) {
    const existing = await this.getPageOwned(pageId, tenantId);
    await this.ensureVersionEditable(existing.applicationVersionId, tenantId);

    if (dto.key && dto.key !== existing.key) {
      const duplicateKey = await this.prisma.uiPage.findFirst({
        where: {
          applicationVersionId: existing.applicationVersionId,
          key: dto.key,
          id: { not: pageId },
          tenantId: tenantId ?? undefined,
        },
      });
      if (duplicateKey) {
        throw new PlatformException(
          PlatformErrorCode.UI_PAGE_KEY_EXISTS,
          `A page with key "${dto.key}" already exists for this application version`,
          HttpStatus.CONFLICT,
        );
      }
    }

    if (dto.route && dto.route !== existing.route) {
      const duplicateRoute = await this.prisma.uiPage.findFirst({
        where: {
          applicationVersionId: existing.applicationVersionId,
          route: dto.route,
          id: { not: pageId },
          tenantId: tenantId ?? undefined,
        },
      });
      if (duplicateRoute) {
        throw new PlatformException(
          PlatformErrorCode.UI_PAGE_ROUTE_EXISTS,
          `A page with route "${dto.route}" already exists for this application version`,
          HttpStatus.CONFLICT,
        );
      }
    }

    const page = await this.prisma.uiPage.update({
      where: { id: pageId },
      data: {
        key: dto.key,
        route: dto.route,
        title: dto.title,
        description: dto.description,
        type: dto.type as never,
        layout: dto.layout as never,
        visibility: dto.visibility as never,
        order: dto.order,
        permissions: dto.permissions,
        components: dto.components as never,
        metadata: dto.metadata as never,
      },
    });

    await this.audit(tenantId, userId, 'ui.page.updated', 'UiPage', page.id, { key: page.key });
    return page;
  }

  async deletePage(pageId: string, tenantId: string | null, userId: string) {
    const existing = await this.getPageOwned(pageId, tenantId);
    await this.ensureVersionEditable(existing.applicationVersionId, tenantId);

    await this.prisma.uiPage.delete({ where: { id: pageId } });
    await this.audit(tenantId, userId, 'ui.page.deleted', 'UiPage', pageId, { key: existing.key });
    return { deleted: true, id: pageId };
  }

  async reorderPages(applicationVersionId: string, dto: ReorderUiPagesDto, tenantId: string | null, userId: string) {
    await this.ensureVersionEditable(applicationVersionId, tenantId);
    const pages = await this.prisma.uiPage.findMany({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
    });
    const owned = new Set(pages.map((p) => p.id));
    if (!dto.pageIds.every((id) => owned.has(id))) {
      throw new PlatformException(
        PlatformErrorCode.UI_PAGE_NOT_FOUND,
        'Reorder contains pages outside this application version / tenant',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.$transaction(
      dto.pageIds.map((id, index) =>
        this.prisma.uiPage.update({ where: { id }, data: { order: index } }),
      ),
    );
    await this.audit(tenantId, userId, 'ui.pages.reordered', 'UiPage', applicationVersionId, { count: dto.pageIds.length });
    return this.listPages(applicationVersionId, tenantId);
  }

  private async getPageOwned(pageId: string, tenantId: string | null) {
    const page = await this.prisma.uiPage.findFirst({
      where: { id: pageId, tenantId: tenantId ?? undefined },
    });
    if (!page) {
      throw new PlatformException(
        PlatformErrorCode.UI_PAGE_NOT_FOUND,
        `UI page "${pageId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return page;
  }

  async getPage(pageId: string, tenantId: string | null) {
    return this.getPageOwned(pageId, tenantId);
  }

  // =====================================================================
  // UI DEFINITION (assemblage déclaratif — CDC §4)
  // =====================================================================

  async getUiDefinition(applicationVersionId: string, tenantId: string | null) {
    const version = await this.ensureVersion(applicationVersionId, tenantId);
    const [pages, theme, businessContext] = await Promise.all([
      this.listPages(applicationVersionId, tenantId),
      this.getTheme(applicationVersionId, tenantId).catch(() => null),
      this.getBusinessContext(applicationVersionId, tenantId),
    ]);

    const navigationItems = pages
      .filter((p) => p.visibility !== 'HIDDEN')
      .sort((a, b) => a.order - b.order)
      .map((p) => ({
        id: p.key,
        label: p.title,
        pageKey: p.key,
        route: p.route,
        icon: (p.metadata as Record<string, unknown> | null)?.icon ?? null,
        order: p.order,
        visibility: p.visibility,
      }));

    return {
      schemaVersion: '1.1',
      projectId: applicationVersionId,
      applicationId: pages[0]?.applicationId ?? null,
      applicationVersionId,
      businessContext,
      theme: theme?.tokens ?? null,
      navigation: { items: navigationItems },
      pages: pages.map((p) => ({
        id: p.id,
        key: p.key,
        route: p.route,
        title: p.title,
        description: p.description,
        type: p.type,
        layout: p.layout,
        visibility: p.visibility,
        order: p.order,
        permissions: p.permissions ?? [],
        components: p.components ?? { root: 'root', nodes: {} },
        metadata: p.metadata ?? {},
        updatedAt: p.updatedAt.toISOString(),
      })),
      dataSources: pages.flatMap((p) => Object.values(((p.components ?? {}) as { nodes?: Record<string, { bindings?: Record<string, { kind?: string; entity?: string }> }> }).nodes ?? {}))
        .flatMap((node) => Object.values(node.bindings ?? {}))
        .filter((binding) => binding.kind === 'ENTITY_FIELD' || binding.kind === 'ENTITY_LIST')
        .map((binding) => ({ kind: 'DATA_RUNTIME', resource: binding.entity }))
        .filter((source, index, sources) => source.resource && sources.findIndex((candidate) => candidate.resource === source.resource) === index),
      requiredPermissions: [...new Set(pages.flatMap((p) => (Array.isArray(p.permissions) ? p.permissions : [])))].sort(),
      capabilities: ['data-runtime:query', 'data-runtime:execute'],
      // This is a versioned contract, not a request timestamp. Stable timestamps
      // and JSON-native dates keep pre/post-persistence hashes identical.
      metadata: { pageCount: pages.length, versionStatus: version.status, generatedAt: new Date(Math.max(0, ...pages.map(p => p.updatedAt.getTime()), theme?.updatedAt?.getTime() ?? 0)).toISOString() },
    };
  }

  // =====================================================================
  // VALIDATION ENGINE (CDC §11)
  // =====================================================================

  async validate(applicationVersionId: string, tenantId: string | null, userId?: string) {
    await this.ensureVersion(applicationVersionId, tenantId);

    const [pages, entities] = await Promise.all([
      this.prisma.uiPage.findMany({
        where: { applicationVersionId, tenantId: tenantId ?? undefined },
        orderBy: [{ order: 'asc' }],
      }),
      this.prisma.bmEntity.findMany({
        where: { applicationVersionId, tenantId: tenantId ?? undefined },
        include: { fields: true },
      }),
    ]);

    const issues: Array<{ level: 'ERROR' | 'WARNING' | 'INFO'; code: string; message: string; pageId?: string; pageKey?: string; componentId?: string }> = [];

    const entityByCode = new Map(entities.map((e) => [e.code, e]));

    // --- Routes / keys ---
    const routeSet = new Map<string, string>();
    const keySet = new Map<string, string>();
    for (const page of pages) {
      if (!page.route?.startsWith('/')) {
        issues.push({ level: 'ERROR', code: 'ROUTE_INVALID', message: `Route invalide : "${page.route}"`, pageId: page.id, pageKey: page.key });
      }
      if (routeSet.has(page.route)) {
        issues.push({ level: 'ERROR', code: 'ROUTE_DUPLICATED', message: `Route dupliquée : "${page.route}" (${routeSet.get(page.route)} / ${page.key})`, pageId: page.id, pageKey: page.key });
      } else {
        routeSet.set(page.route, page.key);
      }
      if (keySet.has(page.key)) {
        issues.push({ level: 'ERROR', code: 'KEY_DUPLICATED', message: `Key dupliquée : "${page.key}"`, pageId: page.id, pageKey: page.key });
      } else {
        keySet.set(page.key, page.key);
      }
    }
    if (pages.length === 0) {
      issues.push({ level: 'WARNING', code: 'NO_PAGES', message: 'Aucune page définie pour cette version.' });
    }

    // --- Composants / bindings / actions ---
    for (const page of pages) {
      const tree = (page.components ?? { root: 'root', nodes: {} }) as {
        root?: string;
        nodes?: Record<string, { id?: string; type?: string; props?: Record<string, unknown>; bindings?: Record<string, unknown>; actions?: Array<{ type?: string; config?: Record<string, unknown> }>; children?: string[] }>;
      };
      const nodes = tree.nodes ?? {};
      const root = tree.root;
      if (root && !nodes[root]) {
        issues.push({ level: 'ERROR', code: 'ROOT_MISSING', message: `Racine manquante dans l'arbre de composants.`, pageId: page.id, pageKey: page.key });
      }
      const nodeIds = new Set(Object.keys(nodes));
      for (const [nodeId, node] of Object.entries(nodes)) {
        if (!node?.type) {
          issues.push({ level: 'ERROR', code: 'COMPONENT_TYPE_MISSING', message: `Composant sans type.`, pageId: page.id, pageKey: page.key, componentId: nodeId });
          continue;
        }
        if (!RENDERABLE_COMPONENTS.has(node.type)) {
          issues.push({ level: 'ERROR', code: 'COMPONENT_UNKNOWN', message: `Composant non pris en charge par le renderer : "${node.type}".`, pageId: page.id, pageKey: page.key, componentId: nodeId });
        }
        // Bindings
        for (const [prop, binding] of Object.entries(node.bindings ?? {})) {
          const b = binding as { kind?: string; entity?: string; field?: string; context?: string; variable?: string };
          if (!b?.kind) {
            issues.push({ level: 'ERROR', code: 'BINDING_INVALID', message: `Binding invalide sur "${prop}".`, pageId: page.id, pageKey: page.key, componentId: nodeId });
            continue;
          }
          if (b.kind === 'ENTITY_FIELD' || b.kind === 'ENTITY_LIST') {
            const entity = b.entity ? entityByCode.get(b.entity) : undefined;
            if (!entity) {
              issues.push({ level: 'ERROR', code: 'ENTITY_UNKNOWN', message: `Entité inconnue "${b.entity}" (binding "${prop}").`, pageId: page.id, pageKey: page.key, componentId: nodeId });
            } else if (b.kind === 'ENTITY_FIELD' && b.field && !entity.fields.some((f) => f.code === b.field)) {
              issues.push({ level: 'ERROR', code: 'FIELD_UNKNOWN', message: `Champ inconnu "${b.entity}.${b.field}" (binding "${prop}").`, pageId: page.id, pageKey: page.key, componentId: nodeId });
            }
          } else if (b.kind === 'CONTEXT') {
            if (!b.context || !CONTEXT_KEYS.has(b.context)) {
              issues.push({ level: 'ERROR', code: 'BINDING_INVALID', message: `Contexte inconnu "${b.context}" (binding "${prop}").`, pageId: page.id, pageKey: page.key, componentId: nodeId });
            }
          } else if (b.kind === 'VARIABLE') {
            if (!b.variable) {
              issues.push({ level: 'ERROR', code: 'BINDING_INVALID', message: `Variable manquante (binding "${prop}").`, pageId: page.id, pageKey: page.key, componentId: nodeId });
            }
          }
        }
        // Actions
        for (const action of node.actions ?? []) {
          if (!action?.type) {
            issues.push({ level: 'ERROR', code: 'ACTION_INVALID', message: `Action sans type.`, pageId: page.id, pageKey: page.key, componentId: nodeId });
            continue;
          }
          if (!ACTION_TYPES.has(action.type)) {
            issues.push({ level: 'ERROR', code: 'ACTION_UNKNOWN', message: `Action non prise en charge : "${action.type}".`, pageId: page.id, pageKey: page.key, componentId: nodeId });
            continue;
          }
          if (action.type === 'NAVIGATE') {
            const route = (action.config as { route?: unknown } | undefined)?.route;
            if (typeof route !== 'string' || !route.startsWith('/') || route.includes('javascript:')) {
              issues.push({ level: 'ERROR', code: 'ACTION_INVALID', message: `NAVIGATE: route interne requise.`, pageId: page.id, pageKey: page.key, componentId: nodeId });
            }
          }
          if (action.type === 'TRIGGER_AUTOMATION') {
            const code = (action.config as { workflowCode?: unknown } | undefined)?.workflowCode;
            if (typeof code !== 'string' || !code) {
              issues.push({ level: 'ERROR', code: 'ACTION_INVALID', message: `TRIGGER_AUTOMATION: workflowCode requis.`, pageId: page.id, pageKey: page.key, componentId: nodeId });
            }
          }
          if (['CREATE_RECORD', 'UPDATE_RECORD', 'DELETE_RECORD'].includes(action.type)) {
            const resource = (action.config as { resource?: unknown } | undefined)?.resource;
            if (typeof resource !== 'string' || !resource) {
              issues.push({ level: 'ERROR', code: 'ACTION_INVALID', message: `${action.type}: ressource Data Runtime requise.`, pageId: page.id, pageKey: page.key, componentId: nodeId });
            }
          }
        }
        // Children references
        for (const child of node.children ?? []) {
          if (!nodeIds.has(child)) {
            issues.push({ level: 'ERROR', code: 'REFERENCE_BROKEN', message: `Référence enfant cassée "${child}".`, pageId: page.id, pageKey: page.key, componentId: nodeId });
          }
        }
      }
    }

    const errors = issues.filter((i) => i.level === 'ERROR').length;
    const warnings = issues.filter((i) => i.level === 'WARNING').length;
    const result = {
      applicationVersionId,
      status: errors > 0 ? 'INVALID' : warnings > 0 ? 'VALID_WITH_WARNINGS' : 'VALID',
      counts: { errors, warnings, infos: issues.length - errors - warnings },
      issues,
      checkedAt: new Date().toISOString(),
      pageIds: pages.map((p) => p.id),
    };
    if (userId) {
      await this.audit(tenantId, userId, 'ui.definition.validated', 'ApplicationVersion', applicationVersionId, {
        status: result.status,
        errors,
        warnings,
      });
    }
    return result;
  }

  // =====================================================================
  // THEME (CDC §12 mission / §24)
  // =====================================================================

  async getTheme(applicationVersionId: string, tenantId: string | null) {
    const theme = await this.prisma.uiThemeSetting.findFirst({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
    });
    if (!theme) {
      throw new PlatformException(
        PlatformErrorCode.UI_THEME_NOT_FOUND,
        'No UI theme configured for this application version',
        HttpStatus.NOT_FOUND,
      );
    }
    return theme;
  }

  async upsertTheme(dto: UpsertUiThemeDto, tenantId: string | null, userId: string) {
    await this.ensureVersionEditable(dto.applicationVersionId, tenantId);
    const version = await this.ensureVersion(dto.applicationVersionId, tenantId);

    const existing = await this.prisma.uiThemeSetting.findFirst({
      where: { applicationVersionId: dto.applicationVersionId, tenantId: tenantId ?? undefined },
    });

    const theme = existing
      ? await this.prisma.uiThemeSetting.update({
          where: { id: existing.id },
          data: { tokens: dto.tokens as never, revision: { increment: 1 } },
        })
      : await this.prisma.uiThemeSetting.create({
          data: {
            applicationId: version.applicationId,
            applicationVersionId: dto.applicationVersionId,
            tokens: dto.tokens as never,
            tenantId,
          },
        });

    await this.audit(tenantId, userId, 'ui.theme.changed', 'UiThemeSetting', theme.id, { revision: theme.revision });
    return theme;
  }

  // =====================================================================
  // BUSINESS CONTEXT — Business Entities/Fields pour bindings & forms (CDC §6)
  // BM reste propriétaire ; le UI Builder ne fait que référencer.
  // =====================================================================

  async getBusinessContext(applicationVersionId: string, tenantId: string | null) {
    await this.ensureVersion(applicationVersionId, tenantId);
    const entities = await this.prisma.bmEntity.findMany({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
      include: { fields: { orderBy: { position: 'asc' }, include: { validations: true } } },
      orderBy: { code: 'asc' },
    });
    const relations = await this.prisma.bmRelation.findMany({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
    });
    return {
      applicationVersionId,
      entities: entities.map((entity) => ({
        id: entity.id,
        code: entity.code,
        name: entity.name,
        status: entity.status,
        fields: entity.fields.map((field) => ({
          id: field.id,
          code: field.code,
          label: field.label ?? field.code,
          type: field.type,
          required: field.required,
          readonly: field.readonly,
          defaultValue: field.defaultValue,
          options: field.validations.find(v => v.validationType === 'ALLOWED_VALUES')?.value?.split(',').map(value => value.trim()) ?? [],
          relationTarget: entities.find(target => target.id === relations.find(relation => relation.sourceEntityId === entity.id && relation.code === field.code)?.targetEntityId)?.code ?? null,
        })),
      })),
    };
  }

  // =====================================================================
  // OVERVIEW (données réelles uniquement)
  //
  // Alimente le dashboard UI Builder (mission) : KPI, progression, pages
  // récentes, validation. Aucun compteur ni pourcentage fabriqué : chaque
  // valeur est dérivée des lignes lues (UiPage / UiThemeSetting / validation).
  //
  // « UiProject » : le contrat CDC V1 n'a pas de table séparée — le projet UI
  // est la définition assemblée par ApplicationVersion (pages + thème). Il est
  // donc résolu en lecture seule ici ; aucune écriture ni duplication à chaque
  // chargement.
  // =====================================================================

  async getOverview(applicationVersionId: string, tenantId: string | null) {
    const version = await this.ensureVersion(applicationVersionId, tenantId);
    const application = await this.prisma.application.findFirst({
      where: { id: version.applicationId, tenantId: tenantId ?? undefined },
    });
    const [pages, theme, validation] = await Promise.all([
      this.listPages(applicationVersionId, tenantId),
      this.getTheme(applicationVersionId, tenantId).catch(() => null),
      this.validate(applicationVersionId, tenantId),
    ]);

    const trees = pages.map((page) => {
      const tree = (page.components ?? { root: 'root', nodes: {} }) as {
        root?: string;
        nodes?: Record<string, { bindings?: Record<string, unknown> }>;
      };
      return { page, nodes: tree.nodes ?? {} };
    });

    const componentCount = trees.reduce((acc, { nodes }) => acc + Object.keys(nodes).length, 0);
    const bindingCount = trees.reduce(
      (acc, { nodes }) => acc + Object.values(nodes).reduce((sum, node) => sum + Object.keys(node.bindings ?? {}).length, 0),
      0,
    );
    const filledPages = trees.filter(({ nodes }) => Object.keys(nodes).length > 1).length;
    const navigationItems = pages.filter((page) => page.visibility !== 'HIDDEN').length;

    const themeTokens = (theme?.tokens ?? null) as Record<string, unknown> | null;
    const breakpoints = (themeTokens?.breakpoints ?? null) as { tablet?: unknown; mobile?: unknown } | null;
    const responsiveConfigured = Boolean(breakpoints?.tablet && breakpoints?.mobile);

    const lastSavedAt = [
      ...pages.map((page) => page.updatedAt.getTime()),
      ...(theme ? [theme.updatedAt.getTime()] : []),
    ].reduce<number | null>((latest, candidate) => (latest === null || candidate > latest ? candidate : latest), null);

    const counts = {
      pages: pages.length,
      components: componentCount,
      forms: pages.filter((page) => page.type === 'FORM').length,
      bindings: bindingCount,
      navigationItems,
      hiddenPages: pages.length - navigationItems,
      errors: validation.counts.errors,
      warnings: validation.counts.warnings,
    };

    return {
      application: application
        ? { id: application.id, name: application.name, code: application.code }
        : { id: version.applicationId, name: null, code: null },
      applicationVersion: {
        id: version.id,
        version: version.version,
        status: version.status,
        editable: EDITABLE_VERSION_STATUSES.has(version.status),
      },
      uiProject: {
        applicationVersionId,
        source: 'UI_PAGES_AND_THEME',
        resolved: true,
        pageCount: pages.length,
        hasTheme: Boolean(theme),
        themeRevision: theme?.revision ?? null,
        generatedAt: new Date().toISOString(),
      },
      counts,
      themeConfigured: Boolean(theme),
      lastSavedAt: lastSavedAt === null ? null : new Date(lastSavedAt).toISOString(),
      progression: this.buildProgression({
        pageCount: pages.length,
        filledPages,
        bindingCount,
        navigationItems,
        themeConfigured: Boolean(theme),
        responsiveConfigured,
        validationStatus: validation.status as string,
        errors: validation.counts.errors,
        warnings: validation.counts.warnings,
      }),
      validation: {
        status: validation.status,
        counts: validation.counts,
        checkedAt: validation.checkedAt,
        issues: validation.issues.slice(0, 50),
        truncated: validation.issues.length > 50,
      },
      lastPages: trees
        .slice()
        .sort((a, b) => b.page.updatedAt.getTime() - a.page.updatedAt.getTime())
        .slice(0, 5)
        .map(({ page, nodes }) => ({
          id: page.id,
          key: page.key,
          title: page.title,
          type: page.type,
          status: page.status,
          route: page.route,
          visibility: page.visibility,
          updatedAt: page.updatedAt,
          components: Object.keys(nodes).length,
          bindings: Object.values(nodes).reduce((sum, node) => sum + Object.keys(node.bindings ?? {}).length, 0),
        })),
    };
  }

  /**
   * Progression de la conception : états dérivés des données réelles
   * (TODO / IN_PROGRESS / READY). Aucun pourcentage arbitraire.
   */
  private buildProgression(input: {
    pageCount: number;
    filledPages: number;
    bindingCount: number;
    navigationItems: number;
    themeConfigured: boolean;
    responsiveConfigured: boolean;
    validationStatus: string;
    errors: number;
    warnings: number;
  }) {
    const pages: OverviewProgression = input.pageCount === 0
      ? { status: 'TODO', detail: 'Aucune page' }
      : input.filledPages === input.pageCount
        ? { status: 'READY', detail: `${input.pageCount} page(s) renseignée(s)` }
        : { status: 'IN_PROGRESS', detail: `${input.filledPages}/${input.pageCount} page(s) avec composants` };

    const bindings: OverviewProgression = input.bindingCount === 0
      ? { status: 'TODO', detail: 'Aucun binding Data Runtime' }
      : input.errors > 0
        ? { status: 'IN_PROGRESS', detail: `${input.bindingCount} binding(s), erreurs à corriger` }
        : { status: 'READY', detail: `${input.bindingCount} binding(s)` };

    const navigation: OverviewProgression = input.pageCount === 0
      ? { status: 'TODO', detail: 'Aucune entrée de navigation' }
      : input.navigationItems >= 2
        ? { status: 'READY', detail: `${input.navigationItems} entrée(s) visible(s)` }
        : { status: 'IN_PROGRESS', detail: `${input.navigationItems} entrée(s) visible(s)` };

    const theme: OverviewProgression = input.themeConfigured
      ? { status: 'READY', detail: 'Design tokens enregistrés' }
      : { status: 'TODO', detail: 'Aucun thème enregistré' };

    const responsive: OverviewProgression = input.responsiveConfigured
      ? { status: 'READY', detail: 'Breakpoints tablette et mobile définis' }
      : input.themeConfigured
        ? { status: 'IN_PROGRESS', detail: 'Breakpoints manquants' }
        : { status: 'TODO', detail: 'Dépend des design tokens' };

    const validation: OverviewProgression = input.errors > 0
      ? { status: 'IN_PROGRESS', detail: `${input.errors} erreur(s) bloquante(s)` }
      : input.warnings > 0
        ? { status: 'IN_PROGRESS', detail: `${input.warnings} avertissement(s)` }
        : input.pageCount === 0
          ? { status: 'TODO', detail: 'Rien à valider' }
          : { status: 'READY', detail: 'Aucun problème détecté' };

    return [
      { id: 'pages', label: 'Pages', ...pages },
      { id: 'bindings', label: 'Bindings', ...bindings },
      { id: 'navigation', label: 'Navigation', ...navigation },
      { id: 'theme', label: 'Thème', ...theme },
      { id: 'responsive', label: 'Responsive', ...responsive },
      { id: 'validation', label: 'Validation', ...validation, checkedStatus: input.validationStatus },
    ];
  }

  // =====================================================================
  // AUDIT (réutilise AuditEvent — CDC §13)
  // =====================================================================

  private async audit(tenantId: string | null, actorId: string, action: string, targetType: string, targetId: string, metadata: Record<string, unknown>) {
    try {
      await this.prisma.auditEvent.create({
        data: {
          traceId: `ui-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          actorId,
          tenantId,
          action,
          targetType,
          targetId,
          result: 'SUCCESS',
          metadata: metadata as never,
        },
      });
    } catch (error) {
      this.logger.warn(`Audit non bloquant en échec: ${action} (${String(error)})`);
    }
  }
}
