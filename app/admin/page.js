// app/admin/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import * as apiClient from "@/lib/apiClient"; // Adjust path

// A client-side component to protect the admin page content
function AdminGuard({ children }) {
  const [isAdmin, setIsAdmin] = useState(null); // null: loading, true: admin, false: not admin
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);
      const token = apiClient.getToken();
      if (!token) {
        setIsAdmin(false);
        setIsLoading(false);
        // Optionally redirect to login or home using Next.js router
        // import { useRouter } from 'next/navigation';
        // const router = useRouter(); router.push('/');
        return;
      }
      try {
        const user = await apiClient.getCurrentUserAPI(); // Fetches /api/auth/me
        if (user && user.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          // router.push("/"); // Example redirect using Next.js router
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAdminStatus();
  }, []);

  if (isLoading) {
    return <div className="p-10 text-center">Loading admin access...</div>;
  }
  if (!isAdmin) {
    return (
      <div className="p-10 text-center text-red-500">
        Access Denied. You are not authorized to view this page.
      </div>
    );
  }
  return <>{children}</>;
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // User object being edited
  const [editFormData, setEditFormData] = useState({
    credits: "",
    role: "",
    isBlacklisted: false,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  const fetchUsers = useCallback(
    async (page = 1) => {
      setIsLoadingUsers(true);
      try {
        // This API call will be protected by middleware ensuring only admin can access
        const response = await apiClient.fetchWithAuth(
          `/api/admin/users?page=${page}&limit=${pagination.limit}`
        );
        setUsers(response.users);
        setPagination((prev) => ({
          ...prev,
          currentPage: response.currentPage,
          totalPages: response.totalPages,
        }));
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to fetch users: " + error.message);
      } finally {
        setIsLoadingUsers(false);
      }
    },
    [pagination.limit]
  ); // Add other dependencies if necessary

  useEffect(() => {
    fetchUsers(pagination.currentPage);
  }, [fetchUsers, pagination.currentPage]); // Fetch when page changes

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      credits: user.credits.toString(),
      role: user.role,
      isBlacklisted: user.isBlacklisted,
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveUserUpdate = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const updates = {
      credits: parseInt(editFormData.credits),
      role: editFormData.role,
      isBlacklisted: editFormData.isBlacklisted,
    };

    // Basic validation
    if (isNaN(updates.credits) || updates.credits < 0) {
      toast.error("Credits must be a non-negative number.");
      return;
    }

    try {
      // API call to backend: PUT /api/admin/users/:userId
      await apiClient.fetchWithAuth(`/api/admin/users/${editingUser._id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      toast.success("User updated successfully!");
      setEditingUser(null); // Close edit form
      fetchUsers(pagination.currentPage); // Refresh user list
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(
        "Failed to update user: " + (error.data?.message || error.message)
      );
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  return (
    <AdminGuard>
      {" "}
      {/* Wrap content in AdminGuard */}
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Admin Dashboard
        </h1>

        {/* User Management Section */}
        <section className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            User Management
          </h2>
          {isLoadingUsers && <p>Loading users...</p>}
          {!isLoadingUsers && users.length === 0 && <p>No users found.</p>}

          {!isLoadingUsers && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blacklisted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.credits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isBlacklisted
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.isBlacklisted ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Edit User Modal/Form (simplified inline for now) */}
          {editingUser && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Edit User: {editingUser.username}
              </h3>
              <form onSubmit={handleSaveUserUpdate} className="space-y-4">
                <div>
                  <label
                    htmlFor="credits"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Credits
                  </label>
                  <input
                    type="number"
                    name="credits"
                    id="credits"
                    value={editFormData.credits}
                    onChange={handleEditFormChange}
                    min="0"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Role
                  </label>
                  <select
                    name="role"
                    id="role"
                    value={editFormData.role}
                    onChange={handleEditFormChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isBlacklisted"
                    id="isBlacklisted"
                    checked={editFormData.isBlacklisted}
                    onChange={handleEditFormChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="isBlacklisted"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Blacklist User
                  </label>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
        {/* Add more admin sections here (e.g., view app stats, content moderation if needed) */}
      </div>
    </AdminGuard>
  );
}
