require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function hash(pw) {
  return argon2.hash(pw, { type: argon2.argon2id });
}

async function main() {
  console.log('Seeding database...');

  // ---- Initial administrator ----
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@hospital.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await hash(adminPassword),
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isEmailVerified: true,
        staff: {
          create: { firstName: 'System', lastName: 'Administrator', jobTitle: 'Super Administrator' },
        },
      },
    });
    console.log(`Created super admin: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('Super admin already exists, skipping.');
  }

  // ---- Departments ----
  const departmentNames = [
    ['Cardiology', 'Heart and cardiovascular system'],
    ['Pediatrics', 'Medical care for infants, children and adolescents'],
    ['Neurology', 'Disorders of the nervous system'],
    ['Dermatology', 'Skin, hair and nail conditions'],
    ['General Medicine', 'General adult primary care'],
    ['Orthopedics', 'Musculoskeletal system'],
    ['Gynecology', "Women's reproductive health"],
    ['Emergency', 'Urgent and emergency care'],
    ['Dentistry', 'Oral and dental health'],
  ];

  const departments = {};
  for (const [name, description] of departmentNames) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name, description },
    });
    departments[name] = dept;
  }
  console.log(`Seeded ${departmentNames.length} departments.`);

  // ---- Specialties ----
  const specialtyNames = [
    'General Practice', 'Interventional Cardiology', 'Pediatric Care',
    'Neurosurgery', 'Cosmetic Dermatology', 'Sports Medicine',
    'Obstetrics', 'Emergency Medicine', 'Oral Surgery',
  ];
  const specialties = {};
  for (const name of specialtyNames) {
    const s = await prisma.specialty.upsert({ where: { name }, update: {}, create: { name } });
    specialties[name] = s;
  }
  console.log(`Seeded ${specialtyNames.length} specialties.`);

  // ---- Sample doctor ----
  const doctorEmail = 'dr.jane.smith@hospital.com';
  const existingDoctor = await prisma.user.findUnique({ where: { email: doctorEmail } });
  let doctor;
  if (!existingDoctor) {
    const user = await prisma.user.create({
      data: {
        email: doctorEmail,
        passwordHash: await hash('Doctor@123'),
        role: 'DOCTOR',
        status: 'ACTIVE',
        isEmailVerified: true,
        doctor: {
          create: {
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '+250700000001',
            gender: 'FEMALE',
            medicalLicenseNo: 'LIC-000123',
            departmentId: departments['Cardiology'].id,
            yearsOfExperience: 8,
            qualification: 'MD, FACC',
            biography: 'Cardiologist focused on preventive heart care and interventional procedures.',
            consultationFee: 50,
            roomNumber: 'C-201',
            appointmentDurationMinutes: 30,
            specialties: { create: [{ specialtyId: specialties['Interventional Cardiology'].id }] },
            availabilities: {
              create: [
                { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '12:00' },
                { dayOfWeek: 'MONDAY', startTime: '14:00', endTime: '17:00' },
                { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '12:00' },
                { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '13:00' },
              ],
            },
          },
        },
      },
      include: { doctor: true },
    });
    doctor = user.doctor;
    console.log(`Created sample doctor: ${doctorEmail} / Doctor@123`);
  } else {
    console.log('Sample doctor already exists, skipping.');
  }

  // ---- Sample receptionist ----
  const receptionistEmail = 'reception@hospital.com';
  const existingReceptionist = await prisma.user.findUnique({ where: { email: receptionistEmail } });
  if (!existingReceptionist) {
    await prisma.user.create({
      data: {
        email: receptionistEmail,
        passwordHash: await hash('Reception@123'),
        role: 'RECEPTIONIST',
        status: 'ACTIVE',
        isEmailVerified: true,
        staff: { create: { firstName: 'Alice', lastName: 'Uwase', jobTitle: 'Front Desk Receptionist' } },
      },
    });
    console.log(`Created sample receptionist: ${receptionistEmail} / Reception@123`);
  }

  // ---- Sample patient ----
  const patientEmail = 'patient@example.com';
  const existingPatient = await prisma.user.findUnique({ where: { email: patientEmail } });
  if (!existingPatient) {
    await prisma.user.create({
      data: {
        email: patientEmail,
        passwordHash: await hash('Patient@123'),
        role: 'PATIENT',
        status: 'ACTIVE',
        isEmailVerified: true,
        patient: {
          create: {
            firstName: 'John',
            lastName: 'Doe',
            phone: '+250700000099',
            gender: 'MALE',
            dateOfBirth: new Date('1990-05-14'),
          },
        },
      },
    });
    console.log(`Created sample patient: ${patientEmail} / Patient@123`);
  }

  // ---- Default system settings ----
  await prisma.systemSetting.upsert({
    where: { key: 'default_appointment_duration_minutes' },
    update: {},
    create: { key: 'default_appointment_duration_minutes', value: '30' },
  });
  await prisma.systemSetting.upsert({
    where: { key: 'hospital_name' },
    update: {},
    create: { key: 'hospital_name', value: 'City General Hospital' },
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
