import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Student } from './student.entity';
import { Lecture } from './lecture.entity';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, (student) => student.attendances)
  student: Student;

  @ManyToOne(() => Lecture, (lecture) => lecture.attendances)
  lecture: Lecture;


  @Column({ nullable: true })
  topic: string; 

  @Column()
  deviceId: string;

  @Column({ type: 'float' })
  capturedLat: number;

  @Column({ type: 'float' })
  capturedLong: number;

  @Column({ type: 'float' })
  distanceMeters: number;

  @Column({ nullable: true })
  photoUrl: string;

  @CreateDateColumn()
  timestamp: Date;
}