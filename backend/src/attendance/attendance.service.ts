import { Faculty } from './../school/faculty.entity';
import { Injectable, BadRequestException, Get, Query, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { capitalize } from '../utils/format';

// Entities
import { Attendance } from './entities/attendance.entity';
import { Lecture } from './entities/lecture.entity';
import { Student } from './entities/student.entity';
import { Lecturer } from './entities/lecturer.entity';
import { Admin } from '../admin/admin.entity';
import { ExamOfficer } from '../exam-officer/exam-officer.entity';
import { Department } from '../school/department.entity';


@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance) private attendanceRepo: Repository<Attendance>,
    @InjectRepository(Lecture) private lectureRepo: Repository<Lecture>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Lecturer) private lecturerRepo: Repository<Lecturer>,
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    @InjectRepository(ExamOfficer) private examRepo: Repository<ExamOfficer>,
    @InjectRepository(Faculty) private facultyRepo: Repository<Faculty>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,
  ) {}

  // ==================================================================
  // 1. DATA CREATION (With Security & Formatting)
  // ==================================================================

  // A. Create Lecturer
  async createLecturer(data: any) {
    const email = data.email.toLowerCase();
    const existing = await this.lecturerRepo.findOneBy({ email });
    if (existing) throw new BadRequestException('Lecturer email already exists');

    const rawPassword = data.password || 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const lecturer = this.lecturerRepo.create({
      title: capitalize(data.title),
      firstName: capitalize(data.firstName),
      lastName: capitalize(data.lastName),
      middleName: data.middleName ? capitalize(data.middleName) : '',
      department: capitalize(data.department),
      faculty: capitalize(data.faculty),
      email: email,
      phoneNumber: data.phoneNumber,
      password: hashedPassword, 
    });

    return this.lecturerRepo.save(lecturer);
  }

  // B. Create Student
  async createStudent(data: any) {
    const matricNumber = data.matricNumber.toUpperCase();
    const existing = await this.studentRepo.findOneBy({ matricNumber });
    if (existing) throw new BadRequestException('Student already exists');

    const student = this.studentRepo.create({
      firstName: capitalize(data.firstName),
      lastName: capitalize(data.lastName),
      middleName: data.middleName ? capitalize(data.middleName) : '',
      faculty: capitalize(data.faculty),
      department: capitalize(data.department),
      matricNumber: matricNumber,
      level: data.level,
      sex: capitalize(data.sex) as 'Male' | 'Female',
    });

    return this.studentRepo.save(student);
  }

  // C. Create Course
  async createLecture(data: any) {
    const lecturer = await this.lecturerRepo.findOneBy({ id: data.lecturerId });
    if (!lecturer) throw new BadRequestException('Invalid Lecturer ID');

    const lecture = this.lectureRepo.create({
      courseCode: data.courseCode.toUpperCase(), // Ensure uppercase code
      courseTitle: capitalize(data.courseTitle), // Format title
      session: data.session,
      semester: capitalize(data.semester),
      faculty: data.faculty,
      department: data.department,
      lecturer: lecturer,
      level: data.level,
      classDateTime: new Date(),
      isActive: false, 
    });

    return this.lectureRepo.save(lecture);
  }

  // Get Classes for a specific Lecturer
  async getLecturerClasses(lecturerId: string) {
    return this.lectureRepo.find({
      where: { lecturer: { id: lecturerId } },
      order: { classDateTime: 'DESC' } 
    });
  }

  // ==================================================================
  // 2. CORE ATTENDANCE & SESSION LOGIC
  // ==================================================================

  // ⚠️ LEGACY: Activate without topic (Included to fix your error)
  async activateLecture(lectureId: string, lat: number, long: number) {
    const lecture = await this.lectureRepo.findOneBy({ id: lectureId });
    if (!lecture) throw new BadRequestException('Course not found');

    lecture.isActive = true;
    lecture.activeLatitude = lat;
    lecture.activeLongitude = long;
    lecture.activeTopic = "General Session"; // Default topic for legacy calls
    lecture.activeStartTime = new Date();

    return this.lectureRepo.save(lecture);
  }

  // 🔥 NEW: Activate Session (With Topic)
  async activateSession(lectureId: string, topic: string, lat: number, long: number) {
    const lecture = await this.lectureRepo.findOneBy({ id: lectureId });
    if (!lecture) throw new BadRequestException('Course not found');

    lecture.isActive = true;
    lecture.status = 'active';
    lecture.activeTopic = topic; 
    lecture.activeLatitude = lat;
    lecture.activeLongitude = long;
    lecture.activeStartTime = new Date();

    return this.lectureRepo.save(lecture);
  }

  // 🔍 Check Active Status
  async getActiveSession(lectureId: string) {
    const lecture = await this.lectureRepo.findOneBy({ id: lectureId });
    if (!lecture) return { isActive: false };

    // Auto-close if older than 4 hours
    if (lecture.isActive && lecture.activeStartTime) {
       const now = new Date();
       const diffHours = (now.getTime() - lecture.activeStartTime.getTime()) / 1000 / 60 / 60;
       if (diffHours > 4) {
         lecture.isActive = false;
         await this.lectureRepo.save(lecture);
         return { isActive: false };
       }
    }

    return {
      isActive: lecture.isActive,
      topic: lecture.activeTopic,
      startedAt: lecture.activeStartTime
    };
  }

 // 📸 MARK ATTENDANCE
  async markAttendance(studentId: string, lectureId: string, lat: number, long: number, deviceId: string, file: Express.Multer.File) {
    const lecture = await this.lectureRepo.findOneBy({ id: lectureId });
    const student = await this.studentRepo.findOneBy({ id: studentId });

    if (!lecture || !student) throw new BadRequestException('Invalid details');
    
    // 1. TIME CHECK
    if (!lecture.isActive) throw new BadRequestException('Session Closed. You cannot mark attendance for this class.');

    // 2. DEVICE CHECK
    const usageRecord = await this.attendanceRepo.findOne({
      where: { lecture: { id: lectureId }, deviceId: deviceId },
      relations: ['student']
    });

    if (usageRecord && usageRecord.student.id !== studentId) {
      throw new BadRequestException(`FRAUD DETECTED: This device was already used by ${usageRecord.student.firstName}!`);
    }

    // 3. LOCATION CHECK
    const distance = this.getDistance(lat, long, lecture.activeLatitude, lecture.activeLongitude);
    if (distance > 100) throw new BadRequestException(`Too far! You are ${distance.toFixed(0)}m away from the class.`);

    // 4. DUPLICATE CHECK
    const existing = await this.attendanceRepo.findOne({
      where: { student: { id: studentId }, lecture: { id: lectureId } }
    });
    if (existing) throw new BadRequestException('You have already signed in.');

    // Save File
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    const fileName = `${student.matricNumber.replace(/\//g, '-')}_${Date.now()}.jpg`;
    fs.writeFileSync(path.join(uploadDir, fileName), file.buffer);

    // ✅ SAVE ATTENDANCE WITH TOPIC SNAPSHOT
    const attendance = this.attendanceRepo.create({
      student,
      lecture,
      topic: lecture.activeTopic || lecture.courseTitle, // <--- Saves "Intro to AI" permanently
      deviceId,
      capturedLat: lat,
      capturedLong: long,
      distanceMeters: distance,
      photoUrl: `/uploads/${fileName}`
    });

    return this.attendanceRepo.save(attendance);
  }

  // 🛡️ PRE-FLIGHT CHECK
  async verifyAttendanceEligibility(matricNumber: string, lectureId: string, deviceId: string) {
    const cleanId = matricNumber.trim().toLowerCase();

    // 1. Find Student
    const student = await this.studentRepo.createQueryBuilder("student")
      .where("LOWER(student.matricNumber) = :id", { id: cleanId })
      .getOne();

    if (!student) throw new NotFoundException("Matric Number not found.");

    // 2. Find Lecture
    const lecture = await this.lectureRepo.findOneBy({ id: lectureId });
    if (!lecture) throw new NotFoundException("Course not found.");

    // 3. CHECK: Is Class Active?
    if (!lecture.isActive) {
      throw new BadRequestException("This class session is not active.");
    }

    // 4. CHECK: Device Integrity
    const deviceUsage = await this.attendanceRepo.findOne({
      where: { lecture: { id: lectureId }, deviceId: deviceId },
      relations: ['student']
    });

    if (deviceUsage) {
      if (deviceUsage.student.id !== student.id) {
        throw new BadRequestException(`Security Alert: This device was already used by ${deviceUsage.student.firstName}.`);
      } else {
        throw new BadRequestException("You have already marked attendance for this class.");
      }
    }

    // 5. 🛑 CHECK: Student Duplicate
    const studentRecord = await this.attendanceRepo.findOne({
      where: { student: { id: student.id }, lecture: { id: lectureId } }
    });
    if (studentRecord) throw new BadRequestException("You have already signed in.");

    return student; 
  }

  // ==================================================================
  // 3. REPORTING & METRICS
  // ==================================================================

  // A. Exam Eligibility Report
 async getCourseReport(lectureIdOrCode: string) {
    
    // Try to find lectures by specific ID first, or fall back to Code
    // NOTE: Usually reports are per "Course Code" across a session
    
    const validLecturesCount = await this.lectureRepo.createQueryBuilder('lecture')
      .where('lecture.courseCode = :code', { code: lectureIdOrCode }) // Searching by Code now
      .andWhere('lecture.activeLatitude IS NOT NULL') 
      .getCount();

    if (validLecturesCount === 0) return { totalClasses: 0, students: [] };

    // Find attendance for this Course Code
    const records = await this.attendanceRepo.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .leftJoin('attendance.lecture', 'lecture')
      .where('lecture.courseCode = :code', { code: lectureIdOrCode })
      .getMany();

    const studentMap = new Map<string, { student: Student, count: number }>();
    
    records.forEach(r => {
      const sid = r.student.id;
      let entry = studentMap.get(sid);
      if (!entry) {
        entry = { student: r.student, count: 0 };
        studentMap.set(sid, entry);
      }
      entry.count++;
    });

    const report = Array.from(studentMap.values()).map(item => {
      const percentage = (item.count / validLecturesCount) * 100;
      return {
        firstName: item.student.firstName,
        lastName: item.student.lastName,
        matricNumber: item.student.matricNumber,
        attended: item.count,
        total: validLecturesCount,
        percentage: percentage.toFixed(1),
        isEligible: percentage >= 80 
      };
    });

    return { 
      totalClasses: validLecturesCount, 
      students: report.sort((a, b) => a.lastName.localeCompare(b.lastName)) 
    };
  }

  async getMetrics() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [totalStudents, totalLecturers, classesToday, attendanceToday] = await Promise.all([
      this.studentRepo.count(),
      this.lecturerRepo.count(),
      this.lectureRepo.count({ where: { classDateTime: Between(todayStart, todayEnd) } }),
      this.attendanceRepo.count({ where: { timestamp: Between(todayStart, todayEnd) } })
    ]);

    return { totalStudents, totalLecturers, classesToday, attendanceToday };
  }

  async createFaculty(name: string) {
    const existing = await this.facultyRepo.findOneBy({ name });
    if (existing) throw new BadRequestException('Faculty already exists');
    return this.facultyRepo.save(this.facultyRepo.create({ name }));
  }

  async createDepartment(facultyId: string, name: string) {
    const faculty = await this.facultyRepo.findOneBy({ id: facultyId });
    if (!faculty) throw new BadRequestException('Faculty not found');
    return this.deptRepo.save(this.deptRepo.create({ name, faculty }));
  }

  async getAllFaculties() { return this.facultyRepo.find(); }

  async getDepartments(facultyId: string) {
    return this.deptRepo.find({ where: { faculty: { id: facultyId } } });
  }

  async getSessions() {
    return this.lectureRepo.createQueryBuilder("lecture")
      .select("DISTINCT lecture.session", "session")
      .orderBy("lecture.session", "DESC")
      .getRawMany(); 
  }

  async getLecturers(department?: string, level?: string) {
    const where: any = {};
    if (department) where.department = department;
    return this.lecturerRepo.find({ where, order: { lastName: 'ASC' } });
  }

  // Identify Student (Simple)
  async identifyStudent(identifier: string) {
    const cleanId = identifier.trim();
    const student = await this.studentRepo
      .createQueryBuilder("student")
      .where("LOWER(student.matricNumber) = LOWER(:id)", { id: cleanId })
      .getOne();

    if (!student) throw new NotFoundException(`Student not found`);
    return student;
  }

  // --- Admin/User Helpers ---
  async createAdmin(data: any) { 
      const email = data.email.toLowerCase();
      const existing = await this.adminRepo.findOneBy({ email });
      if (existing) throw new BadRequestException('Admin email already exists');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password || 'admin123', salt);
      return this.adminRepo.save(this.adminRepo.create({ ...data, email, password: hashedPassword }));
  }

  async createExamOfficer(data: any) { 
      const email = data.email.toLowerCase();
      const existing = await this.examRepo.findOneBy({ email });
      if (existing) throw new BadRequestException('Email already exists');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password || 'exam123', salt);
      return this.examRepo.save(this.examRepo.create({ ...data, email, password: hashedPassword }));
  }
  
  async changePassword(data: any) { 
     const { id, role, oldPassword, newPassword } = data;
     let repo: any = role === 'admin' ? this.adminRepo : role === 'exam_officer' ? this.examRepo : this.lecturerRepo;
     const user = await repo.findOneBy({ id });
     if (!user) throw new BadRequestException('User not found');
     if (!await bcrypt.compare(oldPassword, user.password)) throw new BadRequestException('Incorrect old password');
     const salt = await bcrypt.genSalt(10);
     user.password = await bcrypt.hash(newPassword, salt);
     await repo.save(user);
     return { message: 'Password updated' };
  }

  // Helper: Haversine
  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; 
    const toRad = (val: number) => (val * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
  }

  // ADD TOPIC TO COURSE
  async addTopic(lectureId: string, topic: string) {
    const lecture = await this.lectureRepo.findOneBy({ id: lectureId });
    if (!lecture) throw new BadRequestException('Course not found');

    // Initialize array if empty
    if (!lecture.topics) {
      lecture.topics = [];
    }

    // Check duplicate
    if (lecture.topics.includes(topic)) {
      throw new BadRequestException('Topic already exists for this course');
    }

    lecture.topics.push(topic);
    return this.lectureRepo.save(lecture);
  }

  async getAllStudents() {
    return this.studentRepo.find({
      order: {
        lastName: 'ASC', 
      },
    });
  }

  async updateStudent(id: string, updateData: any) {
  const student = await this.studentRepo.findOneBy({ id });
  if (!student) throw new NotFoundException('Student not found');
  Object.assign(student, updateData);
  
  return this.studentRepo.save(student);
}

async updateLecturer(id: string, updateData: { title: string; firstName: string; lastName: string; email: string }) {
  const lecturer = await this.lecturerRepo.findOneBy({ id });
  if (!lecturer) throw new NotFoundException('Lecturer not found');
  
  Object.assign(lecturer, updateData);
  return this.lecturerRepo.save(lecturer);
}

async deactivateSession(lectureId: string) {
  const lecture = await this.lectureRepo.findOneBy({ id: lectureId });
  if (!lecture) throw new NotFoundException('Course not found');
  lecture.isActive = false;
  lecture.status = 'inactive'; 
  
  return this.lectureRepo.save(lecture);
}
}