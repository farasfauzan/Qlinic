import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminPatients from "./pages/admin/AdminPatients";
import AdminPolyclinics from "./pages/admin/AdminPolyclinics";
import AdminReports from "./pages/admin/AdminReports";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorSchedule from "./pages/doctor/DoctorSchedule";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientFindDoctor from "./pages/patient/PatientFindDoctor";
import PatientMedicalRecords from "./pages/patient/PatientMedicalRecords";
import Register from "./pages/Register";
import { DoctorLayout } from "./layouts/DoctorLayout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute roles={["pasien"]} />}>
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/find-doctor" element={<PatientFindDoctor />} />
        <Route path="/patient/appointments" element={<PatientAppointments />} />
        <Route path="/patient/medical-records" element={<PatientMedicalRecords />} />
      </Route>

      <Route element={<ProtectedRoute roles={["dokter"]} />}>
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/schedule" element={<DoctorSchedule />} />
        <Route path="/doctor/patients" element={<DoctorPatients />} />
        <Route path="/doctor/settings" element={<DoctorLayout title="Settings"><div className="p-8 text-center text-slate-500 mt-20 font-bold bg-white rounded-xl border border-slate-200">Fitur Settings akan segera hadir.</div></DoctorLayout>} />
        <Route path="/doctor/help" element={<DoctorLayout title="Help"><div className="p-8 text-center text-slate-500 mt-20 font-bold bg-white rounded-xl border border-slate-200">Fitur Help akan segera hadir.</div></DoctorLayout>} />
      </Route>

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/doctors" element={<AdminDoctors />} />
        <Route path="/admin/patients" element={<AdminPatients />} />
        <Route path="/admin/polyclinics" element={<AdminPolyclinics />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/reports" element={<AdminReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
