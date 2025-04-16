export const handleLogout = (navigate) => {
  const confirmLogout = window.confirm("Are you sure you want to log out?");
  if (confirmLogout) {
    localStorage.removeItem('user');
    navigate('/');
  }
};
