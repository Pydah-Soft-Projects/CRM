import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database Configuration
 * MySQL connection pool setup for multiple databases
 * HRMS MongoDB connection (optional, for SSO verify-token user resolution)
 * Hostel MongoDB connection (optional, separate database for hostel software)
 */

let studentPool = null;
let admissionsPool = null;
let academicPool = null;
let examinationPool = null;
let hrmsMongoClient = null;
let hrmsMongoDb = null;
let hostelMongoClient = null;
let hostelMongoDb = null;
let transportMongoClient = null;
let transportMongoDb = null;
let feeMongoClient = null;
let feeMongoDb = null;
let stationaryMongoClient = null;
let stationaryMongoDb = null;
let srsMongoClient = null;
let srsMongoDb = null;

/**
 * Create MySQL connection pool for student database
 */
export const createStudentPool = () => {
  if (studentPool) {
    return studentPool;
  }

  studentPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_database',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  return studentPool;
};

/**
 * Create MySQL connection pool for admissions database
 */
export const createAdmissionsPool = () => {
  if (admissionsPool) {
    return admissionsPool;
  }

  admissionsPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_ADMISSIONS || 'admissions_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  return admissionsPool;
};

/**
 * Create MySQL connection pool for academic portal database
 */
export const createAcademicPool = () => {
  if (academicPool) {
    return academicPool;
  }

  academicPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_ACADEMIC || 'academic_portal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  return academicPool;
};

export const getAcademicPool = () => {
  return createAcademicPool();
};

/**
 * Create MySQL connection pool for examination portal database
 */
export const createExaminationPool = () => {
  if (examinationPool) {
    return examinationPool;
  }

  examinationPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_EXAMINATION || 'examination_portal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  return examinationPool;
};

export const getExaminationPool = () => {
  return createExaminationPool();
};

/**
 * Create MySQL connection pool (legacy - defaults to student database)
 */
export const createPool = () => {
  return createStudentPool();
};

/**
 * Connect to HRMS MongoDB (optional; when HRMS_MONGO_URI or HRMS_MONGO_URL is set)
 * @returns {Promise<import('mongodb').Db|null>} HRMS db instance or null
 */
export const connectHRMSMongo = async () => {
  const uri = process.env.HRMS_MONGO_URI || process.env.HRMS_MONGO_URL;
  if (!uri) {
    return null;
  }
  if (hrmsMongoClient) {
    return hrmsMongoDb;
  }
  try {
    hrmsMongoClient = new MongoClient(uri);
    await hrmsMongoClient.connect();
    hrmsMongoDb = hrmsMongoClient.db();
    console.log('✅ HRMS MongoDB connection established');
    return hrmsMongoDb;
  } catch (error) {
    console.error('❌ HRMS MongoDB connection error:', error.message);
    hrmsMongoClient = null;
    hrmsMongoDb = null;
    return null;
  }
};

/**
 * Initialize database connections
 */
export const connectDatabase = async () => {
  try {
    // Connect to student database
    studentPool = createStudentPool();
    const studentConnection = await studentPool.getConnection();
    await studentConnection.ping();
    studentConnection.release();
    console.log(`✅ Student database (${process.env.DB_NAME}) connection established`);

    // Connect to admissions database if configured
    if (process.env.DB_NAME_ADMISSIONS) {
      admissionsPool = createAdmissionsPool();
      const admissionsConnection = await admissionsPool.getConnection();
      await admissionsConnection.ping();
      admissionsConnection.release();
      console.log(`✅ Admissions database (${process.env.DB_NAME_ADMISSIONS}) connection established`);
    }

    // Connect to academic portal database if configured
    if (process.env.DB_NAME_ACADEMIC) {
      try {
        academicPool = createAcademicPool();
        const academicConnection = await academicPool.getConnection();
        await academicConnection.ping();
        academicConnection.release();
        console.log(`✅ Academic portal database (${process.env.DB_NAME_ACADEMIC}) connection established`);
      } catch (acadErr) {
        console.error(`❌ Academic portal database (${process.env.DB_NAME_ACADEMIC}) connection error:`, acadErr.message);
      }
    }

    // Connect to examination portal database if configured
    if (process.env.DB_NAME_EXAMINATION) {
      try {
        examinationPool = createExaminationPool();
        const examinationConnection = await examinationPool.getConnection();
        await examinationConnection.ping();
        examinationConnection.release();
        console.log(`✅ Examination portal database (${process.env.DB_NAME_EXAMINATION}) connection established`);
      } catch (examErr) {
        console.error(`❌ Examination portal database (${process.env.DB_NAME_EXAMINATION}) connection error:`, examErr.message);
      }
    }

    // Connect to HRMS MongoDB if configured
    if (process.env.HRMS_MONGO_URI || process.env.HRMS_MONGO_URL) {
      await connectHRMSMongo();
    }

    // Connect to Hostel MongoDB if configured
    if (process.env.HOSTEL_MONGO_URI || process.env.HOSTEL_MONGO_URL) {
      await connectHostelMongo();
    }

    // Connect to Transport MongoDB if configured
    if (process.env.TRANSPORT_MONGO_URI || process.env.TRANSPORT_MONGO_URL) {
      await connectTransportMongo();
    }

    // Connect to Fee MongoDB if configured
    if (process.env.FEE_MONGO_URI || process.env.FEE_MONGO_URL) {
      await connectFeeMongo();
    }

    // Connect to Stationary MongoDB if configured
    if (process.env.STATIONARY_MONGO_URI || process.env.STATIONARY_MONGO_URL) {
      await connectStationaryMongo();
    }

    return { studentPool, admissionsPool, academicPool, examinationPool, hrmsMongoDb, hostelMongoDb, transportMongoDb, feeMongoDb, stationaryMongoDb };
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

/**
 * Close database connection pools
 */
export const closeDatabase = async () => {
  try {
    if (studentPool) {
      await studentPool.end();
      studentPool = null;
      console.log('✅ Student database connection pool closed');
    }
    if (admissionsPool) {
      await admissionsPool.end();
      admissionsPool = null;
      console.log('✅ Admissions database connection pool closed');
    }
    if (academicPool) {
      await academicPool.end();
      academicPool = null;
      console.log('✅ Academic portal database connection pool closed');
    }
    if (examinationPool) {
      await examinationPool.end();
      examinationPool = null;
      console.log('✅ Examination portal database connection pool closed');
    }
    if (hrmsMongoClient) {
      await hrmsMongoClient.close();
      hrmsMongoClient = null;
      hrmsMongoDb = null;
      console.log('✅ HRMS MongoDB connection closed');
    }
    if (hostelMongoClient) {
      await hostelMongoClient.close();
      hostelMongoClient = null;
      hostelMongoDb = null;
      console.log('✅ Hostel MongoDB connection closed');
    }
    if (transportMongoClient) {
      await transportMongoClient.close();
      transportMongoClient = null;
      transportMongoDb = null;
      console.log('✅ Transport MongoDB connection closed');
    }
    if (feeMongoClient) {
      await feeMongoClient.close();
      feeMongoClient = null;
      feeMongoDb = null;
      console.log('✅ Fee MongoDB connection closed');
    }
    if (stationaryMongoClient) {
      await stationaryMongoClient.close();
      stationaryMongoClient = null;
      stationaryMongoDb = null;
      console.log('✅ Stationary MongoDB connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
};

/**
 * Get student database pool instance
 */
export const getStudentPool = () => {
  if (!studentPool) {
    return createStudentPool();
  }
  return studentPool;
};

/**
 * Get admissions database pool instance
 */
export const getAdmissionsPool = () => {
  if (!admissionsPool) {
    return createAdmissionsPool();
  }
  return admissionsPool;
};

/**
 * Get database pool instance (legacy - defaults to student database)
 */
export const getPool = () => {
  return getStudentPool();
};

/**
 * Get HRMS MongoDB db instance (lazy connect if URI is set)
 * @returns {Promise<import('mongodb').Db|null>} HRMS db or null if not configured
 */
export const getHRMSDb = async () => {
  if (hrmsMongoDb) {
    return hrmsMongoDb;
  }
  return connectHRMSMongo();
};

/**
 * Connect to Hostel MongoDB (optional; when HOSTEL_MONGO_URI or HOSTEL_MONGO_URL is set)
 * @returns {Promise<import('mongodb').Db|null>} Hostel db instance or null
 */
export const connectHostelMongo = async () => {
  const uri = process.env.HOSTEL_MONGO_URI || process.env.HOSTEL_MONGO_URL;
  if (!uri) {
    return null;
  }
  if (hostelMongoClient) {
    return hostelMongoDb;
  }
  try {
    hostelMongoClient = new MongoClient(uri);
    await hostelMongoClient.connect();
    hostelMongoDb = hostelMongoClient.db();
    console.log('✅ Hostel MongoDB connection established');
    return hostelMongoDb;
  } catch (error) {
    console.error('❌ Hostel MongoDB connection error:', error.message);
    hostelMongoClient = null;
    hostelMongoDb = null;
    return null;
  }
};

/**
 * Get Hostel MongoDB db instance (lazy connect if URI is set)
 * @returns {Promise<import('mongodb').Db|null>} Hostel db or null if not configured
 */
export const getHostelDb = async () => {
  if (hostelMongoDb) {
    return hostelMongoDb;
  }
  return connectHostelMongo();
};

/**
 * Connect to Transport MongoDB (optional; when TRANSPORT_MONGO_URI is set)
 * @returns {Promise<import('mongodb').Db|null>} Transport db instance or null
 */
export const connectTransportMongo = async () => {
  const uri = process.env.TRANSPORT_MONGO_URI || process.env.TRANSPORT_MONGO_URL;
  if (!uri) {
    return null;
  }
  if (transportMongoClient) {
    return transportMongoDb;
  }
  try {
    transportMongoClient = new MongoClient(uri);
    await transportMongoClient.connect();
    transportMongoDb = transportMongoClient.db();
    console.log('✅ Transport MongoDB connection established');
    return transportMongoDb;
  } catch (error) {
    console.error('❌ Transport MongoDB connection error:', error.message);
    transportMongoClient = null;
    transportMongoDb = null;
    return null;
  }
};

/**
 * Get Transport MongoDB db instance (lazy connect if URI is set)
 * @returns {Promise<import('mongodb').Db|null>} Transport db or null if not configured
 */
export const getTransportDb = async () => {
  if (transportMongoDb) {
    return transportMongoDb;
  }
  return connectTransportMongo();
};

/**
 * Connect to Fee MongoDB (optional; when FEE_MONGO_URI is set)
 * @returns {Promise<import('mongodb').Db|null>} Fee db instance or null
 */
export const connectFeeMongo = async () => {
  const uri = process.env.FEE_MONGO_URI || process.env.FEE_MONGO_URL;
  if (!uri) {
    return null;
  }
  if (feeMongoClient) {
    return feeMongoDb;
  }
  try {
    feeMongoClient = new MongoClient(uri);
    await feeMongoClient.connect();
    feeMongoDb = feeMongoClient.db();
    console.log('✅ Fee MongoDB connection established');
    return feeMongoDb;
  } catch (error) {
    console.error('❌ Fee MongoDB connection error:', error.message);
    feeMongoClient = null;
    feeMongoDb = null;
    return null;
  }
};

/**
 * Get Fee MongoDB db instance (lazy connect if URI is set)
 * @returns {Promise<import('mongodb').Db|null>} Fee db or null if not configured
 */
export const getFeeDb = async () => {
  if (feeMongoDb) {
    return feeMongoDb;
  }
  return connectFeeMongo();
};

/**
 * Connect to Stationary MongoDB (optional; when STATIONARY_MONGO_URI or STATIONARY_MONGO_URL is set)
 * @returns {Promise<import('mongodb').Db|null>} Stationary db instance or null
 */
export const connectStationaryMongo = async () => {
  const uri = process.env.STATIONARY_MONGO_URI || process.env.STATIONARY_MONGO_URL;
  if (!uri) {
    return null;
  }
  if (stationaryMongoClient) {
    return stationaryMongoDb;
  }
  try {
    stationaryMongoClient = new MongoClient(uri);
    await stationaryMongoClient.connect();
    stationaryMongoDb = stationaryMongoClient.db();
    console.log('✅ Stationary MongoDB connection established');
    return stationaryMongoDb;
  } catch (error) {
    console.error('❌ Stationary MongoDB connection error:', error.message);
    stationaryMongoClient = null;
    stationaryMongoDb = null;
    return null;
  }
};

/**
 * Get Stationary MongoDB db instance (lazy connect if URI is set)
 * @returns {Promise<import('mongodb').Db|null>} Stationary db or null if not configured
 */
export const getStationaryDb = async () => {
  if (stationaryMongoDb) {
    return stationaryMongoDb;
  }
  return connectStationaryMongo();
};

/**
 * Connect to Staff Recruitment System (SRS) MongoDB (optional; when SRS_MONGO_URI or STAFF_RECRUITMENT_MONGO_URI is set)
 * @returns {Promise<import('mongodb').Db|null>} SRS db instance or null
 */
export const connectSRSMongo = async () => {
  const uri = process.env.SRS_MONGO_URI || process.env.STAFF_RECRUITMENT_MONGO_URI || process.env.SRS_MONGO_URL;
  if (!uri) {
    return null;
  }
  if (srsMongoClient) {
    return srsMongoDb;
  }
  try {
    srsMongoClient = new MongoClient(uri);
    await srsMongoClient.connect();
    srsMongoDb = srsMongoClient.db();
    console.log('✅ Staff Recruitment System (SRS) MongoDB connection established');
    return srsMongoDb;
  } catch (error) {
    console.error('❌ SRS MongoDB connection error:', error.message);
    srsMongoClient = null;
    srsMongoDb = null;
    return null;
  }
};

/**
 * Get SRS MongoDB db instance (lazy connect if URI is set)
 * @returns {Promise<import('mongodb').Db|null>} SRS db or null if not configured
 */
export const getSRSDb = async () => {
  if (srsMongoDb) {
    return srsMongoDb;
  }
  return connectSRSMongo();
};

export default {
  createPool,
  createStudentPool,
  createAdmissionsPool,
  connectDatabase,
  closeDatabase,
  connectHRMSMongo,
  getHRMSDb,
  connectHostelMongo,
  getHostelDb,
  connectTransportMongo,
  getTransportDb,
  connectFeeMongo,
  getFeeDb,
  connectStationaryMongo,
  getStationaryDb,
  connectSRSMongo,
  getSRSDb,
  getPool,
  getStudentPool,
  getAdmissionsPool,
  createAcademicPool,
  getAcademicPool,
};
