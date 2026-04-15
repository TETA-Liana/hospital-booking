import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdArrowForward, MdAccessTime, MdVerifiedUser, MdGroups } from 'react-icons/md';
import api from '../../services/api';

export default function Landing() {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data.data.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(39,157,143,0.35),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand-400">Book with confidence</p>
            <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">
              The next available doctor is closer than you think.
            </h1>
            <p className="mt-5 max-w-md text-ink-300">
              Search departments, compare doctor availability down to the exact time slot, and confirm
              your visit in under two minutes &mdash; no phone calls required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/doctors" className="btn-primary">
                Find a doctor <MdArrowForward />
              </Link>
              <Link to="/register" className="btn bg-white/10 text-white hover:bg-white/20">
                Create patient account
              </Link>
            </div>
            <div className="mt-10 flex gap-8 text-ink-300">
              <div>
                <p className="font-display text-2xl text-white">9</p>
                <p className="text-xs uppercase tracking-wide">Departments</p>
              </div>
              <div>
                <p className="font-display text-2xl text-white">24/7</p>
                <p className="text-xs uppercase tracking-wide">Emergency care</p>
              </div>
              <div>
                <p className="font-display text-2xl text-white">&lt; 2 min</p>
                <p className="text-xs uppercase tracking-wide">To book a visit</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 p-2 backdrop-blur">
            <div className="card overflow-hidden rounded-xl">
              <div className="border-b border-ink-100 bg-ink-50 px-5 py-3 text-sm font-medium text-ink-500">
                Today&rsquo;s open slots
              </div>
              <ul className="divide-y divide-ink-100">
                {[
                  ['Dr. Jane Smith', 'Cardiology', '09:00 AM'],
                  ['Dr. Jane Smith', 'Cardiology', '09:30 AM'],
                  ['Dr. Jane Smith', 'Cardiology', '10:00 AM'],
                ].map(([name, dept, time]) => (
                  <li key={time} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-ink-800">{name}</p>
                      <p className="text-xs text-ink-400">{dept}</p>
                    </div>
                    <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">
                      <MdAccessTime className="mr-1" /> {time}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-brand-600">Departments</p>
            <h2 className="font-display text-3xl text-ink-800">Care organized around you</h2>
          </div>
          <Link to="/departments" className="hidden text-sm font-medium text-brand-700 hover:underline sm:block">
            View all departments
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <div key={d.id} className="card p-6 transition-shadow hover:shadow-md">
              <h3 className="font-display text-lg text-ink-800">{d.name}</h3>
              <p className="mt-1 text-sm text-ink-500">{d.description}</p>
              <p className="mt-4 text-xs text-ink-400">{d._count?.doctors ?? 0} doctors available</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-ink-100 bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 lg:px-8">
          <div className="flex items-start gap-3">
            <MdVerifiedUser className="mt-1 h-6 w-6 text-brand-600" />
            <div>
              <p className="font-medium text-ink-800">Licensed specialists</p>
              <p className="text-sm text-ink-500">Every doctor profile lists real credentials and license numbers.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MdAccessTime className="mt-1 h-6 w-6 text-brand-600" />
            <div>
              <p className="font-medium text-ink-800">Live availability</p>
              <p className="text-sm text-ink-500">Slots update instantly the moment another patient books.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MdGroups className="mt-1 h-6 w-6 text-brand-600" />
            <div>
              <p className="font-medium text-ink-800">Front desk support</p>
              <p className="text-sm text-ink-500">Reception staff can book, reschedule, or check you in directly.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
