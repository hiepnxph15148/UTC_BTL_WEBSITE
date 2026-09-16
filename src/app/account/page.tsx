"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import {
  changePassword,
  getMyProfile,
  resetPassword,
  sendPasswordResetCode,
  storeApi,
  updateMyProfile,
  verifyPasswordResetToken,
  type AddressDto,
  type ProfileDto,
} from "@/lib/api";

export default function AccountPage() {
  const { isAuthenticated, hydrated } = useAuth();
  const { t } = useLocale();
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [resetUserId, setResetUserId] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [tokenOk, setTokenOk] = useState<boolean | null>(null);

  const [addrForm, setAddrForm] = useState({
    recipient: "",
    phone: "",
    fullAddress: "",
    isDefault: false,
  });
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setError(null);
    try {
      const [p, a] = await Promise.all([
        getMyProfile(),
        storeApi.getAddresses(),
      ]);
      setProfile(p);
      setUserName(p.userName || "");
      setEmail(p.email || "");
      setName(p.name || "");
      setSurname(p.surname || "");
      setPhoneNumber(p.phoneNumber || "");
      setAddresses(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.loadFail"));
    }
  }, [isAuthenticated, t]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !profile) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateMyProfile({
        userName,
        email,
        name: name || null,
        surname: surname || null,
        phoneNumber: phoneNumber || null,
        concurrencyStamp: profile.concurrencyStamp,
      });
      setProfile(updated);
      setMessage(t("account.saved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.saveFail"));
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await changePassword({
        currentPassword: currentPassword || null,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage(t("account.passChanged"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.passFail"));
    } finally {
      setBusy(false);
    }
  };

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await sendPasswordResetCode({
        email: resetEmail.trim(),
        appName: "MVC",
      });
      setMessage(t("account.resetSent"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.resetSendFail"));
    } finally {
      setBusy(false);
    }
  };

  const verifyToken = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await verifyPasswordResetToken({
        userId: resetUserId.trim(),
        resetToken: resetToken.trim(),
      });
      setTokenOk(ok);
      setMessage(ok ? t("account.tokenOk") : t("account.tokenBad"));
    } catch (err) {
      setTokenOk(false);
      setError(err instanceof Error ? err.message : t("account.verifyFail"));
    } finally {
      setBusy(false);
    }
  };

  const doResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await resetPassword({
        userId: resetUserId.trim(),
        resetToken: resetToken.trim(),
        password: resetPasswordValue,
      });
      setMessage(t("account.resetOk"));
      setResetPasswordValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.resetFail"));
    } finally {
      setBusy(false);
    }
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const input = {
        recipient: addrForm.recipient.trim(),
        phone: addrForm.phone.trim(),
        fullAddress: addrForm.fullAddress.trim(),
        isDefault: addrForm.isDefault,
      };
      if (editingAddrId) {
        await storeApi.updateAddress(editingAddrId, input);
      } else {
        await storeApi.createAddress(input);
      }
      setAddrForm({
        recipient: "",
        phone: "",
        fullAddress: "",
        isDefault: false,
      });
      setEditingAddrId(null);
      await load();
      setMessage(editingAddrId ? t("account.addrUpdated") : t("account.addrAdded"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.addrSaveFail"));
    } finally {
      setBusy(false);
    }
  };

  const deleteAddr = async (id: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await storeApi.deleteAddress(id);
      if (editingAddrId === id) setEditingAddrId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("account.addrDelFail"));
    } finally {
      setBusy(false);
    }
  };

  if (!hydrated) {
    return (
      <PageShell title={t("account.title")} subtitle={t("common.loading")}>
        <p className="text-white/60">{t("common.loading")}</p>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell title={t("account.title")} subtitle={t("account.needLogin")}>
        <div className="page-card rounded-2xl p-8 text-center">
          <Link
            href="/login?next=/account"
            className="inline-flex rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
          >
            {t("common.login")}
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={t("account.title")} subtitle={t("account.subtitle")}>
      {error ? (
        <p className="mb-4 text-sm text-amber-200/90">{error}</p>
      ) : null}
      {message ? (
        <p className="mb-4 text-sm text-[#c6e600]">{message}</p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="page-card space-y-3 rounded-2xl p-5">
          <h2 className="text-lg font-bold">{t("account.profile")}</h2>
          <label className="block text-xs text-white/50">
            {t("common.username")}
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="block text-xs text-white/50">
            {t("common.email")}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-white/50">
              {t("account.firstName")}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="block text-xs text-white/50">
              {t("account.lastName")}
              <input
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
              />
            </label>
          </div>
          <label className="block text-xs text-white/50">
            {t("account.phone")}
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-nike-accent px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {t("account.saveProfile")}
          </button>
        </form>

        <form onSubmit={savePassword} className="page-card space-y-3 rounded-2xl p-5">
          <h2 className="text-lg font-bold">{t("account.changePass")}</h2>
          <label className="block text-xs text-white/50">
            {t("account.currentPass")}
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="block text-xs text-white/50">
            {t("account.newPass")}
            <input
              required
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-nike-accent px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {t("account.changePass")}
          </button>
        </form>

        <div className="page-card space-y-3 rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-lg font-bold">{t("account.recover")}</h2>
          <form onSubmit={requestReset} className="flex flex-wrap gap-2">
            <input
              required
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder={t("account.resetEmailPh")}
              className="min-w-[200px] flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {t("account.sendCode")}
            </button>
          </form>
          <form onSubmit={doResetPassword} className="grid gap-2 sm:grid-cols-2">
            <input
              value={resetUserId}
              onChange={(e) => setResetUserId(e.target.value)}
              placeholder={t("account.userId")}
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
            <input
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              placeholder={t("account.resetToken")}
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
            <input
              type="password"
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              placeholder={t("account.newPass")}
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void verifyToken()}
                className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold"
              >
                {t("account.verifyToken")} {tokenOk === null ? "" : tokenOk ? "✓" : "✗"}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-nike-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {t("account.resetPass")}
              </button>
            </div>
          </form>
        </div>

        <div className="page-card space-y-3 rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-lg font-bold">{t("account.addresses")}</h2>
          <ul className="space-y-2">
            {addresses.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {a.recipient}{" "}
                    {a.isDefault ? (
                      <span className="text-xs text-[#c6e600]">{t("account.default")}</span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    {a.phone} · {a.fullAddress}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddrId(a.id);
                      setAddrForm({
                        recipient: a.recipient || "",
                        phone: a.phone || "",
                        fullAddress: a.fullAddress || "",
                        isDefault: a.isDefault,
                      });
                    }}
                    className="rounded-lg border border-white/15 px-2.5 py-1 text-xs font-semibold"
                  >
                    {t("account.edit")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deleteAddr(a.id)}
                    className="rounded-lg border border-orange-400/40 px-2.5 py-1 text-xs font-semibold text-orange-200"
                  >
                    {t("account.delete")}
                  </button>
                </div>
              </li>
            ))}
            {!addresses.length ? (
              <li className="py-4 text-sm text-white/45">{t("account.noAddress")}</li>
            ) : null}
          </ul>

          <form onSubmit={saveAddress} className="mt-4 grid gap-2 sm:grid-cols-2">
            <h3 className="sm:col-span-2 text-sm font-bold">
              {editingAddrId ? t("account.editAddress") : t("account.addAddress")}
            </h3>
            <input
              required
              value={addrForm.recipient}
              onChange={(e) =>
                setAddrForm((f) => ({ ...f, recipient: e.target.value }))
              }
              placeholder={t("account.recipient")}
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
            <input
              required
              value={addrForm.phone}
              onChange={(e) =>
                setAddrForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder={t("account.phone")}
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
            <input
              required
              value={addrForm.fullAddress}
              onChange={(e) =>
                setAddrForm((f) => ({ ...f, fullAddress: e.target.value }))
              }
              placeholder={t("account.fullAddress")}
              className="sm:col-span-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={addrForm.isDefault}
                onChange={(e) =>
                  setAddrForm((f) => ({ ...f, isDefault: e.target.checked }))
                }
              />
              {t("account.setDefault")}
            </label>
            <div className="flex gap-2">
              {editingAddrId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddrId(null);
                    setAddrForm({
                      recipient: "",
                      phone: "",
                      fullAddress: "",
                      isDefault: false,
                    });
                  }}
                  className="rounded-xl border border-white/15 px-3 py-2 text-xs"
                >
                  {t("account.cancel")}
                </button>
              ) : null}
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-nike-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {editingAddrId ? t("account.update") : t("account.addAddress")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
