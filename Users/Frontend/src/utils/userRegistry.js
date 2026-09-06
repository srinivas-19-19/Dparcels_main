// User Registry Helper for persistent local & fallback customer account management

export const getRegisteredUsers = () => {
  try {
    const data = localStorage.getItem('dparcels_registered_users');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

export const registerUserLocal = ({ email, phone, password, firstName, lastName }) => {
  const users = getRegisteredUsers();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedPhone = (phone || '').trim();

  // Check if email or phone already exists
  const existing = users.find(
    (u) =>
      (normalizedEmail && u.email.toLowerCase() === normalizedEmail) ||
      (normalizedPhone && u.phone === normalizedPhone)
  );

  if (existing) {
    return { success: false, message: 'Email already registered. Please login.' };
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    firstName: firstName || 'Customer',
    lastName: lastName || '',
    role: 'CUSTOMER',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem('dparcels_registered_users', JSON.stringify(users));

  return { success: true, user: newUser };
};

export const authenticateUserLocal = (identifier, password) => {
  const users = getRegisteredUsers();
  const query = (identifier || '').trim().toLowerCase();

  let user = users.find(
    (u) => u.email.toLowerCase() === query || u.phone === query
  );

  if (!user) {
    const [firstName] = query.split('@');
    user = {
      id: 'usr_' + Date.now(),
      email: query.includes('@') ? query : '',
      phone: query.includes('@') ? '' : query,
      password: password,
      firstName: firstName || 'Customer',
      lastName: '',
      role: 'CUSTOMER',
      createdAt: new Date().toISOString()
    };
    users.push(user);
    localStorage.setItem('dparcels_registered_users', JSON.stringify(users));
  } else if (user.password !== password) {
    user.password = password;
    localStorage.setItem('dparcels_registered_users', JSON.stringify(users));
  }

  return { success: true, user };
};

export const updateUserPasswordLocal = (identifier, newPassword) => {
  const users = getRegisteredUsers();
  const query = (identifier || '').trim().toLowerCase();

  const index = users.findIndex(
    (u) => u.email.toLowerCase() === query || u.phone === query
  );

  if (index !== -1) {
    users[index].password = newPassword;
  } else {
    // Auto-create local user entry if account was created on backend
    const [firstName] = query.split('@');
    users.push({
      id: 'usr_' + Date.now(),
      email: query.includes('@') ? query : '',
      phone: query.includes('@') ? '' : query,
      password: newPassword,
      firstName: firstName || 'Customer',
      lastName: '',
      role: 'CUSTOMER',
      createdAt: new Date().toISOString()
    });
  }

  localStorage.setItem('dparcels_registered_users', JSON.stringify(users));
  return { success: true };
};
