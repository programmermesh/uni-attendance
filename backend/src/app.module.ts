// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AttendanceModule } from './attendance/attendance.module';
import { Student } from './attendance/entities/student.entity';
import { Lecture } from './attendance/entities/lecture.entity';
import { Attendance } from './attendance/entities/attendance.entity';
import { Lecturer } from './attendance/entities/lecturer.entity';
import { Admin } from './admin/admin.entity';
import { ExamOfficer } from './exam-officer/exam-officer.entity';
import { Department } from './school/department.entity';
import { Faculty } from './school/faculty.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres', 
      password: 'password', 
      database: 'university_db',
      entities: [Student, Lecture, Attendance, Lecturer, Admin, ExamOfficer, Faculty, Department],
      synchronize: true, 
    }),
    // Serve uploaded images publicly so frontend can see them
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads', 
    }),
    AttendanceModule,
  ],
})
export class AppModule {}