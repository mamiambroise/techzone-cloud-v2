import { ApplicationStatus } from '../../../common/enums';

export class ApplicationDomain {
  static validateCode(code: string): boolean {
    const codeRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return codeRegex.test(code);
  }

  static validateStatusTransition(
    currentStatus: ApplicationStatus,
    targetStatus: ApplicationStatus,
  ): boolean {
    const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.DRAFT]: [
        ApplicationStatus.CONFIGURING,
        ApplicationStatus.ARCHIVED,
      ],
      [ApplicationStatus.CONFIGURING]: [
        ApplicationStatus.READY,
        ApplicationStatus.ARCHIVED,
      ],
      [ApplicationStatus.READY]: [
        ApplicationStatus.TESTING,
        ApplicationStatus.ARCHIVED,
      ],
      [ApplicationStatus.TESTING]: [
        ApplicationStatus.ACTIVE,
        ApplicationStatus.ARCHIVED,
      ],
      [ApplicationStatus.ACTIVE]: [
        ApplicationStatus.SUSPENDED,
        ApplicationStatus.ARCHIVED,
      ],
      [ApplicationStatus.SUSPENDED]: [
        ApplicationStatus.ACTIVE,
        ApplicationStatus.ARCHIVED,
      ],
      [ApplicationStatus.ARCHIVED]: [],
      [ApplicationStatus.ERROR]: [
        ApplicationStatus.DRAFT,
        ApplicationStatus.CONFIGURING,
        ApplicationStatus.READY,
        ApplicationStatus.ARCHIVED,
      ],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  static getAllowedTransitions(
    currentStatus: ApplicationStatus,
  ): ApplicationStatus[] {
    const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.DRAFT]: [
        ApplicationStatus.CONFIGURING,
        ApplicationStatus.ARCHIVED,
      ],
      [ApplicationStatus.CONFIGURING]: [
        ApplicationStatus.READY,
        ApplicationStatus.ARCHIVED,
      ],
      [ApplicationStatus.READY]: [
        ApplicationStatus.TESTING,
        ApplicationStatus.ARCHIVED,
      ],
      [ApplicationStatus.TESTING]: [
        ApplicationStatus.ACTIVE,
        ApplicationStatus.ARCHIVED,
      ],
      [ApplicationStatus.ACTIVE]: [
        ApplicationStatus.SUSPENDED,
        ApplicationStatus.ARCHIVED,
      ],
      [ApplicationStatus.SUSPENDED]: [
        ApplicationStatus.ACTIVE,
        ApplicationStatus.ARCHIVED,
      ],
      [ApplicationStatus.ARCHIVED]: [],
      [ApplicationStatus.ERROR]: [
        ApplicationStatus.DRAFT,
        ApplicationStatus.CONFIGURING,
        ApplicationStatus.READY,
        ApplicationStatus.ARCHIVED,
      ],
    };

    return transitions[currentStatus] || [];
  }

  static isActiveStatus(status: ApplicationStatus): boolean {
    return status === ApplicationStatus.ACTIVE;
  }

  static isArchivedStatus(status: ApplicationStatus): boolean {
    return status === ApplicationStatus.ARCHIVED;
  }

  static canBePublished(status: ApplicationStatus): boolean {
    return (
      status === ApplicationStatus.READY ||
      status === ApplicationStatus.TESTING ||
      status === ApplicationStatus.ACTIVE
    );
  }
}