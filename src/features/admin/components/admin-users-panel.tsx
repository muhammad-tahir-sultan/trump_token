"use client";

import { useState } from "react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  referralCode: string;
  balanceCents: number;
  totalDepositedCents: number;
  totalWithdrawnCents: number;
  createdAt: string;
};

type AdminUserDetail = AdminUser & {
  passwordPreview: string;
  hasPassword: boolean;
};

type AdminUsersPanelProps = {
  users: AdminUser[];
  onRefresh: () => void;
};

type ModalMode = "view" | "edit" | "balance" | "password" | null;

export function AdminUsersPanel({ users, onRefresh }: AdminUsersPanelProps) {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("user");
  const [formBalance, setFormBalance] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [newPasswordReveal, setNewPasswordReveal] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function openModal(user: AdminUser, mode: ModalMode) {
    setSelectedUser(user);
    setModalMode(mode);
    setMessage("");
    setNewPasswordReveal("");
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormBalance((user.balanceCents / 100).toFixed(2));
    setFormPassword("");

    if (mode === "view" || mode === "password") {
      const res = await fetch(`/api/admin/users/${user.id}`);
      if (res.ok) {
        setUserDetail(await res.json());
      }
    }
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
    setUserDetail(null);
    setNewPasswordReveal("");
  }

  async function runAction(body: Record<string, unknown>) {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Operation failed");
      }

      onRefresh();
      return data;
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!selectedUser) return;

    try {
      await runAction({
        action: "update",
        userId: selectedUser.id,
        name: formName,
        email: formEmail,
        role: formRole,
      });
      setMessage("User updated successfully.");
      closeModal();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
    }
  }

  async function handleSaveBalance() {
    if (!selectedUser) return;

    const balanceCents = Math.round(Number(formBalance) * 100);
    if (Number.isNaN(balanceCents) || balanceCents < 0) {
      setMessage("Enter a valid balance.");
      return;
    }

    try {
      await runAction({
        action: "balance",
        userId: selectedUser.id,
        balanceCents,
      });
      setMessage("Balance updated successfully.");
      closeModal();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Balance update failed.");
    }
  }

  async function handleSavePassword() {
    if (!selectedUser) return;

    try {
      const data = await runAction({
        action: "password",
        userId: selectedUser.id,
        newPassword: formPassword,
      });
      setNewPasswordReveal(data.newPassword);
      setMessage("Password updated successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password update failed.");
    }
  }

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return;

    try {
      await runAction({ action: "delete", userId: user.id });
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:rounded-[2rem]">
        <table className="w-full min-w-[900px] text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-xs">
              <th className="px-4 py-3 sm:px-6 sm:py-4">User</th>
              <th className="px-3 py-3 sm:px-4 sm:py-4">Role</th>
              <th className="px-3 py-3 sm:px-4 sm:py-4">Balance</th>
              <th className="px-3 py-3 sm:px-4 sm:py-4">Deposited</th>
              <th className="px-3 py-3 sm:px-4 sm:py-4">Withdrawn</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50" key={user.id}>
                <td className="px-4 py-4 font-bold text-slate-950 sm:px-6">
                  <div>{user.name}</div>
                  <div className="text-[10px] font-normal text-slate-400 sm:text-xs">{user.email}</div>
                </td>
                <td className="px-3 py-4">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black capitalize sm:text-xs ${user.role === "admin" ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-3 py-4 font-black">${(user.balanceCents / 100).toFixed(2)}</td>
                <td className="px-3 py-4 font-bold text-emerald-600">${(user.totalDepositedCents / 100).toFixed(2)}</td>
                <td className="px-3 py-4 font-bold text-rose-600">${(user.totalWithdrawnCents / 100).toFixed(2)}</td>
                <td className="px-4 py-4 sm:px-6">
                  <div className="flex flex-wrap gap-1.5">
                    <button className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black sm:text-xs" onClick={() => openModal(user, "view")} type="button">View</button>
                    <button className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700 sm:text-xs" onClick={() => openModal(user, "edit")} type="button">Edit</button>
                    <button className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 sm:text-xs" onClick={() => openModal(user, "balance")} type="button">Set Balance</button>
                    <button className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700 sm:text-xs" onClick={() => openModal(user, "password")} type="button">Password</button>
                    <button className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700 sm:text-xs" onClick={() => handleDelete(user)} type="button">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode && selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">
                {modalMode === "view" && "User Details"}
                {modalMode === "edit" && "Edit User"}
                {modalMode === "balance" && "Set Balance"}
                {modalMode === "password" && "Change Password"}
              </h3>
              <button className="text-sm font-bold text-slate-400" onClick={closeModal} type="button">Close</button>
            </div>

            {message ? (
              <p className="mt-4 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">{message}</p>
            ) : null}

            {modalMode === "view" && userDetail ? (
              <div className="mt-4 space-y-2 text-sm">
                <p><span className="font-bold text-slate-400">Name:</span> {userDetail.name}</p>
                <p><span className="font-bold text-slate-400">Email:</span> {userDetail.email}</p>
                <p><span className="font-bold text-slate-400">Role:</span> {userDetail.role}</p>
                <p><span className="font-bold text-slate-400">Referral:</span> {userDetail.referralCode}</p>
                <p><span className="font-bold text-slate-400">Balance:</span> ${(userDetail.balanceCents / 100).toFixed(2)}</p>
                <p><span className="font-bold text-slate-400">Password:</span> {userDetail.passwordPreview}</p>
                <p><span className="font-bold text-slate-400">Joined:</span> {new Date(userDetail.createdAt).toLocaleString()}</p>
              </div>
            ) : null}

            {modalMode === "edit" ? (
              <div className="mt-4 space-y-3">
                <input className="w-full rounded-xl border px-3 py-2 text-sm" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Name" />
                <input className="w-full rounded-xl border px-3 py-2 text-sm" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email" />
                <select className="w-full rounded-xl border px-3 py-2 text-sm" value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={loading} onClick={handleSaveEdit} type="button">Save Changes</button>
              </div>
            ) : null}

            {modalMode === "balance" ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">Current balance: <span className="font-black text-slate-900">${(selectedUser.balanceCents / 100).toFixed(2)}</span></p>
                <input className="w-full rounded-xl border px-3 py-2 text-sm font-bold" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} placeholder="New balance" type="number" step="0.01" />
                <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={loading} onClick={handleSaveBalance} type="button">Update Balance</button>
              </div>
            ) : null}

            {modalMode === "password" ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">Stored password: <span className="font-bold">{userDetail?.passwordPreview ?? "Loading..."}</span></p>
                <input className="w-full rounded-xl border px-3 py-2 text-sm" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="New password (min 8 chars)" type="text" />
                {newPasswordReveal ? (
                  <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">New password set: {newPasswordReveal}</p>
                ) : null}
                <button className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={loading} onClick={handleSavePassword} type="button">Update Password</button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
