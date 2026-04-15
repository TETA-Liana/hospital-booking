import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowForward, MdWorkHistory, MdSchool, MdMeetingRoom } from 'react-icons/md';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const DAY_LABELS = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday',
  FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
};

export default function DoctorProfile() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get(`/doctors/${id}`),
      api.get(`/doctors/${id}/availability`),
    ])
      .then(([docRes, availRes]) => {
        setDoctor(docRes.data.data);
        setAvailability(availRes.data.data.availabilities);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (!doctor) return <p className="p-10 text-center text-ink-500">Doctor not found.</p>;

  function bookNow() {
    if (user?.role === 'PATIENT') navigate(`/patient/book?doctorId=${id}`);
    else navigate('/login');
  }

  const grouped = availability.reduce((acc, a) => {
    (acc[a.dayOfWeek] = acc[a.dayOfWeek] || []).push(a);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <div className="card p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 font-display text-2xl text-brand-700">
            {doctor.firstName[0]}{doctor.lastName[0]}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl text-ink-800">Dr. {doctor.firstName} {doctor.lastName}</h1>
            <p className="text-ink-500">{doctor.department?.name}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {doctor.specialties?.map((s) => (
                <span key={s.id} className="badge bg-ink-100 text-ink-600">{s.name}</span>
              ))}
            </div>
          </div>
          <button onClick={bookNow} className="btn-primary">
            Book appointment <MdArrowForward />
          </button>
        </div>

        <p className="mt-6 text-ink-600">{doctor.biography}</p>

        <div className="mt-6 grid gap-4 border-t border-ink-100 pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm text-ink-600">
            <MdWorkHistory className="text-brand-600" /> {doctor.yearsOfExperience} years experience
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-600">
            <MdSchool className="text-brand-600" /> {doctor.qualification || 'N/A'}
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-600">
            <MdMeetingRoom className="text-brand-600" /> Room {doctor.roomNumber || 'TBD'}
          </div>
        </div>
      </div>

      <div className="card mt-6 p-8">
        <h2 className="font-display text-xl text-ink-800">Weekly availability</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Object.keys(DAY_LABELS).map((day) =>
            grouped[day] ? (
              <div key={day} className="rounded-lg border border-ink-100 p-4">
                <p className="font-medium text-ink-700">{DAY_LABELS[day]}</p>
                {grouped[day].map((slot) => (
                  <p key={slot.id} className="text-sm text-ink-500">{slot.startTime} &ndash; {slot.endTime}</p>
                ))}
              </div>
            ) : null
          )}
          {availability.length === 0 && (
            <p className="text-sm text-ink-400">This doctor has not set their availability yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
