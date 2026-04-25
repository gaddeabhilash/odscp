const mongoose = require('mongoose');

const mockData = {
  users: [
    {
      _id: 'mock-admin-id',
      id: 'mock-admin-id',
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashed_password',
      role: 'admin',
      matchPassword: async () => true,
      createdAt: new Date(),
    },
    {
      _id: 'mock-client-id',
      id: 'mock-client-id',
      name: 'Client User',
      email: 'client@example.com',
      password: 'hashed_password',
      role: 'client',
      matchPassword: async () => true,
      createdAt: new Date(),
    }
  ],
  projects: [
    {
      _id: 'mock-project-id',
      id: 'mock-project-id',
      clientId: 'mock-client-id',
      projectName: 'Luxury Villa Design',
      status: 'In Progress',
      progress: 45,
      createdAt: new Date(),
    }
  ],
  updates: [
    {
      _id: 'mock-update-id',
      id: 'mock-update-id',
      projectId: 'mock-project-id',
      title: 'Initial Concept Approved',
      description: 'The client has approved the initial 3D renders.',
      mediaUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6',
      mediaType: 'image',
      createdAt: new Date(),
    }
  ],
  files: [
    {
      _id: 'mock-file-1',
      id: 'mock-file-1',
      projectId: 'mock-project-id',
      fileName: 'Final Floor Plan.pdf',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      filePublicId: 'mock-public-id-1',
      createdAt: new Date(),
    },
    {
      _id: 'mock-file-2',
      id: 'mock-file-2',
      projectId: 'mock-project-id',
      fileName: 'Project Quotation v2.pdf',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      filePublicId: 'mock-public-id-2',
      createdAt: new Date(),
    }
  ]
};

const setupMockDb = () => {
  if (process.env.USE_MOCK_DB !== 'true') return;

  console.log('Intercepting Mongoose models for Mock Mode...');

  const wrapResult = (res) => {
    if (!res) return res;
    const addMethods = (item) => ({
      ...item,
      id: item._id.toString(),
      deleteOne: async () => ({ deletedCount: 1 }),
      populate: async function() { return this; },
      save: async function() { return this; },
      matchPassword: item.matchPassword || (async () => true),
    });

    if (Array.isArray(res)) return res.map(addMethods);
    return addMethods(res);
  };

  const createMockQuery = (data) => {
    const query = {
      data: wrapResult(data),
      select: function() { return this; },
      populate: function() { return this; },
      sort: function() { return this; },
      skip: function() { return this; },
      limit: function() { return this; },
      exec: async function() { return this.data; },
      // Important: then must behave like a real promise
      then: function(onFulfilled, onRejected) {
        return Promise.resolve(this.data).then(onFulfilled, onRejected);
      },
      catch: function(onRejected) {
        return Promise.resolve(this.data).catch(onRejected);
      }
    };
    return query;
  };

  // Mock User
  const User = mongoose.model('User');
  User.findOne = (filter) => createMockQuery(mockData.users.find(u => 
    u.email === filter.email || 
    (filter._id && u._id === filter._id.toString())
  ));
  User.findById = (id) => createMockQuery(mockData.users.find(u => u._id === id.toString()));
  User.find = (filter) => {
    let results = mockData.users;
    if (filter && filter.role) results = results.filter(u => u.role === filter.role);
    return createMockQuery(results);
  };
  User.countDocuments = async () => mockData.users.length;
  User.create = async (data) => {
    const id = `mock-${Date.now()}`;
    const newUser = { ...data, _id: id, id, createdAt: new Date() };
    mockData.users.push(newUser);
    return wrapResult(newUser);
  };

  // Mock Project
  const Project = mongoose.model('Project');
  Project.find = (filter) => {
    let results = mockData.projects;
    if (filter && filter.clientId) results = results.filter(p => p.clientId === filter.clientId);
    return createMockQuery(results);
  };
  Project.findById = (id) => createMockQuery(mockData.projects.find(p => p._id === id.toString()));
  Project.countDocuments = async (filter) => {
    let results = mockData.projects;
    if (filter && filter.clientId) results = results.filter(p => p.clientId === filter.clientId);
    return results.length;
  };
  Project.create = async (data) => {
    const id = `mock-${Date.now()}`;
    const newProject = { ...data, _id: id, id, createdAt: new Date() };
    mockData.projects.push(newProject);
    return wrapResult(newProject);
  };
  Project.findByIdAndUpdate = (id, data) => {
    const idx = mockData.projects.findIndex(p => p._id === id.toString());
    if (idx !== -1) {
      mockData.projects[idx] = { ...mockData.projects[idx], ...data };
      return createMockQuery(mockData.projects[idx]);
    }
    return createMockQuery(null);
  };

  // Mock Update
  const Update = mongoose.model('Update');
  Update.find = (filter) => {
    let results = mockData.updates;
    if (filter && filter.projectId) results = results.filter(u => u.projectId === filter.projectId);
    return createMockQuery(results);
  };
  Update.findById = (id) => createMockQuery(mockData.updates.find(u => u._id === id.toString()));
  Update.countDocuments = async (filter) => {
    let results = mockData.updates;
    if (filter && filter.projectId) results = results.filter(u => u.projectId === filter.projectId);
    return results.length;
  };
  Update.create = async (data) => {
    const id = `mock-${Date.now()}`;
    const newUpdate = { ...data, _id: id, id, createdAt: new Date() };
    mockData.updates.push(newUpdate);
    return wrapResult(newUpdate);
  };

  // Mock File
  const FileModel = mongoose.model('File');
  FileModel.find = (filter) => {
    let results = mockData.files;
    if (filter && filter.projectId) results = results.filter(f => f.projectId === filter.projectId);
    return createMockQuery(results);
  };
  FileModel.create = async (data) => {
    const id = `mock-${Date.now()}`;
    const newFile = { ...data, _id: id, id, createdAt: new Date() };
    mockData.files.push(newFile);
    return wrapResult(newFile);
  };
};

module.exports = setupMockDb;
