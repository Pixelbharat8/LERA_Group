"use client";

/**
 * Public "Meet our Teachers" profile fields — reused by every teacher Add/Edit form
 * (academy / superadmin / academic-manager). A teacher appears on the public /teachers
 * page only once a Display name is set. `formData` must carry: displayName, displayNameVi,
 * photoUrl, bioVi, isFeatured, isNativeSpeaker.
 */
export default function TeacherPublicProfileFields({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (v: any) => void;
}) {
  const inputCls = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none";
  return (
    <div className="border-t pt-4 mt-2">
      <p className="text-sm font-semibold text-gray-900">Public profile (website)</p>
      <p className="text-xs text-gray-500 mb-3">
        Shown on the public Teachers page. A teacher appears there only once a Display name is set.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display name (public)</label>
          <input type="text" value={formData.displayName || ""}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className={inputCls} placeholder="e.g., Ms. Emily Carter" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display name (Vietnamese)</label>
          <input type="text" value={formData.displayNameVi || ""}
            onChange={(e) => setFormData({ ...formData, displayNameVi: e.target.value })}
            className={inputCls} placeholder="optional" />
        </div>
      </div>
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
        <input type="url" value={formData.photoUrl || ""}
          onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
          className={inputCls} placeholder="https://…  (leave blank for an initials avatar)" />
      </div>
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio (Vietnamese)</label>
        <textarea value={formData.bioVi || ""}
          onChange={(e) => setFormData({ ...formData, bioVi: e.target.value })}
          className={inputCls} rows={2} placeholder="optional Vietnamese bio" />
      </div>
      <div className="flex items-center gap-6 mt-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={!!formData.isNativeSpeaker}
            onChange={(e) => setFormData({ ...formData, isNativeSpeaker: e.target.checked })} />
          Native speaker
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={!!formData.isFeatured}
            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} />
          Featured (show first)
        </label>
      </div>
    </div>
  );
}
