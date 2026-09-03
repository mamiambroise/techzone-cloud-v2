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
import { ResultType } from '../../../common/enums';
import { Application } from './application.entity';

@Entity({ name: 'activity_events' })
@Index(['applicationId'])
@Index(['createdAt'])
@Index(['actorId'])
@Index(['traceId'])
export class ActivityEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    applicationId?: string;

    @Column()
    actorId: string;

    @Column()
    eventType: string;

    @Column()
    action: string;

    @Column()
    targetType: string;

    @Column()
    targetId: string;

    @Column({ type: 'enum', enum: ResultType, default: ResultType.SUCCESS })
    result: ResultType;

    @Column({ type: 'json', nullable: true })
    before?: Record<string, any> | null;

    @Column({ type: 'json', nullable: true })
    after?: Record<string, any> | null;

    @Column({ type: 'json', nullable: true })
    metadata?: Record<string, any> | null;

    @Column()
    traceId: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @ManyToOne(() => Application, (application) => application.activities, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'applicationId' })
    application?: Relation<Application>;
}
