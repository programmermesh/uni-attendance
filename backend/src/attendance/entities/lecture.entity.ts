// src/attendance/entities/lecture.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Attendance } from './attendance.entity';
import { Lecturer } from './lecturer.entity';
@Entity()
export class Lecture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  courseCode: string;

  @Column()
  courseTitle: string;

  @ManyToOne(() => Lecturer, (lecturer) => lecturer.lectures)
  lecturer: Lecturer;
  
  @Column({ default: 'inactive' }) 
  status: string;


  // ... (keep faculty, department, session, semester, level, etc.)
  @Column({ nullable: true }) faculty: string;
  @Column({ nullable: true }) department: string;
  @Column() session: string;
  @Column() semester: string;
  @Column({ nullable: true }) level: string;
  @Column({ type: 'timestamp' }) classDateTime: Date;
  @Column({ type: 'float', nullable: true }) latitude: number; 
  @Column({ type: 'float', nullable: true }) longitude: number;
  @Column({ default: 100 }) radiusMeters: number;

  // --- LIVE SESSION STATE ---
  @Column({ default: false }) isActive: boolean;
  @Column({ nullable: true }) activeTopic: string;
  @Column('float', { nullable: true }) activeLatitude: number;
  @Column({ type: 'float', nullable: true }) activeLongitude: number;
  @Column({ type: 'timestamp', nullable: true }) activeStartTime: Date;

  @Column("simple-array", { nullable: true })
  topics: string[];

  @OneToMany(() => Attendance, (att) => att.lecture)
  attendances: Attendance[];

}