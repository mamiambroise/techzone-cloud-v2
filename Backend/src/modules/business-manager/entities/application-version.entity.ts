import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    Index,
    JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ApplicationVersionStatus } from '../../../common/enums';
import { Application } from './application.entity';
import { Publication } from './publication.entity';

@Entity({ name: 'application_versions' })
@Index(['applicationId', 'versionNumber'], { unique: true })
@Index(['applicationId'])
@Index(['status'])
export class ApplicationVersion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    applicationId: string;

    @Column({ length: 50 })
    versionNumber: string;

    @Column({ type: 'enum', enum: ApplicationVersionStatus, default: ApplicationVersionStatus.DRAFT })
    status: ApplicationVersionStatus;

    @Column({ type: 'json', nullable: true })
    snapshot?: Record<string, any> | null;

    @Column({ nullable: true })
    comment?: string;

    @Column()
    createdBy: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @Column({ nullable: true, type: 'timestamp with time zone' })
    validatedAt?: Date;

    @Column({ nullable: true, type: 'timestamp with time zone' })
    publishedAt?: Date;

    @Column({ default: 1 })
    version: number;

    @ManyToOne(() => Application, (application) => application.versions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationId' })
    application: Relation<Application>;

    @OneToMany(() => Publication, (publication) => publication.version)
    publications: Relation<Publication[]>;
}
