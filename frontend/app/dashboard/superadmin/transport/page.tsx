"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";

interface TransportRoute {
  id: string;
  routeCode: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  totalDistance?: number;
  estimatedDuration?: number;
  isActive: boolean;
}

interface Vehicle {
  id: string;
  vehicleCode: string;
  plateNumber: string;
  vehicleType: string;
  capacity: number;
  brand?: string;
  model?: string;
  year?: number;
  status: string;
  routeId?: string;
  routeName?: string;
}

interface Driver {
  id: string;
  driverCode: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseExpiry?: string;
  status: string;
  vehicleId?: string;
  vehiclePlate?: string;
}

export default function TransportManagement() {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"routes" | "vehicles" | "drivers">("routes");
  const [formData, setFormData] = useState({ routeCode: "", routeName: "", startLocation: "", endLocation: "", totalDistance: 0, estimatedDuration: 30 });
  const [vehicleForm, setVehicleForm] = useState({ vehicleCode: "", plateNumber: "", vehicleType: "BUS", capacity: 30, brand: "", model: "", year: new Date().getFullYear(), routeId: "" });
  const [driverForm, setDriverForm] = useState({ driverCode: "", name: "", phone: "", email: "", licenseNumber: "", licenseExpiry: "", vehicleId: "" });
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [routesData, vehiclesData, driversData] = await Promise.all([
        apiFetch("/api/transport/routes").catch(() => []),
        apiFetch("/api/transport/vehicles").catch(() => []),
        apiFetch("/api/transport/drivers").catch(() => [])
      ]);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setDrivers(Array.isArray(driversData) ? driversData : []);
    } catch (error) {
      console.error("Error fetching transport data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const data = await apiFetch("/api/transport/routes");
      setRoutes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoute) {
        await apiFetch(`/api/transport/routes/${editingRoute.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch("/api/transport/routes", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      setEditingRoute(null);
      fetchRoutes();
      setFormData({ routeCode: "", routeName: "", startLocation: "", endLocation: "", totalDistance: 0, estimatedDuration: 30 });
    } catch (error) {
      console.error("Error saving route:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return;
    try {
      await apiFetch(`/api/transport/routes/${id}`, { method: "DELETE" });
      fetchRoutes();
    } catch (error) {
      console.error("Error deleting route:", error);
    }
  };

  // Vehicle handlers
  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await apiFetch(`/api/transport/vehicles/${editingVehicle.id}`, {
          method: "PUT",
          body: JSON.stringify(vehicleForm),
        });
      } else {
        await apiFetch("/api/transport/vehicles", {
          method: "POST",
          body: JSON.stringify(vehicleForm),
        });
      }
      setShowVehicleModal(false);
      setEditingVehicle(null);
      fetchAllData();
      setVehicleForm({ vehicleCode: "", plateNumber: "", vehicleType: "BUS", capacity: 30, brand: "", model: "", year: new Date().getFullYear(), routeId: "" });
    } catch (error) {
      console.error("Error saving vehicle:", error);
    }
  };

  const handleVehicleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      await apiFetch(`/api/transport/vehicles/${id}`, { method: "DELETE" });
      fetchAllData();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  const handleVehicleStatusToggle = async (vehicle: Vehicle) => {
    try {
      await apiFetch(`/api/transport/vehicles/${vehicle.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...vehicle, status: vehicle.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }),
      });
      fetchAllData();
    } catch (error) {
      console.error("Error updating vehicle status:", error);
    }
  };

  // Driver handlers
  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await apiFetch(`/api/transport/drivers/${editingDriver.id}`, {
          method: "PUT",
          body: JSON.stringify(driverForm),
        });
      } else {
        await apiFetch("/api/transport/drivers", {
          method: "POST",
          body: JSON.stringify(driverForm),
        });
      }
      setShowDriverModal(false);
      setEditingDriver(null);
      fetchAllData();
      setDriverForm({ driverCode: "", name: "", phone: "", email: "", licenseNumber: "", licenseExpiry: "", vehicleId: "" });
    } catch (error) {
      console.error("Error saving driver:", error);
    }
  };

  const handleDriverDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;
    try {
      await apiFetch(`/api/transport/drivers/${id}`, { method: "DELETE" });
      fetchAllData();
    } catch (error) {
      console.error("Error deleting driver:", error);
    }
  };

  const handleDriverStatusToggle = async (driver: Driver) => {
    try {
      await apiFetch(`/api/transport/drivers/${driver.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...driver, status: driver.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }),
      });
      fetchAllData();
    } catch (error) {
      console.error("Error updating driver status:", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transport Management</h1>
          <p className="text-gray-500">Manage routes, vehicles, and drivers</p>
        </div>
        <button onClick={() => { setEditingRoute(null); setFormData({ routeCode: "", routeName: "", startLocation: "", endLocation: "", totalDistance: 0, estimatedDuration: 30 }); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add Route
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm">Total Routes</h3>
          <p className="text-2xl font-bold">{routes.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm">Active Routes</h3>
          <p className="text-2xl font-bold">{routes.filter(r => r.isActive).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm">Total Distance (km)</h3>
          <p className="text-2xl font-bold">{routes.reduce((acc, r) => acc + (r.totalDistance || 0), 0).toFixed(1)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm">Avg Duration (min)</h3>
          <p className="text-2xl font-bold">{routes.length > 0 ? Math.round(routes.reduce((acc, r) => acc + (r.estimatedDuration || 0), 0) / routes.length) : 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            {(["routes", "vehicles", "drivers"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 text-sm font-medium capitalize ${activeTab === tab ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "routes" && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routes.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No routes found. Add your first route!</td></tr>
              ) : (
                routes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{route.routeCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{route.routeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{route.startLocation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{route.endLocation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{route.totalDistance ? `${route.totalDistance} km` : "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{route.estimatedDuration ? `${route.estimatedDuration} min` : "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${route.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {route.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => { setEditingRoute(route); setFormData({ routeCode: route.routeCode, routeName: route.routeName, startLocation: route.startLocation, endLocation: route.endLocation, totalDistance: route.totalDistance || 0, estimatedDuration: route.estimatedDuration || 30 }); setShowModal(true); }} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button onClick={() => handleDelete(route.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === "vehicles" && (
          <div>
            <div className="p-4 border-b flex justify-between items-center">
              <span className="text-gray-600">{vehicles.length} vehicles registered</span>
              <button onClick={() => { setEditingVehicle(null); setVehicleForm({ vehicleCode: "", plateNumber: "", vehicleType: "BUS", capacity: 30, brand: "", model: "", year: new Date().getFullYear(), routeId: "" }); setShowVehicleModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Vehicle</button>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plate Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand/Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No vehicles registered. Add your first vehicle!</td></tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{vehicle.vehicleCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{vehicle.plateNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{vehicle.vehicleType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{vehicle.capacity} seats</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{vehicle.routeName || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleVehicleStatusToggle(vehicle)} className={`px-2 py-1 rounded-full text-xs ${vehicle.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {vehicle.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => { setEditingVehicle(vehicle); setVehicleForm({ vehicleCode: vehicle.vehicleCode, plateNumber: vehicle.plateNumber, vehicleType: vehicle.vehicleType, capacity: vehicle.capacity, brand: vehicle.brand || "", model: vehicle.model || "", year: vehicle.year || new Date().getFullYear(), routeId: vehicle.routeId || "" }); setShowVehicleModal(true); }} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button onClick={() => handleVehicleDelete(vehicle.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "drivers" && (
          <div>
            <div className="p-4 border-b flex justify-between items-center">
              <span className="text-gray-600">{drivers.length} drivers registered</span>
              <button onClick={() => { setEditingDriver(null); setDriverForm({ driverCode: "", name: "", phone: "", email: "", licenseNumber: "", licenseExpiry: "", vehicleId: "" }); setShowDriverModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Driver</button>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No drivers registered. Add your first driver!</td></tr>
                ) : (
                  drivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{driver.driverCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{driver.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{driver.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{driver.licenseNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{driver.vehiclePlate || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleDriverStatusToggle(driver)} className={`px-2 py-1 rounded-full text-xs ${driver.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {driver.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => { setEditingDriver(driver); setDriverForm({ driverCode: driver.driverCode, name: driver.name, phone: driver.phone, email: driver.email || "", licenseNumber: driver.licenseNumber, licenseExpiry: driver.licenseExpiry || "", vehicleId: driver.vehicleId || "" }); setShowDriverModal(true); }} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button onClick={() => handleDriverDelete(driver.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingRoute ? "Edit Route" : "Add New Route"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route Code *</label>
                  <input type="text" required value={formData.routeCode} onChange={(e) => setFormData({ ...formData, routeCode: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., RT001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route Name *</label>
                  <input type="text" required value={formData.routeName} onChange={(e) => setFormData({ ...formData, routeName: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Location *</label>
                <input type="text" required value={formData.startLocation} onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Location *</label>
                <input type="text" required value={formData.endLocation} onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                  <input type="number" step="0.1" value={formData.totalDistance} onChange={(e) => setFormData({ ...formData, totalDistance: parseFloat(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input type="number" value={formData.estimatedDuration} onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowModal(false); setEditingRoute(null); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingRoute ? "Update Route" : "Add Route"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVehicleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}</h2>
            <form onSubmit={handleVehicleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Code *</label>
                  <input type="text" required value={vehicleForm.vehicleCode} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleCode: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., VH001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number *</label>
                  <input type="text" required value={vehicleForm.plateNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., ABC-1234" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type *</label>
                  <select required value={vehicleForm.vehicleType} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option value="BUS">Bus</option>
                    <option value="VAN">Van</option>
                    <option value="MINIBUS">Mini Bus</option>
                    <option value="CAR">Car</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                  <input type="number" required min="1" value={vehicleForm.capacity} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input type="text" value={vehicleForm.brand} onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., Toyota" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input type="text" value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., Coaster" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input type="number" min="1990" max="2030" value={vehicleForm.year} onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Route</label>
                <select value={vehicleForm.routeId} onChange={(e) => setVehicleForm({ ...vehicleForm, routeId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">-- No Route Assigned --</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>{route.routeName}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingVehicle ? "Update Vehicle" : "Add Vehicle"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDriverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingDriver ? "Edit Driver" : "Add New Driver"}</h2>
            <form onSubmit={handleDriverSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver Code *</label>
                  <input type="text" required value={driverForm.driverCode} onChange={(e) => setDriverForm({ ...driverForm, driverCode: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., DR001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" required value={driverForm.name} onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" required value={driverForm.phone} onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., +1234567890" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={driverForm.email} onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                  <input type="text" required value={driverForm.licenseNumber} onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry *</label>
                  <input type="date" required value={driverForm.licenseExpiry} onChange={(e) => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Vehicle</label>
                <select value={driverForm.vehicleId} onChange={(e) => setDriverForm({ ...driverForm, vehicleId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">-- No Vehicle Assigned --</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.plateNumber} ({vehicle.vehicleType})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowDriverModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingDriver ? "Update Driver" : "Add Driver"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
