const { describe, it, before, after, beforeEach } = require('mocha');
const chai = require('chai');
const { expect } = chai;
const chaiHttp = require('chai-http');
const HttpStatus = require('http-status-codes');
chai.use(chaiHttp);

const createApplication = require('../../app');
const app = createApplication();
const FirebaseDb = require('../../mocks/firebase-db.service');
const { initializeTest, mongodbHelper, userHelper } = require('../../helpers');
const seedRoles = require('../role/role.seeder');
const seedUsers = require('../user/user.seeder');
const seedCourses = require('../course/course.seeder');

let users = {
  admin: { user: null, idToken: null },
  defaultUser1: { user: null, idToken: null }
};
let testAdmin = {
  displayName: 'SysAdmin',
  email: 'sysadmin@mcq.com',
  password: 'Admin123@'
};
let testUser1 = {
  displayName: 'Default User',
  email: 'defaultuser@mcq.com',
  password: 'defaultuser'
};
let testCourse;
let tempCourse = {};

describe('Courses Endpoint Test', () => {
  before(async () => {
    await initializeTest();
  });

  after(async () => {
    FirebaseDb.clearDb();
    await mongodbHelper.clearDb();
    await mongodbHelper.closeConnection();
  });

  beforeEach(async () => {
    FirebaseDb.clearDb();
    await mongodbHelper.clearDb();

    await seedRoles();
    [testAdmin, testUser1] = await seedUsers.generate(2);

    const admin = await userHelper.createAdminAndSignIn(testAdmin);
    const defaultUser1 = await userHelper.createUserAndSignIn(testUser1);
    users = { admin, defaultUser1 };

    testCourse = await seedCourses.generateOneAndSave();
    tempCourse = await seedCourses.generateOne();
  });

  describe('POST /api/v1/courses', () => {
    it('should fail with a status 401 if the requester is signed in', async () => {
      const res = await chai.request(app).post('/api/v1/courses').send({ course: tempCourse });
      expect(res.error).to.be.an('error');
      expect(res).to.have.status(HttpStatus.UNAUTHORIZED);
    });

    it('should fail with a status 401 if the requester is not admin', async () => {
      const res = await chai.request(app).post('/api/v1/courses')
        .set('Authorization', users.defaultUser1.idToken).send({ course: tempCourse });
      expect(res.error).to.be.an('error');
      expect(res).to.have.status(HttpStatus.UNAUTHORIZED);
    });

    it('should fail with a status 401 if the `createdBy` field is not set', async () => {
      delete tempCourse.createdBy;
      const res = await chai.request(app).post('/api/v1/courses')
        .set('Authorization', users.admin.idToken).send({ course: tempCourse });
      expect(res.error).to.be.an('error');
      expect(res).to.have.status(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should create a course, and return a status of 201', async () => {
      const res = await chai.request(app).post('/api/v1/courses')
        .set('Authorization', users.admin.idToken).send({ course: tempCourse });
      expect(res.error).to.be.false;
      expect(res.body.data).to.be.an('object');
      expect(res).to.have.status(HttpStatus.CREATED);
    });
  });

  describe('GET /api/v1/courses', () => {
    it('should fetch all courses and have a status of 200', async () => {
      const res = await chai.request(app).get('/api/v1/courses');
      expect(res.error).to.be.false;
      expect(res.body.data).to.be.an('array');
      expect(res).to.have.status(HttpStatus.OK);
    });
  });

  describe('GET /api/v1/courses/:id', () => {
    it('should fetch course details by id if they exist', async () => {
      const res = await chai.request(app).get(`/api/v1/courses/${testCourse.id}`);
      expect(res.error).to.be.false;
      expect(res.body.data).to.be.an('object');
      expect(res).to.have.status(HttpStatus.OK);
    });

    it('should return 404 if there\'s no course with the given id', async () => {
      const fakeId = FirebaseDb.makeId(24);
      const res = await chai.request(app).get(`/api/v1/courses/${fakeId}`);
      expect(res.error).to.be.an('error');
      expect(res).to.have.status(HttpStatus.NOT_FOUND);
    });
  });

  describe('PUT /api/v1/courses/:id', () => {
    it('should fail with a status 401, if the requester is not an administrator', async () => {
      const res = await chai.request(app).put(`/api/v1/courses/${testCourse.id}`)
        .set('Authorization', users.defaultUser1.idToken).send({ course: tempCourse });
      expect(res.error).to.be.an('error');
      expect(res).to.have.status(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 if there\'s no course with the given id', async () => {
      const fakeId = FirebaseDb.makeId(24);
      const res = await chai.request(app).put(`/api/v1/courses/${fakeId}`)
        .set('Authorization', users.admin.idToken).send({ course: tempCourse });
      expect(res.error).to.be.an('error');
      expect(res).to.have.status(HttpStatus.NOT_FOUND);
    });

    it('should update course information', async () => {
      const res = await chai.request(app).put(`/api/v1/courses/${testCourse.id}`)
        .set('Authorization', users.admin.idToken).send({ course: tempCourse });
      expect(res.body.data).to.not.be.empty;
      expect(res).to.have.status(HttpStatus.OK);
    });
  });

  describe('DELETE /api/v1/courses/:id', () => {
    it('should fail with a status 401, if the requester is not an administrator', async () => {
      const res = await chai.request(app).delete(`/api/v1/courses/${testCourse.id}`)
        .set('Authorization', users.defaultUser1.idToken);
      expect(res.error).to.be.an('error');
      expect(res).to.have.status(HttpStatus.UNAUTHORIZED);
    });

    it('should return a status of 204, if the requester is an administrator', async () => {
      const res = await chai.request(app).delete(`/api/v1/courses/${testCourse.id}`)
        .set('Authorization', users.admin.idToken);
      expect(res.error).to.be.false;
      expect(res.body).to.be.empty;
      expect(res).to.have.status(HttpStatus.NO_CONTENT);
    });
  });
});
