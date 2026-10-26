import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { RulesEngine } from './rules/rules.engine';
import { WorkflowEngine } from './workflow/workflow.engine';
import { TriggerEngine } from './trigger/trigger.engine';
import { ActionEngine } from './action/action.engine';
import { ConditionsEngine } from './conditions/conditions.engine';
import { AutomationHistoryService } from './history/automation-history.service';
import { MockAutomation } from './mock/mock.automation';
import { AutomationPersistenceService } from './automation-persistence.service';

@Module({
  controllers: [AutomationController],
  providers: [
    RulesEngine,
    WorkflowEngine,
    TriggerEngine,
    ActionEngine,
    ConditionsEngine,
    AutomationHistoryService,
    MockAutomation,
    AutomationPersistenceService,
  ],
  exports: [
    RulesEngine,
    WorkflowEngine,
    TriggerEngine,
    ActionEngine,
    ConditionsEngine,
    AutomationHistoryService,
    AutomationPersistenceService,
  ],
})
export class AutomationModule {}
