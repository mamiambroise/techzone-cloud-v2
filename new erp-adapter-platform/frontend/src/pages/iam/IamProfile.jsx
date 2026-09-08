import React, { useState } from 'react';
import { KeyIcon, UserCircleIcon, ShieldCheckIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../auth/AuthContext';
import { iamAuthService } from '../../services/api';

function IamProfile() {
  const { user, setUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    primaryEmail: user?.primaryEmail || '',
    phone: user?.phone || '',
  });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  const handleProfileChange = (e) => {
    setProfileSuccess(false);
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    if (!profile.primaryEmail.trim()) {
      setProfileError("L'adresse email est requise.");
      return;
    }
    setProfileBusy(true);
    try {
      const res = await iamAuthService.updateProfile({
        firstName: profile.firstName.trim() || null,
        lastName: profile.lastName.trim() || null,
        primaryEmail: profile.primaryEmail.trim(),
        phone: profile.phone.trim() || null,
      });
      const updated = res?.data?.user;
      if (updated && setUser) {
        setUser({ ...user, ...updated });
      }
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(
        err?.response?.data?.code === 'EMAIL_TAKEN'
          ? "Cette adresse email est déjà utilisée par un autre compte."
          : err?.response?.data?.message || "Échec de la mise à jour du profil.",
      );
    } finally {
      setProfileBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (newPassword.length < 10) {
      setError('Le nouveau mot de passe doit comporter au moins 10 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    setBusy(true);
    try {
      await iamAuthService.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(
        err?.response?.data?.code === 'PASSWORD_REUSED'
          ? 'Le nouveau mot de passe a déjà été utilisé récemment (5 derniers interdits).'
          : err?.response?.data?.code === 'INVALID_CREDENTIALS'
            ? 'Mot de passe actuel incorrect.'
            : err?.response?.data?.message || 'Échec du changement de mot de passe',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mon profil</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Informations du compte et changement de mot de passe</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-14 w-14 rounded-full items-center justify-center bg-gradient-to-br from-[#3B4BA8] to-[#5469D4] text-white text-lg font-bold">
            {((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '') || user?.username?.[0] || '?').toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.firstName || user?.username}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">@{user?.username}{user?.isAdmin ? ' · Administrateur' : ''}</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <UserCircleIcon className="w-4 h-4 text-slate-400" />
            {user?.primaryEmail || '—'}
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <ShieldCheckIcon className="w-4 h-4 text-slate-400" />
            Statut : {user?.status || '—'}
          </div>
        </dl>
      </div>

      <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <PencilSquareIcon className="w-5 h-5 text-[#5469D4]" /> Informations du profil
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
          Modifiez vos informations personnelles puis validez.
        </p>

        {profileError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{profileError}</div>
        )}
        {profileSuccess && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
            Profil mis à jour avec succès.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Prénom</label>
            <input
              name="firstName"
              value={profile.firstName}
              onChange={handleProfileChange}
              autoComplete="given-name"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nom</label>
            <input
              name="lastName"
              value={profile.lastName}
              onChange={handleProfileChange}
              autoComplete="family-name"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Adresse email *</label>
            <input
              name="primaryEmail"
              value={profile.primaryEmail}
              onChange={handleProfileChange}
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Téléphone</label>
            <input
              name="phone"
              value={profile.phone}
              onChange={handleProfileChange}
              autoComplete="tel"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={profileBusy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5469D4] text-white text-sm font-semibold hover:bg-[#4A5EC7] disabled:opacity-60 transition-colors"
          >
            {profileBusy ? 'Enregistrement...' : 'Mettre à jour'}
          </button>
        </div>
      </form>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <KeyIcon className="w-5 h-5 text-[#5469D4]" /> Changer le mot de passe
        </h2>

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
        {success && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
            Mot de passe modifié avec succès.
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Mot de passe actuel *</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nouveau mot de passe * (min 10)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={10}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Confirmer le nouveau mot de passe *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={10}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#5469D4]"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5469D4] text-white text-sm font-semibold hover:bg-[#4A5EC7] disabled:opacity-60 transition-colors"
          >
            {busy ? 'Enregistrement...' : 'Mettre à jour'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default IamProfile;