import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Application } from '../entities/application.entity';
import { ApplicationVersion } from '../entities/application-version.entity';
import { ValidationResult, ValidationCheck } from './dto/validation-result.dto';
import { ApplicationStatus, ApplicationVersionStatus } from '../../../common/enums';

@Injectable()
export class ValidationService {
  private readonly applicationRepository: Repository<Application>;
  private readonly versionRepository: Repository<ApplicationVersion>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.applicationRepository = this.dataSource.getRepository(Application);
    this.versionRepository = this.dataSource.getRepository(ApplicationVersion);
  }

  async validate(applicationId: string, versionId: string): Promise<ValidationResult> {
    const checks: ValidationCheck[] = [];
    let hasError = false;

    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application) {
      checks.push({
        code: 'APP_EXISTS',
        status: 'FAIL',
        message: `Application with id "${applicationId}" not found`,
      });
      hasError = true;
    } else {
      checks.push({
        code: 'APP_EXISTS',
        status: 'PASS',
        message: 'Application exists',
      });

      if (application.status === ApplicationStatus.ARCHIVED) {
        checks.push({
          code: 'APP_NOT_ARCHIVED',
          status: 'FAIL',
          message: 'Application is archived',
        });
        hasError = true;
      } else {
        checks.push({
          code: 'APP_NOT_ARCHIVED',
          status: 'PASS',
          message: 'Application is not archived',
        });
      }
    }

    const version = await this.versionRepository.findOne({ where: { id: versionId } });
    if (!version) {
      checks.push({
        code: 'VERSION_EXISTS',
        status: 'FAIL',
        message: `Version with id "${versionId}" not found`,
      });
      hasError = true;
    } else {
      checks.push({
        code: 'VERSION_EXISTS',
        status: 'PASS',
        message: 'Version exists',
      });

      const versionNumberRegex = /^\d+\.\d+\.\d+$/;
      if (!versionNumberRegex.test(version.versionNumber)) {
        checks.push({
          code: 'VERSION_NUMBER_VALID',
          status: 'FAIL',
          message: 'Version number must be in format MAJOR.MINOR.PATCH',
        });
        hasError = true;
      } else {
        checks.push({
          code: 'VERSION_NUMBER_VALID',
          status: 'PASS',
          message: 'Version number format is valid',
        });
      }

      if (!application) {
        checks.push({
          code: 'APP_METADATA_VALID',
          status: 'FAIL',
          message: 'Application metadata validation skipped',
        });
        hasError = true;
      } else {
        const metadataErrors: string[] = [];
        if (!application.name) {
          metadataErrors.push('Name is required');
        }
        if (!application.code) {
          metadataErrors.push('Code is required');
        }
        if (metadataErrors.length > 0) {
          checks.push({
            code: 'APP_METADATA_VALID',
            status: 'FAIL',
            message: `Invalid metadata: ${metadataErrors.join(', ')}`,
          });
          hasError = true;
        } else {
          checks.push({
            code: 'APP_METADATA_VALID',
            status: 'PASS',
            message: 'Application metadata is valid',
          });
        }
      }

      if (hasError) {
        checks.push({
          code: 'NO_CRITICAL_ERROR',
          status: 'FAIL',
          message: 'Critical errors found, cannot publish',
        });
      } else {
        checks.push({
          code: 'NO_CRITICAL_ERROR',
          status: 'PASS',
          message: 'No critical errors found',
        });
      }

      if (application && version.status === ApplicationVersionStatus.DRAFT) {
        checks.push({
          code: 'STATUS_PUBLISHABLE',
          status: 'WARNING',
          message: 'Version is in DRAFT status, consider READY or TESTING',
        });
      } else if (application && version.status === ApplicationVersionStatus.PUBLISHED) {
        checks.push({
          code: 'STATUS_PUBLISHABLE',
          status: 'FAIL',
          message: 'Version is already published',
        });
        hasError = true;
      } else {
        checks.push({
          code: 'STATUS_PUBLISHABLE',
          status: 'PASS',
          message: 'Version status is publishable',
        });
      }
    }

    const passed = !hasError;

    return {
      passed,
      checks,
      summary: {
        total: checks.length,
        passed: checks.filter((c) => c.status === 'PASS').length,
        warnings: checks.filter((c) => c.status === 'WARNING').length,
        failed: checks.filter((c) => c.status === 'FAIL').length,
      },
      canPublish: passed,
      timestamp: new Date().toISOString(),
    };
  }
}