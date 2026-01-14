import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';


import { Attendance } from './entities/attendance.entity';
import { Student } from './entities/student.entity';
import { Lecture } from './entities/lecture.entity';
import { Lecturer } from './entities/lecturer.entity';
import { Admin } from '../admin/admin.entity';              
import { ExamOfficer } from '../exam-officer/exam-officer.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Faculty } from 'src/school/faculty.entity';
import { Department } from 'src/school/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, Student, Lecture, Lecturer, Admin, ExamOfficer, Faculty, Department]), 
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
