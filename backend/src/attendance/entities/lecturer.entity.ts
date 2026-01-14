import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Lecture } from './lecture.entity';

@Entity()
export class Lecturer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string; // e.g., Dr., Prof., Mr.

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  middleName: string;

  @Column({ unique: true })
  email: string;

  @Column() 
  password: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column()
  faculty: string;

  @Column()
  department: string;

  // Relation: One Lecturer teaches Many Lectures
  @OneToMany(() => Lecture, (lecture) => lecture.lecturer)
  lectures: Lecture[];
}