const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get all users (paginated)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const total = await User.countDocuments();
  const users = await User.find().skip(startIndex).limit(limit).select('-password');

  res.status(200).json({
    success: true,
    message: 'Users fetched successfully',
    count: users.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: users,
  });
});

// @desc    Create a user
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'client',
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User removed successfully',
  });
});

// @desc    Update a user
// @route   PATCH /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, password } = req.body;
  
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  
  // If password is provided, we need to hash it (or let the pre-save hook handle it)
  // For simplicity and security, we'll use findById and save if password is changed, 
  // but for name/email/role, we use findByIdAndUpdate.
  
  if (password) {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.password = password;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } else {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404);
      throw new Error('User not found');
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  }
});

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
