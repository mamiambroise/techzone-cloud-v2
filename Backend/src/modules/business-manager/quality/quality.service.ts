import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApplicationVersion } from '../entities/application-version.entity';
import { QualityIssue } from '../entities/quality-issue.entity';
import { QualityWaiver } from '../entities/quality-waiver.entity';
import { ValidationCampaign } from '../entities/validation-campaign.entity';
import { DataModelService } from '../data-model/data-model.service';
import { FeatureCapabilityService } from '../feature-capability/feature-capability.service';
import { MenuService } from '../menus/menu.service';
import { ConfigurationService } from '../configuration/configuration.service';
import { RuntimeBridgeService } from '../runtime/runtime-bridge.service';

type Issue = { severity: string; code: string; message?: string; target?: string; dependency?: string; blocking?: boolean };
@Injectable()
export class QualityService {
  constructor(@InjectDataSource() private readonly db: DataSource, private readonly dataModel: DataModelService, private readonly features: FeatureCapabilityService, private readonly menus: MenuService, private readonly configuration: ConfigurationService, private readonly runtime: RuntimeBridgeService) {}
  async run(applicationVersionId: string, mode = 'STANDARD', createdBy?: string) {
    const version = await this.db.getRepository(ApplicationVersion).findOne({ where: { id: applicationVersionId } }); if (!version) throw new NotFoundException('VERSION_NOT_FOUND');
    const campaign = await this.db.getRepository(ValidationCampaign).save({ applicationId: version.applicationId, applicationVersionId, mode, status: 'RUNNING', createdBy });
    const collected: Array<{ validator: string; issue: Issue }> = [];
    const models = await this.dataModel.findByVersion(version.applicationId, applicationVersionId);
    for (const model of models) { const result = await this.dataModel.validateSchema(model.id); result.issues.forEach((issue: Issue) => collected.push({ validator: 'data-model', issue })); }
    const [featureResult, navigationResult, configResult, runtimeResult] = await Promise.all([this.features.validateVersion(applicationVersionId), this.menus.validate(applicationVersionId), this.configuration.validate(applicationVersionId), this.runtime.readiness(applicationVersionId)]);
    featureResult.issues.forEach(issue => collected.push({ validator: 'features', issue })); navigationResult.issues.forEach(issue => collected.push({ validator: 'navigation', issue })); configResult.issues.forEach(issue => collected.push({ validator: 'configuration', issue })); runtimeResult.issues.forEach(issue => collected.push({ validator: 'runtime', issue }));
    const waivers = await this.activeWaivers(applicationVersionId); const persisted = collected.map(({ validator, issue }) => ({ campaignId: campaign.id, validator, code: issue.code, severity: issue.severity, blocking: issue.blocking ?? (issue.severity === 'ERROR' || issue.severity === 'CRITICAL'), message: issue.message ?? issue.code, targetId: issue.target ?? issue.dependency })); const issues = persisted.map(i => ({ ...i, waived: waivers.has(i.code) })); if (persisted.length) await this.db.getRepository(QualityIssue).save(persisted); const blocking = issues.filter(i => i.blocking && !i.waived); const score = Math.max(0, 100 - blocking.length * 25 - issues.filter(i => i.severity === 'WARNING' && !i.waived).length * 5); const status = blocking.length ? 'FAILED' : issues.length ? 'WARNING' : 'PASSED'; const summary = { score, status, errors: issues.filter(i => i.severity === 'ERROR').length, warnings: issues.filter(i => i.severity === 'WARNING').length, blocking: blocking.length }; await this.db.getRepository(ValidationCampaign).save({ ...campaign, status, summary }); return { campaignId: campaign.id, ...summary, issues }; }
  async campaigns(applicationVersionId: string) { return this.db.getRepository(ValidationCampaign).find({ where: { applicationVersionId }, order: { createdAt: 'DESC' } }); }
  async report(campaignId: string) { const campaign = await this.db.getRepository(ValidationCampaign).findOne({ where: { id: campaignId } }); if (!campaign) throw new NotFoundException('VALIDATION_CAMPAIGN_NOT_FOUND'); return { campaign, issues: await this.db.getRepository(QualityIssue).find({ where: { campaignId }, order: { severity: 'ASC', createdAt: 'ASC' } }) }; }
  async gate(applicationVersionId: string) { const latest = await this.db.getRepository(ValidationCampaign).findOne({ where: { applicationVersionId }, order: { createdAt: 'DESC' } }); if (!latest) return { decision: 'FAIL', reason: 'NO_VALIDATION_CAMPAIGN' }; const issues = await this.db.getRepository(QualityIssue).find({ where: { campaignId: latest.id } }); const waivers = await this.activeWaivers(applicationVersionId); const blocking = issues.filter(i => i.blocking && !waivers.has(i.code)); return { decision: blocking.length ? 'FAIL' : latest.status === 'WARNING' ? 'WARNING' : 'PASS', campaignId: latest.id, blocking: blocking.length }; }
  async requestWaiver(applicationVersionId: string, issueCode: string, reason: string, expiresAt?: string) { if (['TENANT_ISOLATION_BREACH', 'SECRET_LEAK', 'AUTHENTICATION_BYPASS'].includes(issueCode)) throw new BadRequestException('WAIVER_FORBIDDEN'); return this.db.getRepository(QualityWaiver).save({ applicationVersionId, issueCode, reason, expiresAt: expiresAt ? new Date(expiresAt) : undefined }); }
  async approveWaiver(id: string, approvedBy: string) { const w = await this.db.getRepository(QualityWaiver).findOne({ where: { id } }); if (!w) throw new NotFoundException('QUALITY_WAIVER_NOT_FOUND'); if (w.status !== 'REQUESTED') throw new ConflictException('QUALITY_WAIVER_NOT_PENDING'); return this.db.getRepository(QualityWaiver).save({ ...w, status: 'APPROVED', approvedBy, approvedAt: new Date() }); }
  private async activeWaivers(versionId: string) { const values = await this.db.getRepository(QualityWaiver).find({ where: { applicationVersionId: versionId, status: 'APPROVED' } }); const now = Date.now(); return new Set(values.filter(x => !x.expiresAt || x.expiresAt.getTime() > now).map(x => x.issueCode)); }
}
