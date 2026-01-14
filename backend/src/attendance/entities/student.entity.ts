import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Attendance } from './attendance.entity'; // ✅ Import Attendance

@Entity()
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  middleName: string;

  @Column({ unique: true })
  matricNumber: string;

  @Column()
  faculty: string;

  @Column()
  department: string;

  @Column()
  level: string;

  @Column()
  sex: 'Male' | 'Female';

  @Column({ default: 'General' })
  groupName: string;

  @OneToMany(() => Attendance, (attendance) => attendance.student)
  attendances: Attendance[];
}