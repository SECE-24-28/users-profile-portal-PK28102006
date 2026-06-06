'use client';

import React from 'react';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';
import Image from 'next/image';

const GET_STUDENT = gql`
  query GetStudent($id: ID!) {
    student(id: $id) {
      id
      name
      email
      age
      course
      profileUrl
      createdAt
    }
  }
`;

interface Student {
  id: string;
  name: string;
  email: string;
  age: number;
  course: string;
  profileUrl?: string | null;
  createdAt: string;
}

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const { loading, error, data } = useQuery<{ student: Student }>(GET_STUDENT, {
    variables: { id },
  });

  const student = data?.student;
  const avatarUrl = student?.profileUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student?.name || 'Student')}`;

  const formattedDate = student?.createdAt
    ? new Date(parseInt(student.createdAt, 10) || student.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Students Directory
        </Link>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">Loading student record...</p>
          </div>
        )}

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-6 text-center">
            <h3 className="text-lg font-semibold text-red-800">Student not found</h3>
            <p className="mt-2 text-red-600 text-sm">{error.message}</p>
          </div>
        )}

        {student && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            {/* Header Profile card with plain slate background */}
            <div className="h-24 bg-slate-200 relative"></div>

            <div className="px-6 pb-8 sm:px-8 relative">
              {/* Profile image overlapping the header */}
              <div className="relative -mt-12 mb-4 h-24 w-24 rounded border-4 border-white overflow-hidden bg-slate-100 shadow-sm">
                <Image
                  src={avatarUrl}
                  alt={student.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Title Block */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{student.name}</h2>
                  <p className="text-sm text-slate-600 font-medium mt-1">{student.course}</p>
                </div>
                <div>
                  <Link
                    href={`/students/${student.id}/edit`}
                    className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </Link>
                </div>
              </div>

              {/* Grid detail cards */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-200 pt-8">
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Contact Email</span>
                  <p className="text-base text-slate-900 mt-1 font-medium">{student.email}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Age / Status</span>
                  <p className="text-base text-slate-900 mt-1 font-medium">
                    {student.age} years old <span className="text-xs text-slate-500 ml-1">({student.age >= 18 ? 'Adult' : 'Minor'})</span>
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Student ID</span>
                  <p className="text-sm font-mono text-slate-600 mt-1">{student.id}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Enrollment Date</span>
                  <p className="text-base text-slate-900 mt-1 font-medium">{formattedDate}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
