const multer = require('multer');

// Use memory storage — file lands in req.file.buffer, never on disk or Cloudinary
const mockUpload = multer({ storage: multer.memoryStorage() });

// In-memory "session" store so /auth/me returns the right user
let currentUser = null;

const mockData = {
  users: [
    {
      _id: 'mock-admin-id',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date(),
    },
    {
      _id: 'mock-client-id',
      name: 'Client User',
      email: 'client@example.com',
      role: 'client',
      createdAt: new Date(),
    },
  ],
  projects: [
    {
      _id: 'mock-project-id',
      id: 'mock-project-id',
      clientId: {
        _id: 'mock-client-id',
        name: 'Client User',
        email: 'client@example.com',
      },
      projectName: 'Luxury Villa Design',
      status: 'In Progress',
      progress: 45,
      createdAt: new Date(),
    },
    {
      _id: 'mock-project-id-2',
      id: 'mock-project-id-2',
      clientId: {
        _id: 'mock-client-id',
        name: 'Client User',
        email: 'client@example.com',
      },
      projectName: 'Modern Apartment Renovation',
      status: 'Planning',
      progress: 15,
      createdAt: new Date(),
    },
  ],
  updates: [
    {
      _id: 'mock-update-id',
      projectId: 'mock-project-id',
      title: 'Initial Concept Approved',
      description:
        'The client has approved the initial 3D renders. Moving on to detailed planning.',
      mediaUrl:
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
      mediaType: 'image',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      _id: 'mock-update-id-2',
      projectId: 'mock-project-id',
      title: 'Material Selection Complete',
      description:
        'Finalized marble and hardwood selections. Samples dispatched for client approval.',
      mediaUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      mediaType: 'image',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ],
  files: [
    {
      _id: 'mock-file-1',
      projectId: 'mock-project-id',
      fileName: 'Final Floor Plan v3.pdf',
      fileUrl:
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      _id: 'mock-file-2',
      projectId: 'mock-project-id',
      fileName: 'Project Quotation v2.pdf',
      fileUrl:
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      _id: 'mock-file-3',
      projectId: 'mock-project-id',
      fileName: 'Material Mood Board.pdf',
      fileUrl:
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      createdAt: new Date(),
    },
  ],
};

// (no pool needed — actual uploaded file is converted to base64)

const mockApiMiddleware = (req, res, next) => {
  if (process.env.USE_MOCK_DB !== 'true') return next();
  if (!req.originalUrl.startsWith('/api')) return next();

  const method = req.method;
  const path = req.originalUrl.split('?')[0];

  console.log(`[MOCK API] ${method} ${path}`);

  const send = (data, status = 200) =>
    res.status(status).json({ success: true, data });

  // ── POST /api/updates — needs multipart parsing first ───────────────────
  if (path === '/api/updates' && method === 'POST') {
    // Use multer to parse the multipart form so req.body and req.file are set
    return mockUpload.single('media')(req, res, (err) => {
      if (err) {
        console.error('[MOCK API] Multer error:', err);
        return res.status(400).json({ success: false, message: err.message });
      }

      const { projectId, title, description } = req.body;

      if (!projectId || !title) {
        return res.status(400).json({
          success: false,
          message: 'projectId and title are required',
        });
      }

      // Convert the uploaded file buffer directly to a base64 data URL
      // so the ACTUAL uploaded image/video is displayed — no Cloudinary needed
      let mediaUrl = '';
      let mediaType = '';
      if (req.file) {
        mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
        const base64 = req.file.buffer.toString('base64');
        mediaUrl = `data:${req.file.mimetype};base64,${base64}`;
      }

      const newUpdate = {
        _id: `update-${Date.now()}`,
        projectId,
        title,
        description: description || '',
        mediaUrl,
        mediaType,
        createdAt: new Date(),
      };

      mockData.updates.unshift(newUpdate); // Add to top (most recent first)
      console.log(`[MOCK API] Created update: "${title}" for project ${projectId}`);
      return send(newUpdate, 201);
    });
  }

  try {
    // ── Auth ───────────────────────────────────────────────────────────────
    if (path === '/api/auth/login' && method === 'POST') {
      const { email } = req.body;
      const user =
        mockData.users.find((u) => u.email === email) || mockData.users[0];
      currentUser = user;
      return send({ ...user, token: 'mock-token' });
    }

    if (path === '/api/auth/me') {
      return send(currentUser || mockData.users[0]);
    }

    // ── Users ──────────────────────────────────────────────────────────────
    if (path === '/api/users' && method === 'GET') {
      return res.json({
        success: true,
        data: mockData.users,
        total: mockData.users.length,
      });
    }

    if (path === '/api/users' && method === 'POST') {
      const newUser = {
        ...req.body,
        _id: `user-${Date.now()}`,
        createdAt: new Date(),
      };
      mockData.users.push(newUser);
      return send(newUser, 201);
    }

    const userDeleteMatch = path.match(/^\/api\/users\/([^/]+)$/);
    if (userDeleteMatch && method === 'DELETE') {
      const id = userDeleteMatch[1];
      const idx = mockData.users.findIndex((u) => u._id === id);
      if (idx !== -1) mockData.users.splice(idx, 1);
      return send({ message: 'User deleted' });
    }

    // PATCH /api/users/:id — edit user
    const userPatchMatch = path.match(/^\/api\/users\/([^/]+)$/);
    if (userPatchMatch && method === 'PATCH') {
      const id = userPatchMatch[1];
      const idx = mockData.users.findIndex((u) => u._id === id);
      if (idx !== -1) {
        mockData.users[idx] = { ...mockData.users[idx], ...req.body };
        return send(mockData.users[idx]);
      }
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // ── Projects ───────────────────────────────────────────────────────────
    if (path === '/api/projects' && method === 'GET') {
      return res.json({
        success: true,
        data: mockData.projects,
        total: mockData.projects.length,
      });
    }

    // GET /api/projects/client/:clientId — filter by assigned client
    if (path.includes('/api/projects/client/')) {
      const clientId = path.split('/api/projects/client/')[1];
      const filtered = mockData.projects.filter(
        (p) => p._clientId === clientId || p.clientId?._id === clientId
      );
      return res.json({ success: true, data: filtered });
    }

    if (path === '/api/projects' && method === 'POST') {
      const clientUser = mockData.users.find((u) => u._id === req.body.clientId);
      const projId = `proj-${Date.now()}`;
      const newProject = {
        ...req.body,
        _id: projId,
        id: projId,
        _clientId: req.body.clientId, // store raw id for filtering
        clientId: clientUser
          ? { _id: clientUser._id, name: clientUser.name, email: clientUser.email }
          : { _id: req.body.clientId, name: 'Unknown Client' },
        progress: req.body.progress || 0,
        createdAt: new Date(),
      };
      mockData.projects.push(newProject);
      return send(newProject, 201);
    }

    // DELETE /api/projects/:id
    const projectDeleteMatch = path.match(/^\/api\/projects\/([^/]+)$/);
    if (projectDeleteMatch && method === 'DELETE') {
      const id = projectDeleteMatch[1];
      const idx = mockData.projects.findIndex((p) => p._id === id);
      if (idx !== -1) mockData.projects.splice(idx, 1);
      return send({ message: 'Project deleted' });
    }

    const projectPatchMatch = path.match(/^\/api\/projects\/([^/]+)$/);
    if (projectPatchMatch && method === 'PATCH') {
      const id = projectPatchMatch[1];
      const idx = mockData.projects.findIndex((p) => p._id === id);
      if (idx !== -1) {
        mockData.projects[idx] = { ...mockData.projects[idx], ...req.body };
        return send(mockData.projects[idx]);
      }
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    // ── Updates ────────────────────────────────────────────────────────────
    if (path.includes('/api/updates/project/')) {
      const projectId = path.split('/').pop();
      const filtered = mockData.updates.filter(
        (u) => u.projectId === projectId
      );
      const result = filtered.length > 0 ? filtered : mockData.updates;
      return res.json({ success: true, data: result, total: result.length });
    }

    const updateDeleteMatch = path.match(/^\/api\/updates\/([^/]+)$/);
    if (updateDeleteMatch && method === 'DELETE') {
      const id = updateDeleteMatch[1];
      const idx = mockData.updates.findIndex((u) => u._id === id);
      if (idx !== -1) mockData.updates.splice(idx, 1);
      return send({ message: 'Update deleted' });
    }

    // ── Files ──────────────────────────────────────────────────────────────
    if (path.includes('/api/files/project/')) {
      const projectId = path.split('/api/files/project/')[1];
      const filtered = mockData.files.filter((f) => f.projectId === projectId);
      return send(filtered.length > 0 ? filtered : mockData.files);
    }

    // POST /api/files — document upload for project
    if (path === '/api/files' && method === 'POST') {
      return mockUpload.single('document')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        const { projectId, fileName } = req.body;
        let fileUrl = '';
        if (req.file) {
          const base64 = req.file.buffer.toString('base64');
          fileUrl = `data:${req.file.mimetype};base64,${base64}`;
        }
        const newFile = {
          _id: `file-${Date.now()}`,
          projectId: projectId || 'mock-project-id',
          fileName: fileName || req.file?.originalname || 'document.pdf',
          fileUrl,
          createdAt: new Date(),
        };
        mockData.files.unshift(newFile);
        return send(newFile, 201);
      });
    }

    // Fallback
    console.log(`[MOCK API] No match for ${path} — returning empty`);
    return send([]);
  } catch (err) {
    console.error('[MOCK API ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = mockApiMiddleware;
