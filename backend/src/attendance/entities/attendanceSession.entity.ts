import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Column, OneToMany } from 'typeorm';
import { Lecture } from './lecture.entity';
import { Attendance } from './attendance.entity';

@Entity()
export class AttendanceSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Lecture)
  lecture: Lecture;

  @CreateDateColumn()
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;


  @OneToMany(() => Attendance, (attendance) => attendance.session)
  attendances: Attendance[];
}