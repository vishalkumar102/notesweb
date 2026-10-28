import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'

// Pages
import AuthPage from '@/pages/AuthPage'
import Dashboard from '@/pages/Dashboard'
import SemesterNotes from '@/pages/SemesterNotes'
import SemesterDetail from '@/pages/SemesterDetail'
import SubjectDetails from '@/pages/SubjectDetails'
import ResourcePreview from '@/pages/ResourcePreview'
import PYQs from '@/pages/PYQs'
import UploadMaterial from '@/pages/UploadMaterial'
import ExamTimetable from '@/pages/ExamTimetable'
import BookmarksDownloads from '@/pages/BookmarksDownloads'
import Profile from '@/pages/Profile'
import SearchPage from '@/pages/SearchPage'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/forgot-password" element={<AuthPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/semester-notes" element={<ProtectedLayout><SemesterNotes /></ProtectedLayout>} />
          <Route path="/semester/:semesterId" element={<ProtectedLayout><SemesterDetail /></ProtectedLayout>} />
          <Route path="/subject/:subjectId" element={<ProtectedLayout><SubjectDetails /></ProtectedLayout>} />
          <Route path="/resource/:resourceId" element={<ProtectedLayout><ResourcePreview /></ProtectedLayout>} />
          <Route path="/pyqs" element={<ProtectedLayout><PYQs /></ProtectedLayout>} />
          <Route path="/upload" element={<ProtectedLayout><UploadMaterial /></ProtectedLayout>} />
          <Route path="/timetable" element={<ProtectedLayout><ExamTimetable /></ProtectedLayout>} />
          <Route path="/bookmarks-downloads" element={<ProtectedLayout><BookmarksDownloads /></ProtectedLayout>} />
          <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
          <Route path="/search" element={<ProtectedLayout><SearchPage /></ProtectedLayout>} />

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgb(0 0 0 / 0.12)',
          },
          success: {
            iconTheme: { primary: '#4f46e5', secondary: '#fff' },
          },
        }}
      />
    </AuthProvider>
  )
}
