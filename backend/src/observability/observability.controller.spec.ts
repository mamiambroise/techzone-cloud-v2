import { BadRequestException } from '@nestjs/common';
import { ObservabilityController } from './observability.controller';

describe('ObservabilityController retention guard', () => {
  it('requires an explicit confirmation token before a destructive retention run', () => {
    const retention = { run: jest.fn() };
    const controller = new ObservabilityController({} as any, {} as any, {} as any, retention as any);
    expect(() => controller.runRetention('policy-1', false, undefined)).toThrow(BadRequestException);
    expect(retention.run).not.toHaveBeenCalled();
  });

  it('keeps dry-runs available without a destructive confirmation', () => {
    const retention = { run: jest.fn().mockResolvedValue({ status: 'COMPLETED' }) };
    const controller = new ObservabilityController({} as any, {} as any, {} as any, retention as any);
    controller.runRetention('policy-1', true, undefined);
    expect(retention.run).toHaveBeenCalledWith('policy-1', true);
  });
});
