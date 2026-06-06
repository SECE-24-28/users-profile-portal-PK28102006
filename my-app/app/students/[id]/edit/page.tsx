'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../../../../components/DashboardLayout';

const GET_STUDENT = gql`
  query GetStudent($id: ID!) {
    student(id: $id) {
      id
      name
      email
      age
      course
      profileUrl
    }
  }
`;

const UPDATE_STUDENT = gql`
  mutation UpdateStudent($id: ID!, $name: String, $email: String, $age: Int, $course: String, $profileUrl: String) {
    updateStudent(id: $id, name: $name, email: $email, age: $age, course: $course, profileUrl: $profileUrl) {
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

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [course, setCourse] = useState('');
  const [currentProfileUrl, setCurrentProfileUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch current student details
  const { loading: queryLoading, error: queryError, data } = useQuery<{ student: Student }>(GET_STUDENT, {
    variables: { id },
  });

  // Pre-fill state when data is loaded
  useEffect(() => {
    if (data?.student) {
      setName(data.student.name);
      setEmail(data.student.email);
      setAge(data.student.age.toString());
      setCurrentProfileUrl(data.student.profileUrl || null);
      setCourse(data.student.course);
    }
  }, [data]);

  const [updateStudent, { loading: mutationLoading }] = useMutation(UPDATE_STUDENT, {
    onCompleted: () => {
      router.push('/students');
      router.refresh();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to update student profile.');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !email || !age || !course) {
      setErrorMsg('All fields are required.');
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      setErrorMsg('Please enter a valid age (positive integer).');
      return;
    }

    try {
      let finalProfileUrl = currentProfileUrl;

      // If a new file is uploaded, perform file upload first
      if (file) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to upload new image.');
        }

        const uploadData = await res.json();
        finalProfileUrl = uploadData.url;
        setUploading(false);
      }

      await updateStudent({
        variables: {
          id,
          name,
          email,
          age: parsedAge,
          course,
          profileUrl: finalProfileUrl,
        },
      });
    } catch (err: any) {
      setUploading(false);
      setErrorMsg(err.message || 'An error occurred during update.');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href={`/students/${id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Student Profile
        </Link>

        {queryLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">Loading student record...</p>
          </div>
        )}

        {queryError && (
          <div className="rounded border border-red-200 bg-red-50 p-6 text-center">
            <h3 className="text-lg font-semibold text-red-800">Failed to load student</h3>
            <p className="mt-2 text-red-650 text-sm">{queryError.message}</p>
          </div>
        )}

        {!queryLoading && !queryError && data?.student && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Modify Student Details</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="bg-red-55 border border-red-200 text-red-700 p-3 rounded text-sm">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded border border-slate-300 bg-white py-2 px-3 text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 text-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded border border-slate-300 bg-white py-2 px-3 text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 text-sm"
                    placeholder="e.g. john.doe@university.edu"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Age</label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="mt-1 block w-full rounded border border-slate-300 bg-white py-2 px-3 text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 text-sm"
                    placeholder="e.g. 21"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Course / Department</label>
                  <input
                    type="text"
                    required
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="mt-1 block w-full rounded border border-slate-300 bg-white py-2 px-3 text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 text-sm"
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Update Profile Image</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs text-slate-500">
                        {file ? (
                          <span className="font-semibold text-slate-700">{file.name}</span>
                        ) : (
                          <span>Upload new photo to replace current (PNG, JPG)</span>
                        )}
                      </p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 border-t border-slate-200 pt-6">
                <Link
                  href={`/students/${id}`}
                  className="rounded bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={uploading || mutationLoading}
                  className="flex items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'Uploading Photo...' : mutationLoading ? 'Updating Profile...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
