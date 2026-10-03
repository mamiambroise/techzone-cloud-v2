import { Module } from '@nestjs/common';

import { BusinessDefinitionCopyService } from './business-definition-copy.service';

/**
 * Service partagé de copie d'une Business Definition entre deux
 * ApplicationVersion. Utilisé par la duplication d'application et le clonage
 * de version afin de n'avoir qu'une seule implémentation du « copier une
 * définition » (entités, champs, relations, fonctionnalités, navigation,
 * configuration) et une seule gestion du ré-échappement des références.
 */
@Module({
  providers: [BusinessDefinitionCopyService],
  exports: [BusinessDefinitionCopyService],
})
export class BusinessDefinitionModule {}