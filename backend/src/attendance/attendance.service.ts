import { Faculty } from './../school/faculty.entity';
import {
  Injectable,
  BadRequestException,
  Get,
  Query,
  NotFoundException,
} from '@nestjs/common';
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
import { AttendanceSession } from './entities/attendanceSession.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(Lecture) private lectureRepo: Repository<Lecture>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Lecturer) private lecturerRepo: Repository<Lecturer>,
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    @InjectRepository(ExamOfficer) private examRepo: Repository<ExamOfficer>,
    @InjectRepository(Faculty) private facultyRepo: Repository<Faculty>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,
    @InjectRepository(AttendanceSession)
    private readonly sessionRepo: Repository<AttendanceSession>,
  ) {}

  // ==================================================================
  // 1. DATA CREATION (With Security & Formatting)
  // ==================================================================

  // A. Create Lecturer
  async createLecturer(data: any) {
    const email = data.email.toLowerCase();
    const existing = await this.lecturerRepo.findOneBy({ email });
    if (existing)
      throw new BadRequestException('Lecturer email already exists');

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
      order: { classDateTime: 'DESC' },
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
    lecture.activeTopic = 'General Session'; // Default topic for legacy calls
    lecture.activeStartTime = new Date();

    return this.lectureRepo.save(lecture);
  }

  // Activate Session (With Topic)
  async activateSession(
    lectureId: string,
    topic: string,
    lat: number,
    long: number,
  ) {
    const lecture = await this.lectureRepo.findOneBy({ id: lectureId });
    if (!lecture) throw new BadRequestException('Course not found');

    // 1. Create a NEW unique session for this specific class hour
    const newSession = this.sessionRepo.create({
      lecture: lecture,
      startTime: new Date(),
    });
    const savedSession = await this.sessionRepo.save(newSession);

    // 2. Update the lecture with the "Live" metadata
    lecture.isActive = true;
    lecture.status = 'active';
    lecture.activeTopic = topic;
    lecture.activeLatitude = lat;
    lecture.activeLongitude = long;
    lecture.activeStartTime = new Date();

    // 3. Store the current session ID so students link to it
    lecture.currentSessionId = savedSession.id;

    return this.lectureRepo.save(lecture);
  }

  // 🔍 Check Active Status
  async getActiveSession(lectureId: string) {
    const lecture = await this.lectureRepo.findOneBy({ id: lectureId });
    if (!lecture) return { isActive: false };

    // Auto-close if older than 4 hours
    if (lecture.isActive && lecture.activeStartTime) {
      const now = new Date();
      const diffHours =
        (now.getTime() - lecture.activeStartTime.getTime()) / 1000 / 60 / 60;
      if (diffHours > 4) {
        lecture.isActive = false;
        await this.lectureRepo.save(lecture);
        return { isActive: false };
      }
    }

    return {
      isActive: lecture.isActive,
      topic: lecture.activeTopic,
      startedAt: lecture.activeStartTime,
    };
  }

  // 📸 MARK ATTENDANCE
  async markAttendance(
    studentId: string,
    lectureId: string,
    lat: number,
    long: number,
    deviceId: string,
    file: Express.Multer.File,
  ) {
    const lecture = await this.lectureRepo.findOneBy({ id: lectureId });
    const student = await this.studentRepo.findOneBy({ id: studentId });

    if (!lecture || !student) throw new BadRequestException('Invalid details');
    if (!lecture.isActive) throw new BadRequestException('Session Closed.');

    // 1. DEVICE CHECK (Must be unique for THIS specific session)
    const usageRecord = await this.attendanceRepo.findOne({
      where: { session: { id: lecture.currentSessionId }, deviceId: deviceId },
      relations: ['student'],
    });
    if (usageRecord && usageRecord.student.id !== studentId) {
      throw new BadRequestException(
        `Device used by another student for this session!`,
      );
    }

    // 2. LOCATION CHECK (Keep as is)
    const distance = this.getDistance(
      lat,
      long,
      lecture.activeLatitude,
      lecture.activeLongitude,
    );
    if (distance > 100) throw new BadRequestException(`Too far from class.`);

    // 3. NEW DUPLICATE CHECK (Allow marking different sessions for the same course)
    // We check if student already marked THIS SPECIFIC SESSION ID
    const existing = await this.attendanceRepo.findOne({
      where: {
        student: { id: studentId },
        session: { id: lecture.currentSessionId },
      },
    });
    if (existing)
      throw new BadRequestException(
        'Attendance already recorded for this session.',
      );

    // Save File
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    const fileName = `${student.matricNumber.replace(/\//g, '-')}_${Date.now()}.jpg`;
    fs.writeFileSync(path.join(uploadDir, fileName), file.buffer);

    // 4. SAVE ATTENDANCE LINKED TO SESSION
    const attendance = this.attendanceRepo.create({
      student,
      lecture,
      session: { id: lecture.currentSessionId },
      topic: lecture.activeTopic,
      deviceId,
      capturedLat: lat,
      capturedLong: long,
      distanceMeters: distance,
      photoUrl: `/uploads/${fileName}`,
    });

    return this.attendanceRepo.save(attendance);
  }

  // 🛡️ PRE-FLIGHT CHECK
  async verifyAttendanceEligibility(
    matricNumber: string,
    lectureId: string,
    deviceId: string,
  ) {
    const cleanId = matricNumber.trim().toLowerCase();

    // 1. Find Student
    const student = await this.studentRepo
      .createQueryBuilder('student')
      .where('LOWER(student.matricNumber) = :id', { id: cleanId })
      .getOne();

    if (!student) throw new NotFoundException('Matric Number not found.');

    // 2. Find Lecture
    const lecture = await this.lectureRepo.findOneBy({ id: lectureId });
    if (!lecture) throw new NotFoundException('Course not found.');

    // 3. CHECK: Is Class Active?
    if (!lecture.isActive) {
      throw new BadRequestException('This class session is not active.');
    }

    // 4. CHECK: Device Integrity
    const deviceUsage = await this.attendanceRepo.findOne({
      where: { lecture: { id: lectureId }, deviceId: deviceId },
      relations: ['student'],
    });

    if (deviceUsage) {
      if (deviceUsage.student.id !== student.id) {
        throw new BadRequestException(
          `Security Alert: This device was already used by ${deviceUsage.student.firstName}.`,
        );
      } else {
        throw new BadRequestException(
          'You have already marked attendance for this class.',
        );
      }
    }

    // 5. 🛑 CHECK: Student Duplicate
    const studentRecord = await this.attendanceRepo.findOne({
      where: { student: { id: student.id }, lecture: { id: lectureId } },
    });
    if (studentRecord)
      throw new BadRequestException('You have already signed in.');

    return student;
  }

  // ==================================================================
  // 3. REPORTING & METRICS
  // ==================================================================

  // A. Exam Eligibility Report
async getCourseReport(lectureId: string) {
  // 1. Get the specific lecture record to know which Dept/Faculty we are reporting on
  const referenceLecture = await this.lectureRepo.findOne({ where: { id: lectureId } });
  if (!referenceLecture) throw new BadRequestException('Course not found');

  const { courseCode, department, level } = referenceLecture;

  // 2. Count sessions held ONLY for this Course Code AND this Department
  // This prevents sessions activated for "Mechanical Eng" from counting against "Computer Science"
  const totalSessionsHeld = await this.sessionRepo
    .createQueryBuilder('session')
    .leftJoin('session.lecture', 'lecture')
    .where('lecture.courseCode = :courseCode', { courseCode })
    .andWhere('lecture.department = :department', { department })
    .getCount();

  // 3. Find Students strictly in this Department and Level
  const students = await this.studentRepo.find({
    where: { 
      department: department, 
      level: level 
    },
    order: { lastName: 'ASC' }
  });

  // 4. Map students to their attendance
  const studentList = await Promise.all(students.map(async (student) => {
    // Count attendance ONLY for this Course Code AND this Department
    const attendedCount = await this.attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoin('attendance.lecture', 'lecture')
      .where('attendance.studentId = :studentId', { studentId: student.id })
      .andWhere('lecture.courseCode = :courseCode', { courseCode })
      .andWhere('lecture.department = :department', { department })
      .getCount();

    const total = totalSessionsHeld;
    const percentage = total > 0 ? (attendedCount / total) * 100 : 0;

    return {
      firstName: student.firstName,
      lastName: student.lastName,
      matricNumber: student.matricNumber,
      attended: attendedCount,
      total: total,
      percentage: percentage.toFixed(1),
      isEligible: total === 0 ? true : percentage >= 80, // Eligible if no classes held yet
    };
  }));

  return {
    courseTitle: referenceLecture.courseTitle,
    courseCode: courseCode,
    department: department, // Added for clarity in UI
    totalClasses: totalSessionsHeld,
    students: studentList,
  };
}
  async getMetrics() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [totalStudents, totalLecturers, classesToday, attendanceToday] =
      await Promise.all([
        this.studentRepo.count(),
        this.lecturerRepo.count(),
        this.lectureRepo.count({
          where: { classDateTime: Between(todayStart, todayEnd) },
        }),
        this.attendanceRepo.count({
          where: { timestamp: Between(todayStart, todayEnd) },
        }),
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

  async getAllFaculties() {
    return this.facultyRepo.find();
  }

  async getDepartments(facultyId: string) {
    return this.deptRepo.find({ where: { faculty: { id: facultyId } } });
  }

  async getSessions() {
    return this.lectureRepo
      .createQueryBuilder('lecture')
      .select('DISTINCT lecture.session', 'session')
      .orderBy('lecture.session', 'DESC')
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
      .createQueryBuilder('student')
      .where('LOWER(student.matricNumber) = LOWER(:id)', { id: cleanId })
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
    return this.adminRepo.save(
      this.adminRepo.create({ ...data, email, password: hashedPassword }),
    );
  }

  async createExamOfficer(data: any) {
    const email = data.email.toLowerCase();
    const existing = await this.examRepo.findOneBy({ email });
    if (existing) throw new BadRequestException('Email already exists');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password || 'exam123', salt);
    return this.examRepo.save(
      this.examRepo.create({ ...data, email, password: hashedPassword }),
    );
  }

  async changePassword(data: any) {
    const { id, role, oldPassword, newPassword } = data;
    let repo: any =
      role === 'admin'
        ? this.adminRepo
        : role === 'exam_officer'
          ? this.examRepo
          : this.lecturerRepo;
    const user = await repo.findOneBy({ id });
    if (!user) throw new BadRequestException('User not found');
    if (!(await bcrypt.compare(oldPassword, user.password)))
      throw new BadRequestException('Incorrect old password');
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
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

  async updateLecturer(
    id: string,
    updateData: {
      title: string;
      firstName: string;
      lastName: string;
      email: string;
    },
  ) {
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

  async getStudentEligibility(studentId: string, lectureId: string) {
    const totalSessionsHeld = await this.sessionRepo.count({
      where: { lecture: { id: lectureId } },
    });

    const totalAttended = await this.attendanceRepo.count({
      where: { student: { id: studentId }, lecture: { id: lectureId } },
    });

    const percentage =
      totalSessionsHeld > 0
        ? Math.round((totalAttended / totalSessionsHeld) * 100)
        : 0;

    return {
      attended: totalAttended,
      totalHeld: totalSessionsHeld,
      percentage,
      isEligible: percentage >= 80,
    };
  }

  async bulkPromoteStudents(studentIds: string[], newLevel: string) {
  if (!studentIds.length) throw new BadRequestException('No students selected');
  
  return this.studentRepo
    .createQueryBuilder()
    .update(Student)
    .set({ level: newLevel })
    .whereInIds(studentIds)
    .execute();
}

async bulkCreateLectures(data: any) {
  const { targets, lecturerId, ...courseInfo } = data;
  const lecturer = await this.lecturerRepo.findOne({ where: { id: lecturerId } });

  if (!lecturer) throw new NotFoundException('Lecturer not found');

  const lectureEntities: Lecture[] = targets.map((target: any) => {
    // We explicitly create the entity and map the strings
    return this.lectureRepo.create({
      courseCode: courseInfo.courseCode,
      courseTitle: courseInfo.courseTitle,
      level: courseInfo.level,
      session: courseInfo.session,
      semester: courseInfo.semester,
      faculty: target.faculty,      
      department: target.department, 
      lecturer: lecturer,
      isActive: false,
      classDateTime: new Date(),
    });
  });

  return this.lectureRepo.save(lectureEntities);
}
async getAllLectures() {
  return this.lectureRepo.find({
    relations: ['lecturer'],
    order: { courseCode: 'ASC' }
  });
}

async bulkCreateStudents(students: any[]) {
  const report = {
    successfullyCreated: [] as any[],
    failedRecords: [] as { identifier: string; reason: string }[],
    successCount: 0,
    errorCount: 0,
  };

  for (const s of students) {
    const matric = s.matricNumber ? String(s.matricNumber).toUpperCase().trim() : null;
    const fullName = (s.firstName || s.lastName) 
  ? `${s.firstName || ''} ${s.lastName || ''}`.trim() 
  : null;
const rowIdentifier = fullName || matric || `Unknown Row`;

    try {
      if (!matric) {
        throw new Error('Matric number is missing in Excel row');
      }

      // Pre-Check
      const existing = await this.studentRepo.findOneBy({ matricNumber: matric });
      if (existing) {
        throw new Error(`Student with matric ${matric} already exists`);
      }

      const student = this.studentRepo.create({
        firstName: s.firstName ? capitalize(String(s.firstName)) : '',
        lastName: s.lastName ? capitalize(String(s.lastName)) : '',
        middleName: s.middleName ? capitalize(String(s.middleName)) : '',
        matricNumber: matric,
        faculty: s.faculty || '',
        department: s.department || '',
        level: s.level ? String(s.level) : '100',
        sex: s.sex ? (capitalize(String(s.sex)) as 'Male' | 'Female') : 'Male'
      });

      const saved = await this.studentRepo.save(student);
      
      report.successfullyCreated.push(saved);
      report.successCount++;

    } catch (err) {
      report.failedRecords.push({
        identifier: rowIdentifier,
        reason: err.message,
      });
      report.errorCount++;
    }
  }

  return report;
}

async bulkCreateStaff(staffList: any[]) {
  const salt = await bcrypt.genSalt(10);
  
  const report = {
    successfullyCreated: [] as { email: string; name: string; role: string }[],
    failedRecords: [] as { email: string; name: string; reason: string }[]
  };

  for (const s of staffList) {
    const email = s.email?.toLowerCase().trim();
    const role = s.role?.toLowerCase().trim();

    try {
      if (!email || !role) throw new Error('Missing email or role');

      // Pre-check for existing records
      const [exLec, exAdm, exOff] = await Promise.all([
        this.lecturerRepo.findOneBy({ email }),
        this.adminRepo.findOneBy({ email }),
        this.examRepo.findOneBy({ email }),
      ]);

      if (exLec || exAdm || exOff) throw new Error('Email already exists');

      const hashedPassword = await bcrypt.hash(s.password || 'password123', salt);
      
      if (role === 'lecturer') {
        await this.lecturerRepo.save(this.lecturerRepo.create({ ...s, email, password: hashedPassword, title: s.title || 'Dr.' }));
      } else if (role === 'admin') {
        await this.adminRepo.save(this.adminRepo.create({ ...s, email, password: hashedPassword }));
      } else if (role === 'exam_officer') {
        await this.examRepo.save(this.examRepo.create({ ...s, email, password: hashedPassword }));
      } else {
        throw new Error(`Invalid role type: ${role}`);
      }

      report.successfullyCreated.push({
        email: email,
        name: `${s.firstName} ${s.lastName}`,
        role: role
      });

    } catch (err) {
      report.failedRecords.push({
        email: email || 'Unknown',
        name: `${s.firstName || ''} ${s.lastName || ''}`,
        reason: err.message
      });
    }
  }

  return report;
}
}


