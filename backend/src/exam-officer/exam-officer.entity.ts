import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ExamOfficer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Hashed
}