import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ApplicationStatus, Environment } from '../../../common/enums';
import { ApplicationVersion } from './application-version.entity';
import { Publication } from './publication.entity';
import { ActivityEvent } from './activity-event.entity';

@Entity({ name: 'applications' })
@Index(['code'], { unique: true })
@Index(['status'])
@Index(['category'])
@Index(['createdAt'])
export class Application {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 100 })
    code: string;

    @Column({ length: 255 })
    name: string;

    @Column({ nullable: true, type: 'text' })
    description?: string;

    @Column({ nullable: true })
    category?: string;

    @Column({ nullable: true })
    icon?: string;

    @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.DRAFT })
    status: ApplicationStatus;

    @Column({ type: 'enum', enum: Environment, default: Environment.DEVELOPMENT })
    environment: Environment;

    @Column({ nullable: true })
    currentVersionId?: string;

    @Column({ nullable: true })
    publishedVersionId?: string;

    @Column()
    createdBy: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt: Date;

    @Column({ nullable: true, type: 'timestamp with time zone' })
    archivedAt?: Date;

    @Column({ default: 1 })
    version: number;

    @OneToMany(() => ApplicationVersion, (version) => version.application)
    versions: Relation<ApplicationVersion[]>;

    @OneToMany(() => Publication, (publication) => publication.application)
    publications: Relation<Publication[]>;

    @OneToMany(() => ActivityEvent, (activity) => activity.application)
    activities: Relation<ActivityEvent[]>;
}
