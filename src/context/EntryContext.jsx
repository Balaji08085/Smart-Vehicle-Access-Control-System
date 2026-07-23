import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import INITIAL_MOCK_USERS from './mockData';

export const getDaysRemaining = (expiryDateStr) => {
  if (!expiryDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getValidityStatus = (vehicle) => {
  if (!vehicle) return 'Not Registered';
  if (vehicle.status === 'Suspended') return 'Suspended';
  if (vehicle.status === 'Blacklisted') return 'Blacklisted';
  if (vehicle.status === 'Disabled') return 'Disabled';
  const days = getDaysRemaining(vehicle.expiryDate);
  if (days <= 0) return 'Expired';
  return 'Active';
};

export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const EntryContext = createContext(null);

export const EntryProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('smart_campus_role') || 'guard'; // 'guard' or 'admin'
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('smart_campus_token') || '';
  });

  const [vehicles, setVehicles] = useState(() => {
    try {
      const saved = localStorage.getItem('smart_campus_vehicles');
      return saved ? JSON.parse(saved) : { ...INITIAL_MOCK_USERS };
    } catch {
      return { ...INITIAL_MOCK_USERS };
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('smart_campus_history');
      return saved ? JSON.parse(saved) : [
        {
          id: 'LOG-101',
          date: new Date().toLocaleDateString(),
          time: '09:12 AM',
          vehicleNumber: 'TN 38 AB 1234',
          ownerName: 'Balaji S',
          registerId: '23BCS045',
          department: 'Computer Science & Engineering',
          vehicleType: 'Bike (Two-Wheeler)',
          gate: 'Main Entrance Gate',
          status: 'Granted',
          reason: '',
        },
        {
          id: 'LOG-102',
          date: new Date().toLocaleDateString(),
          time: '08:30 AM',
          vehicleNumber: 'TN 38 XY 9999',
          ownerName: 'Dr. Ramesh Kumar',
          registerId: 'EMP9023',
          department: 'Mechanical Engineering',
          vehicleType: 'Car (Four-Wheeler)',
          gate: 'Main Entrance Gate',
          status: 'Granted',
          reason: '',
        },
        {
          id: 'LOG-103',
          date: new Date().toLocaleDateString(),
          time: '08:15 AM',
          vehicleNumber: 'TN 38 ZZZ 999',
          ownerName: 'Rohan Malhotra',
          registerId: 'VIS8902',
          department: 'Outsourcing Partner',
          vehicleType: 'Bike (Two-Wheeler)',
          gate: 'Main Entrance Gate',
          status: 'Denied',
          reason: 'Blacklisted Vehicle',
        },
        {
          id: 'LOG-104',
          date: new Date().toLocaleDateString(),
          time: '07:45 AM',
          vehicleNumber: 'TN 38 EXP 2025',
          ownerName: 'Vikram T',
          registerId: '21BME102',
          department: 'Mechanical Engineering',
          vehicleType: 'Bike (Two-Wheeler)',
          gate: 'South Gate',
          status: 'Denied',
          reason: 'Sticker Expired',
        }
      ];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('smart_campus_role', userRole);
  }, [userRole]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('smart_campus_token', token);
    } else {
      localStorage.removeItem('smart_campus_token');
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('smart_campus_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('smart_campus_history', JSON.stringify(history));
  }, [history]);

  // Load database from backend (if token is present)
  useEffect(() => {
    if (!token) return;

    const fetchDatabase = async () => {
      try {
        const res = await fetch('/api/vehicles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setVehicles(data.vehicles);
          setHistory(data.history);
        } else {
          console.error('Failed to load database from backend', data.error);
        }
      } catch (err) {
        console.error('Error fetching database', err);
      }
    };

    fetchDatabase();
  }, [token]);

  const addNotification = useCallback((message, type = 'info') => {
    setNotifications((prev) => [{ id: Date.now(), message, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
  }, []);

  const login = useCallback(async (role, credentials = {}) => {
    try {
      let body = { role };
      if (role === 'guard') {
        body.guardId = credentials.guardId || 'SEC-GATE-01';
        body.guardPin = credentials.guardPin || '1234';
      } else if (role === 'admin') {
        body.adminEmail = credentials.adminEmail || 'admin@college.edu';
        body.adminPassword = credentials.adminPassword || 'admin123';
      } else {
        body.role = 'student';
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setToken(data.token);
      setUserRole(role);
      addNotification(`Logged in as ${role === 'admin' ? 'System Administrator' : 'Security Staff'}`, 'success');
      return true;
    } catch (err) {
      console.error(err);
      addNotification(`Authentication Failed: ${err.message}`, 'error');
      return false;
    }
  }, [addNotification]);

  const logout = useCallback(() => {
    setUserRole('guard');
    setToken('');
    addNotification('Logged out successfully', 'info');
  }, [addNotification]);

  // Core Access Verification Method (Dual Mode: Live API with Offline Fallback)
  const verifyQrCode = useCallback((scannedQuery, gateName = 'Main Entrance Gate') => {
    return new Promise(async (resolve) => {
      const rawInput = (scannedQuery || '').trim();
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const nowDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

      // Attempt live verification via Express Backend if token is present
      if (token) {
        try {
          const res = await fetch('/api/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ scannedQuery, gateName })
          });
          const data = await res.json();
          if (res.ok) {
            // Append log dynamically on frontend
            setHistory((prev) => {
              const newLog = {
                id: `LOG-${Date.now()}`,
                date: nowDate,
                time: nowTime,
                vehicleNumber: data.vehicleNumber,
                ownerName: data.ownerName,
                registerId: data.registerId,
                department: data.department,
                vehicleType: data.vehicleType,
                gate: gateName,
                status: data.status === 'GRANTED' ? 'Granted' : 'Denied',
                reason: data.reason
              };
              const updated = [newLog, ...prev];
              localStorage.setItem('smart_campus_history', JSON.stringify(updated));
              return updated;
            });

            addNotification(
              data.status === 'GRANTED'
                ? `🟢 Access Granted: ${data.ownerName} (${data.vehicleNumber})`
                : `🔴 Access Denied: ${data.vehicleNumber} — ${data.reason}`,
              data.status === 'GRANTED' ? 'success' : 'error'
            );

            resolve(data);
            return;
          }
        } catch (err) {
          console.warn('Backend verification API offline, running local verification fallback:', err);
        }
      }

      // Offline Fallback Verification Logic (Using Local State/LocalStorage)
      if (!rawInput) {
        const deniedPayload = {
          status: 'DENIED',
          resultType: 'REJECTED',
          reason: 'QR Code Not Registered',
          vehicleNumber: 'UNKNOWN',
          ownerName: 'Unknown Visitor',
          registerId: 'N/A',
          department: 'N/A',
          vehicleType: 'N/A',
          stickerStatus: 'INVALID',
          expiryDate: 'N/A',
          gateEntryTime: nowTime,
          gate: gateName,
        };

        setHistory((prev) => [{
          id: `LOG-${Date.now()}`,
          date: nowDate,
          time: nowTime,
          vehicleNumber: 'UNKNOWN',
          ownerName: 'Unknown Visitor',
          registerId: 'N/A',
          department: 'N/A',
          vehicleType: 'N/A',
          gate: gateName,
          status: 'Denied',
          reason: 'QR Code Not Registered',
        }, ...prev]);

        resolve(deniedPayload);
        return;
      }

      const targetKey = Object.keys(vehicles).find((key) => {
        const v = vehicles[key];
        const q = rawInput.toLowerCase().replace(/[\s\-]+/g, '');
        return (
          (v.qrCode && v.qrCode.toLowerCase().replace(/[\s\-]+/g, '') === q) ||
          (v.vehicleNumber && v.vehicleNumber.toLowerCase().replace(/[\s\-]+/g, '') === q) ||
          (v.registerId && v.registerId.toLowerCase().replace(/[\s\-]+/g, '') === q) ||
          (v.id && v.id.toLowerCase().replace(/[\s\-]+/g, '') === q)
        );
      });

      const matchedVehicle = targetKey ? vehicles[targetKey] : null;

      if (!matchedVehicle) {
        const deniedResult = {
          status: 'DENIED',
          resultType: 'REJECTED',
          reason: 'QR Code Not Registered',
          vehicleNumber: rawInput.toUpperCase(),
          ownerName: 'Unregistered Vehicle',
          registerId: 'N/A',
          department: 'N/A',
          vehicleType: 'Unknown',
          stickerStatus: 'NOT REGISTERED',
          expiryDate: 'N/A',
          gateEntryTime: nowTime,
          gate: gateName,
          vehicle: null
        };

        setHistory((prev) => [{
          id: `LOG-${Date.now()}`,
          date: nowDate,
          time: nowTime,
          vehicleNumber: rawInput.toUpperCase(),
          ownerName: 'Unregistered Vehicle',
          registerId: 'N/A',
          department: 'N/A',
          vehicleType: 'Unknown',
          gate: gateName,
          status: 'Denied',
          reason: 'QR Code Not Registered',
        }, ...prev]);

        addNotification(`🔴 Access Denied: Unregistered QR Code (${rawInput})`, 'error');
        resolve(deniedResult);
        return;
      }

      const computed = getValidityStatus(matchedVehicle);

      if (computed === 'Active') {
        const grantedResult = {
          status: 'GRANTED',
          resultType: 'APPROVED',
          reason: '',
          vehicleNumber: matchedVehicle.vehicleNumber || matchedVehicle.id,
          ownerName: matchedVehicle.name,
          registerId: matchedVehicle.registerId,
          department: matchedVehicle.department,
          vehicleType: matchedVehicle.vehicleType || 'Two-Wheeler',
          stickerStatus: 'VALID',
          expiryDate: formatDateDisplay(matchedVehicle.expiryDate),
          gateEntryTime: nowTime,
          gate: gateName,
          vehicle: matchedVehicle
        };

        setHistory((prev) => [{
          id: `LOG-${Date.now()}`,
          date: nowDate,
          time: nowTime,
          vehicleNumber: matchedVehicle.vehicleNumber || matchedVehicle.id,
          ownerName: matchedVehicle.name,
          registerId: matchedVehicle.registerId,
          department: matchedVehicle.department,
          vehicleType: matchedVehicle.vehicleType || 'Vehicle',
          gate: gateName,
          status: 'Granted',
          reason: '',
        }, ...prev]);

        addNotification(`🟢 Access Granted: ${matchedVehicle.name} (${matchedVehicle.vehicleNumber})`, 'success');
        resolve(grantedResult);
      } else {
        let denialReason = 'Sticker Expired';
        if (computed === 'Blacklisted') denialReason = 'Blacklisted Vehicle';
        else if (computed === 'Suspended' || computed === 'Disabled') denialReason = 'Sticker Disabled';

        const deniedResult = {
          status: 'DENIED',
          resultType: 'REJECTED',
          reason: denialReason,
          vehicleNumber: matchedVehicle.vehicleNumber || matchedVehicle.id,
          ownerName: matchedVehicle.name,
          registerId: matchedVehicle.registerId,
          department: matchedVehicle.department,
          vehicleType: matchedVehicle.vehicleType || 'Vehicle',
          stickerStatus: computed.toUpperCase(),
          expiryDate: formatDateDisplay(matchedVehicle.expiryDate),
          gateEntryTime: nowTime,
          gate: gateName,
          vehicle: matchedVehicle
        };

        setHistory((prev) => [{
          id: `LOG-${Date.now()}`,
          date: nowDate,
          time: nowTime,
          vehicleNumber: matchedVehicle.vehicleNumber || matchedVehicle.id,
          ownerName: matchedVehicle.name,
          registerId: matchedVehicle.registerId,
          department: matchedVehicle.department,
          vehicleType: matchedVehicle.vehicleType || 'Vehicle',
          gate: gateName,
          status: 'Denied',
          reason: denialReason,
        }, ...prev]);

        addNotification(`🔴 Access Denied: ${matchedVehicle.vehicleNumber} — ${denialReason}`, 'error');
        resolve(deniedResult);
      }
    });
  }, [vehicles, token, addNotification]);

  // CRUD Operations for Admin Vehicle Management with optimistic updates
  const addVehicle = useCallback(async (newVehicle) => {
    const formattedId = newVehicle.vehicleNumber ? newVehicle.vehicleNumber.replace(/\s+/g, '-').toUpperCase() : `VEH-${Date.now()}`;
    const vehicleRecord = {
      id: formattedId,
      qrCode: formattedId,
      status: 'Active',
      issueDate: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      photo: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80',
      ...newVehicle
    };

    setVehicles((prev) => {
      const updated = { [formattedId]: vehicleRecord, ...prev };
      localStorage.setItem('smart_campus_vehicles', JSON.stringify(updated));
      return updated;
    });

    try {
      if (token) {
        const res = await fetch('/api/vehicles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newVehicle)
        });
        if (!res.ok) console.error('Failed to sync new vehicle with backend');
      }
    } catch (err) {
      console.warn('Backend offline, registered vehicle in offline mode:', err);
    }

    addNotification(`Vehicle ${vehicleRecord.vehicleNumber} registered successfully!`, 'success');
  }, [token, addNotification]);

  const updateVehicle = useCallback(async (id, updatedData) => {
    setVehicles((prev) => {
      if (!prev[id]) return prev;
      const updated = { ...prev, [id]: { ...prev[id], ...updatedData } };
      localStorage.setItem('smart_campus_vehicles', JSON.stringify(updated));
      return updated;
    });

    try {
      if (token) {
        const res = await fetch(`/api/vehicles/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedData)
        });
        if (!res.ok) console.error('Failed to sync vehicle update with backend');
      }
    } catch (err) {
      console.warn('Backend offline, updated vehicle in offline mode:', err);
    }
    addNotification(`Vehicle details updated!`, 'info');
  }, [token, addNotification]);

  const deleteVehicle = useCallback(async (id) => {
    setVehicles((prev) => {
      const copy = { ...prev };
      delete copy[id];
      localStorage.setItem('smart_campus_vehicles', JSON.stringify(copy));
      return copy;
    });

    try {
      if (token) {
        const res = await fetch(`/api/vehicles/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) console.error('Failed to sync vehicle deletion with backend');
      }
    } catch (err) {
      console.warn('Backend offline, deleted vehicle in offline mode:', err);
    }
    addNotification(`Vehicle removed from system`, 'warning');
  }, [token, addNotification]);

  const renewSticker = useCallback(async (id, years = 1) => {
    let updatedFields = {};
    setVehicles((prev) => {
      if (!prev[id]) return prev;
      const item = prev[id];
      const curExpiry = new Date(item.expiryDate);
      const base = isNaN(curExpiry.getTime()) || curExpiry < new Date() ? new Date() : curExpiry;
      base.setFullYear(base.getFullYear() + years);
      const newExp = base.toISOString().split('T')[0];

      updatedFields = { expiryDate: newExp, status: 'Active' };

      const updated = {
        ...prev,
        [id]: {
          ...item,
          ...updatedFields
        }
      };
      localStorage.setItem('smart_campus_vehicles', JSON.stringify(updated));
      return updated;
    });

    try {
      if (token) {
        const res = await fetch(`/api/vehicles/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedFields)
        });
        if (!res.ok) console.error('Failed to sync sticker renewal with backend');
      }
    } catch (err) {
      console.warn('Backend offline, renewed sticker in offline mode:', err);
    }
    addNotification(`Sticker renewed for 1 Year!`, 'success');
  }, [token, addNotification]);

  const disableSticker = useCallback(async (id, newStatus = 'Blacklisted') => {
    const updatedFields = { status: newStatus };
    setVehicles((prev) => {
      if (!prev[id]) return prev;
      const updated = {
        ...prev,
        [id]: { ...prev[id], ...updatedFields }
      };
      localStorage.setItem('smart_campus_vehicles', JSON.stringify(updated));
      return updated;
    });

    try {
      if (token) {
        const res = await fetch(`/api/vehicles/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedFields)
        });
        if (!res.ok) console.error('Failed to sync sticker status with backend');
      }
    } catch (err) {
      console.warn('Backend offline, disabled sticker in offline mode:', err);
    }
    addNotification(`Sticker status set to ${newStatus}`, 'error');
  }, [token, addNotification]);

  const resetAllData = useCallback(async () => {
    localStorage.removeItem('smart_campus_vehicles');
    localStorage.removeItem('smart_campus_history');
    localStorage.removeItem('smart_campus_token');
    setVehicles({ ...INITIAL_MOCK_USERS });
    setHistory([]);
    setToken('');

    try {
      if (token) {
        await fetch('/api/reset', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.warn('Backend offline, database reset locally only:', err);
    }
    addNotification('Database reset to defaults', 'info');
  }, [token, addNotification]);

  return (
    <EntryContext.Provider value={{
      userRole,
      token,
      login,
      logout,
      vehicles,
      history,
      notifications,
      verifyQrCode,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      renewSticker,
      disableSticker,
      resetAllData,
      addNotification
    }}>
      {children}
    </EntryContext.Provider>
  );
};

export const useEntry = () => {
  const ctx = useContext(EntryContext);
  if (!ctx) {
    return {
      userRole: 'guard',
      token: '',
      login: () => {},
      logout: () => {},
      vehicles: {},
      history: [],
      notifications: [],
      verifyQrCode: () => Promise.resolve({ status: 'DENIED', reason: 'Error' }),
      addVehicle: () => {},
      updateVehicle: () => {},
      deleteVehicle: () => {},
      renewSticker: () => {},
      disableSticker: () => {},
      resetAllData: () => {},
      addNotification: () => {}
    };
  }
  return ctx;
};
