import { Controller, Post, Body, BadRequestException, Get, Query, UseInterceptors, UploadedFile, Patch, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AttendanceService } from './attendance.service';
import { Admin } from '../admin/admin.entity';          
import { ExamOfficer } from '../exam-officer/exam-officer.entity'; 
import { Lecturer } from './entities/lecturer.entity';
import { Student } from './entities/student.entity';
import { Lecture } from './entities/lecture.entity';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly service: AttendanceService,
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    @InjectRepository(ExamOfficer) private examRepo: Repository<ExamOfficer>,
    @InjectRepository(Lecturer) private lecturerRepo: Repository<Lecturer>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Lecture) private lectureRepo: Repository<Lecture>,
  ) {}

  // ==================================================================
  // 1. AUTHENTICATION & ONBOARDING
  // ==================================================================

  @Post('auth/login')
  async login(@Body() body: { email: string; role: string; password?: string }) {
    if (!body.password || !body.email) throw new BadRequestException('Credentials required');
    const email = body.email.toLowerCase();

    // 1. ADMIN LOGIN
    if (body.role === 'admin') {
      const admin = await this.adminRepo.findOneBy({ email });
      if (!admin || !(await bcrypt.compare(body.password, admin.password))) {
        throw new BadRequestException('Invalid Admin Credentials');
      }
      const { password, ...result } = admin;
      return { ...result, role: 'admin', title: 'SysAdmin' };
    }

    // 2. EXAM OFFICER LOGIN
    if (body.role === 'exam_officer') {
      const officer = await this.examRepo.findOneBy({ email });
      if (!officer || !(await bcrypt.compare(body.password, officer.password))) {
        throw new BadRequestException('Invalid Exam Officer Credentials');
      }
      const { password, ...result } = officer;
      return { ...result, role: 'exam_officer', title: 'Officer' };
    }

    // 3. LECTURER LOGIN
    if (body.role === 'lecturer') {
      const lecturer = await this.lecturerRepo.findOneBy({ email });
      if (!lecturer || !(await bcrypt.compare(body.password, lecturer.password))) {
        throw new BadRequestException('Invalid Lecturer Credentials');
      }
      const { password, ...result } = lecturer;
      return { ...result, role: 'lecturer' };
    }

    throw new BadRequestException('Invalid Role Selection');
  }

  @Post('auth/change-password')
  async changePassword(@Body() body: any) {
    return this.service.changePassword(body);
  }

  @Post('admin/create-admin')
  async createAdmin(@Body() body: any) { return this.service.createAdmin(body); }

  @Post('admin/create-exam-officer')
  async createExamOfficer(@Body() body: any) { return this.service.createExamOfficer(body); }

  @Post('admin/lecturer')
  async createLecturer(@Body() body: any) { return this.service.createLecturer(body); }

  @Post('admin/student')
  async createStudent(@Body() body: any) { return this.service.createStudent(body); }


  // ==================================================================
  // 2. ACADEMIC STRUCTURE & CLASSES
  // ==================================================================

  @Post('admin/faculty')
  createFaculty(@Body() body: { name: string }) { return this.service.createFaculty(body.name); }

  @Post('admin/department')
  createDepartment(@Body() body: { facultyId: string, name: string }) { return this.service.createDepartment(body.facultyId, body.name); }

  @Get('meta/faculties-list')
  getFaculties() { return this.service.getAllFaculties(); }

  @Get('meta/departments-list')
  getDepartmentsList(@Query('facultyId') facultyId: string) { return this.service.getDepartments(facultyId); }

  @Get('meta/lecturers')
  async getLecturers(@Query('department') department?: string, @Query('level') level?: string) { 
    return this.service.getLecturers(department, level); 
  }

  @Post('admin/lecture')
  async createLecture(@Body() body: any) { return this.service.createLecture(body); }

  @Get('meta/classes')
  async getClasses(@Query('lecturerId') lecturerId: string) {
    return this.service.getLecturerClasses(lecturerId);
  }

  @Get('meta/sessions')
  async getSessions() { return this.service.getSessions(); }


  // ==================================================================
  // 3. SESSION MANAGEMENT (LECTURER)
  // ==================================================================

  // ⚠️ Legacy Method (Keep for backward compatibility if needed)
  @Post('activate')
  async activateLecture(@Body() body: { lectureId: string; lat: number; long: number }) {
    return this.service.activateLecture(body.lectureId, body.lat, body.long);
  }

  // Activate Topic-Based Session
  @Post('activate-session')
  async activateSession(@Body() body: { lectureId: string; topic: string; lat: number; long: number }) {
    return this.service.activateSession(body.lectureId, body.topic, body.lat, body.long);
  }

  // 🔍 Check Active Status (For Student App)
  @Get('active-session')
  async getActiveSession(@Query('lectureId') lectureId: string) {
    return this.service.getActiveSession(lectureId);
  }


  // ==================================================================
  // 4. STUDENT ATTENDANCE ACTIONS
  // ==================================================================

  @Post('identify')
  async identifyStudent(@Body() body: { identifier: string }) {
    return this.service.identifyStudent(body.identifier);
  }

  // Pre-Flight Eligibility Check
  @Post('verify-eligibility')
  async verifyEligibility(@Body() body: { matricNumber: string; lectureId: string; deviceId: string }) {
    return this.service.verifyAttendanceEligibility(body.matricNumber, body.lectureId, body.deviceId);
  }

  // 📸 Final Mark Attendance (With File Upload)
  @Post('mark')
  @UseInterceptors(FileInterceptor('file'))
  async markAttendance(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any
  ) {
    if (!file) throw new BadRequestException('Face capture is required');
    return this.service.markAttendance(
      body.studentId, 
      body.lectureId, 
      parseFloat(body.lat), 
      parseFloat(body.long), 
      body.deviceId,
      file
    );
  }


  // ==================================================================
  // 5. REPORTS & METRICS
  // ==================================================================

  @Get('admin/metrics')
  async getMetrics() { return this.service.getMetrics(); }

@Get('admin/report')
async getReport(@Query('lectureId') lectureId: string) {
  return this.service.getCourseReport(lectureId);
}

  @Post('admin/add-topic')
  async addTopic(@Body() body: { lectureId: string; topic: string }) {
    return this.service.addTopic(body.lectureId, body.topic);
  }

  @Get('admin/student') 
  async getAllStudents() {
    return this.service.getAllStudents();
  }

  @Patch('admin/student/:id')
async updateStudent(@Param('id') id: string, @Body() updateData: any) {
  return this.service.updateStudent(id, updateData);
}

@Patch('admin/lecturer/:id')
async updateLecturer(@Param('id') id: string, @Body() updateData: any) {
  return this.service.updateLecturer(id, updateData);
}

@Post('deactivate-session')
async deactivate(@Body() body: { lectureId: string }) {
  return this.service.deactivateSession(body.lectureId);
}

@Post('admin/bulk-promote')
async bulkPromote(@Body() data: { ids: string[], newLevel: string }) {
  return this.service.bulkPromoteStudents(data.ids, data.newLevel);
}

@Post('admin/lecture/bulk')
async bulkCreateLecture(@Body() data: any) {
  return this.service.bulkCreateLectures(data);
}
@Get('meta/all-classes')
async getAllClasses() {
  // This allows the Exam Officer to see courses from ALL lecturers
  return this.service.getAllLectures();
}

@Post('admin/student/bulk')
async bulkStudents(@Body() body: any[]) {
  return this.service.bulkCreateStudents(body);
}

@Post('admin/staff/bulk')
async bulkStaff(@Body() body: any[]) {
  return this.service.bulkCreateStaff(body);
}
}