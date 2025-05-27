// app/admin/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import * as apiClient from "@/lib/apiClient";
import Loader from "@/components/Loader";

// A client-side component to protect the admin page content
function AdminGuard({ children }) {
  const [isAdmin, setIsAdmin] = useState(null); // null: loading, true: admin, false: not admin
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoadingAccess(true);
      const token = apiClient.getToken();
      if (!token) {
        setIsAdmin(false);
        setIsLoadingAccess(false);
        // For a real app, you'd likely redirect using Next.js router
        // import { useRouter } from 'next/navigation';
        // const router = useRouter();
        // router.replace('/'); // or router.replace('/login');
        return;
      }
      try {
        const user = await apiClient.getCurrentUserAPI(); // Fetches /api/auth/me
        if (user && user.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          // router.replace('/'); // Redirect non-admins
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast.error("Could not verify admin status. Please try again later.");
        setIsAdmin(false);
      } finally {
        setIsLoadingAccess(false);
      }
    };
    checkAdminStatus();
  }, []);

  if (isLoadingAccess) {
    return (
      <Loader show={true} text="Verifying admin access..." fullPage={true} />
    );
  }
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6 sm:p-10 text-center">
        <i className="fas fa-exclamation-triangle fa-3x mb-4 text-red-500"></i>
        <h2 className="text-2xl font-semibold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">
          You are not authorized to view this page.
        </p>
        {/* Consider adding a button to navigate to the homepage */}
        {/* <button onClick={() => router.push('/')} className="mt-6 ...">Go Home</button> */}
      </div>
    );
  }
  return <>{children}</>;
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState(null); // User object being edited
  const [editFormData, setEditFormData] = useState({
    credits: "",
    role: "user", // Default role for form
    isBlacklisted: false,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10, // Number of users per page
  });
  const [isSavingUpdate, setIsSavingUpdate] = useState(false);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setIsLoadingUsers(true);
      try {
        const response = await apiClient.fetchWithAuth(
          `/api/admin/users?page=${page}&limit=${pagination.limit}`
        );
        setUsers(response.users || []);
        setPagination((prev) => ({
          ...prev,
          currentPage: response.currentPage,
          totalPages: response.totalPages,
          totalUsers: response.totalUsers,
        }));
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error(
          `Failed to fetch users: ${error.data?.message || error.message}`
        );
        setUsers([]); // Clear users on error
      } finally {
        setIsLoadingUsers(false);
      }
    },
    [pagination.limit] // Re-fetch if limit changes (though not implemented here)
  );

  // Initial fetch and re-fetch when currentPage changes
  useEffect(() => {
    fetchUsers(pagination.currentPage);
  }, [fetchUsers, pagination.currentPage]);

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      credits: user.credits.toString(),
      role: user.role,
      isBlacklisted: user.isBlacklisted,
    });
    // Scroll to edit form
    const editFormElement = document.getElementById("editUserFormSection");
    editFormElement?.scrollIntoView({ behavior: "smooth", block: "center" });
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

    setIsSavingUpdate(true);
    const toastId = toast.loading("Updating user details...");

    const updates = {
      credits: parseInt(editFormData.credits),
      role: editFormData.role,
      isBlacklisted: editFormData.isBlacklisted,
    };

    if (isNaN(updates.credits) || updates.credits < 0) {
      toast.dismiss(toastId);
      toast.error("Credits must be a non-negative number.");
      setIsSavingUpdate(false);
      return;
    }

    try {
      await apiClient.fetchWithAuth(`/api/admin/users/${editingUser._id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      toast.dismiss(toastId);
      toast.success("User updated successfully!");
      setEditingUser(null); // Close/clear edit form
      fetchUsers(pagination.currentPage); // Refresh user list to show changes
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Error updating user:", error);
      toast.error(
        `Failed to update user: ${error.data?.message || error.message}`
      );
    } finally {
      setIsSavingUpdate(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.totalPages &&
      newPage !== pagination.currentPage
    ) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  return (
    <AdminGuard>
      <div className="p-2 sm:p-4 bg-slate-50 min-h-screen">
        <section className="bg-white shadow-xl rounded-xl p-4 sm:p-4 lg:p-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-5 sm:mb-6 text-gray-700 border-b pb-3">
            User Management
          </h2>

          {isLoadingUsers && (
            <Loader show={true} text="Loading users..." fullPage={false} />
          )}

          {!isLoadingUsers && users.length === 0 && (
            <p className="text-center text-gray-500 py-8">No users found.</p>
          )}

          {!isLoadingUsers && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed sm:table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Blacklisted
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                        {user.username}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.credits}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {user.role}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isBlacklisted
                              ? "bg-red-100 text-red-800 ring-1 ring-red-200"
                              : "bg-green-100 text-green-800 ring-1 ring-green-200"
                          }`}
                        >
                          {user.isBlacklisted ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          disabled={isSavingUpdate}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(pagination.currentPage - 1) * pagination.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.currentPage * pagination.limit,
                        pagination.totalUsers
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{pagination.totalUsers}</span>{" "}
                    results
                  </p>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={pagination.currentPage <= 1 || isLoadingUsers}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {/* Add page number buttons here if desired */}
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={
                        pagination.currentPage >= pagination.totalPages ||
                        isLoadingUsers
                      }
                      className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>
          )}

          {/* Edit User Form Section */}
          {editingUser && (
            <div
              id="editUserFormSection"
              className="mt-10 border-t border-gray-200 pt-8"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Edit User:{" "}
                <span className="font-mono text-purple-700">
                  {editingUser.username}
                </span>
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                User ID:{" "}
                <span className="font-mono text-xs">{editingUser._id}</span>
              </p>

              <form
                onSubmit={handleSaveUserUpdate}
                className="space-y-6 bg-slate-50 p-6 rounded-lg shadow-md"
              >
                <div>
                  <label
                    htmlFor="adminEditCredits"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Credits
                  </label>
                  <input
                    type="number"
                    name="credits"
                    id="adminEditCredits"
                    value={editFormData.credits}
                    onChange={handleEditFormChange}
                    min="0"
                    disabled={isSavingUpdate}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="adminEditRole"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Role
                  </label>
                  <select
                    name="role"
                    id="adminEditRole"
                    value={editFormData.role}
                    onChange={handleEditFormChange}
                    disabled={isSavingUpdate}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      name="isBlacklisted"
                      id="adminEditIsBlacklisted"
                      checked={editFormData.isBlacklisted}
                      onChange={handleEditFormChange}
                      disabled={isSavingUpdate}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded disabled:opacity-50"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="adminEditIsBlacklisted"
                      className="font-medium text-gray-700"
                    >
                      Blacklist User
                    </label>
                    <p className="text-gray-500">
                      Blacklisted users cannot use chat features.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingUpdate}
                    className="inline-flex items-center justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 min-w-[140px]"
                  >
                    {isSavingUpdate ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    disabled={isSavingUpdate}
                    className="py-2 px-6 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>
    </AdminGuard>
  );
}
