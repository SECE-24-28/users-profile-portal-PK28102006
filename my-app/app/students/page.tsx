'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import Image from 'next/image';

const GET_STUDENTS = gql`
  query GetStudents {
    students {
      id
      name
      email
      age
      course
      profileUrl
    }
  }
`;

const DELETE_STUDENT = gql`
  mutation DeleteStudent($id: ID!) {
    deleteStudent(id: $id) {
      id
      name
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
}

export default function StudentsListPage() {
  const { loading, error, data, refetch } = useQuery<{ students: Student[] }>(GET_STUDENTS);
  const [deleteStudent] = useMutation(DELETE_STUDENT);

  const [searchQuery, setSearchQuery] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;

    try {
      await deleteStudent({
        variables: { id: studentToDelete.id },
      });
      setStudentToDelete(null);
      refetch();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete student.');
    }
  };

  const filteredStudents = data?.students.filter((student) => {
    const search = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(search) ||
      student.email.toLowerCase().includes(search) ||
      student.course.toLowerCase().includes(search)
    );
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top bar with Search & Add button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 rounded border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
            />
          </div>
          <Link
            href="/students/add"
            className="inline-flex items-center justify-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Student
          </Link>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">Loading student profiles...</p>
          </div>
        )}

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-6 text-center">
            <h3 className="text-lg font-semibold text-red-800">Unable to load students</h3>
            <p className="mt-2 text-red-600 text-sm">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredStudents.length === 0 && (
          <div className="text-center py-20 bg-white rounded border border-dashed border-slate-300">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-4 text-base font-semibold text-slate-900">No students found</h3>
            <p className="mt-2 text-sm text-slate-500">
              {searchQuery ? 'Try matching another search query.' : 'Create a new student entry to get started.'}
            </p>
          </div>
        )}

        {/* Student Cards Grid */}
        {!loading && !error && filteredStudents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => {
              const avatarUrl = student.profileUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}`;
              return (
                <div
                  key={student.id}
                  className="flex flex-col justify-between rounded border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0 rounded border border-slate-200 overflow-hidden bg-slate-100">
                      <Image
                        src={avatarUrl}
                        alt={student.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-base font-semibold text-slate-900">
                        {student.name}
                      </h4>
                      <p className="truncate text-xs text-slate-500 mt-0.5">{student.email}</p>
                      <div className="mt-2 inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                        {student.course}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
                    <div>
                      Age: <span className="font-semibold text-slate-700">{student.age}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/students/${student.id}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded transition-colors"
                        title="View Profile"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <Link
                        href={`/students/${student.id}/edit`}
                        className="p-1.5 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded transition-colors"
                        title="Edit Student"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => setStudentToDelete(student)}
                        className="p-1.5 text-red-600 hover:text-red-700 bg-slate-50 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="Delete Student"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40" onClick={() => setStudentToDelete(null)}></div>
          <div className="relative w-full max-w-md overflow-hidden rounded bg-white border border-slate-200 p-6 shadow-lg animate-in fade-in duration-150">
            <h3 className="text-lg font-bold text-slate-900">Delete Student Profile</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{studentToDelete.name}</span>? This action is permanent and cannot be undone.
            </p>
            {deleteError && <div className="mt-4 text-xs font-semibold text-red-700 bg-red-50 p-2 border border-red-200 rounded">{deleteError}</div>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setStudentToDelete(null)}
                className="rounded bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
