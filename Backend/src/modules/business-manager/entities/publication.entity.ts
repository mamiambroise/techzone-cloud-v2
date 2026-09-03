import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
    Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Environment, PublicationStatus, PublicationType } from '../../../common/enums';
import { Application } from './application.entity';
import { ApplicationVersion } from './application-version.entity';

@Entity({ name: 'publications' })
@Index(['applicationId'])
@Index(['versionId'])
@Index(['status'])
export class Publication {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    applicationId: string;

    @Column()
    versionId: string;

    @Column({ type: 'enum', enum: Environment, default: Environment.PRODUCTION })
    environment: Environment;

    @Column({ type: 'enum', enum: PublicationType, default: PublicationType.PUBLISH })
    type: PublicationType;

    @Column({ type: 'enum', enum: PublicationStatus, default: PublicationStatus.PENDING })
    status: PublicationStatus;

    @Column({ nullable: true })
    previousVersionId?: string;

    @Column()
    publishedBy: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    publishedAt: Date;

    @Column({ type: 'json', nullable: true })
    result?: Record<string, any> | null;

    @ManyToOne(() => Application, (application) => application.publications, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationId' })
    application: Relation<Application>;

    @ManyToOne(() => ApplicationVersion, (version) => version.publications, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'versionId' })
    version: Relation<ApplicationVersion>;
}
