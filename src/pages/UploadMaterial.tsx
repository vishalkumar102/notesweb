import { useState, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Upload, FileText, CheckCircle, X,
  Eye, Download, Sparkles, FolderUp, Check
} from 'lucide-react'
import { BRANCHES, SEMESTERS, RESOURCE_TYPES } from '@/data/mockData'
import { addCredits, getAllSubjects, saveCustomUpload, useResources } from '@/lib/dataStore'
import { uploadNote } from '@/lib/notesApi'
import { isSupabaseConfigured } from '@/lib/supabase'
import { formatBytes } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import type { Resource, Subject } from '@/types'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

const uploadSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  branch: z.string().min(1, 'Please select your branch'),
  semester: z.number().min(1, 'Please select a semester').max(8),
  subject_name: z.string().min(2, 'Please enter the subject name'),
  subject_code: z.string().optional(),
  resource_type: z.enum(['lecture_notes', 'pyq', 'assignment', 'lab_manual', 'reference_material']),
  description: z.string().optional(),
  academic_year: z.string().optional(),
  tags: z.string().optional(),
})

type UploadForm = z.infer<typeof uploadSchema>

export default function UploadMaterial() {
  const { user, profile } = useAuth()
  const { resources } = useResources()
  const subjects = getAllSubjects(resources)
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') === 'pyq' ? 'pyq' : 'lecture_notes'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedResource, setUploadedResource] = useState<Resource | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: '',
      branch: profile?.course_branch || 'B.Tech CSE',
      semester: profile?.current_semester || 1,
      subject_name: '',
      subject_code: '',
      resource_type: initialType,
      description: '',
      academic_year: '2024-25',
      tags: initialType === 'pyq' ? 'pyq, exam, question-paper' : '',
    },
  })

  function validateAndSetFile(f: File): boolean {
    setFileError('')
    // Check if PDF by MIME type or file extension
    const isPdf =
      f.type === 'application/pdf' ||
      f.type.includes('pdf') ||
      f.name.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      const msg = 'Only PDF files (.pdf) are accepted.'
      setFileError(msg)
      toast.error(msg)
      return false
    }

    if (f.size > MAX_FILE_SIZE) {
      const msg = `File is too large (${formatBytes(f.size)}). Maximum allowed size is ${formatBytes(MAX_FILE_SIZE)}.`
      setFileError(msg)
      toast.error(msg)
      return false
    }

    setFile(f)
    try {
      const previewUrl = URL.createObjectURL(f)
      setFilePreviewUrl(previewUrl)
    } catch {
      // fallback
    }
    toast.success(`Selected "${f.name}" (${formatBytes(f.size)})`)
    return true
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      validateAndSetFile(f)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  function removeFile() {
    setFile(null)
    setFileError('')
    setFilePreviewUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function onSubmit(data: UploadForm) {
    if (!file) {
      setFileError('Please select or drop a PDF file to upload.')
      toast.error('Please attach a PDF file before submitting.')
      return
    }

    try {
      const subjectName = data.subject_name.trim()
      const subjectCode = (data.subject_code || '').trim()
      const subjectId = 'subj_' + subjectName.toLowerCase().replace(/[^a-z0-9]/g, '_')
      setProgress(25)

      const matchingSubject: Subject = {
        id: subjectId,
        name: subjectName,
        subject_code: subjectCode,
        branch: data.branch,
        semester: Number(data.semester),
        description: `Study materials for ${subjectName}`,
        created_at: new Date().toISOString(),
      }

      const createdResource: Resource = isSupabaseConfigured
        ? await uploadNote(file, {
            title: data.title.trim(),
            description: data.description || 'Uploaded student resource',
            branch: data.branch,
            semester: Number(data.semester),
            subjectName,
            resourceType: data.resource_type,
            academicYear: data.academic_year || '2024-25',
            tags: (data.tags || '').split(',').map(tag => tag.trim()).filter(Boolean),
          })
        : {
            id: 'upload_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
            title: data.title.trim(),
            description: data.description || 'Uploaded student resource',
            subject_id: subjectId,
            subject: matchingSubject,
            branch: data.branch,
            semester: Number(data.semester),
            resource_type: data.resource_type,
            storage_path: filePreviewUrl,
            file_size: file.size,
            uploader_id: user?.id || 'u_student',
            moderation_status: 'approved',
            download_count: 0,
            academic_year: data.academic_year || '2024-25',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            uploader: {
              id: user?.id || 'u_student',
              full_name: profile?.full_name || 'Current Student',
              enrollment_no: profile?.enrollment_no || '',
              course_branch: profile?.course_branch || data.branch,
              created_at: '',
              updated_at: '',
            },
          }

      if (isSupabaseConfigured) {
        addCredits(150)
        window.dispatchEvent(new Event('syncnote:resources_changed'))
      } else {
        saveCustomUpload(createdResource)
      }
      setProgress(100)
      setUploadedResource(createdResource)

      toast.success('Study material successfully uploaded! +150 SyncCredits earned 🎉', {
        duration: 4000,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.'
      toast.error('Upload failed: ' + message)
    }
  }

  // ─── Success Screen ──────────────────────────────────────────────────────────
  if (uploadedResource && file) {
    return (
      <div className="p-6 max-w-xl mx-auto my-8 text-center animate-fade-in">
        <div className="card p-8 sm:p-10 space-y-6 shadow-xl border border-green-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle size={38} />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles size={13} className="text-indigo-600" />
              +150 SyncCredits Awarded
            </span>
            <h2 className="text-2xl font-bold text-slate-800">PDF Uploaded Successfully!</h2>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
              "{uploadedResource.title}" is now available in the platform library for students.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">File Name:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[240px]">{file.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">File Size:</span>
              <span className="font-semibold text-slate-800">{formatBytes(file.size)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Subject:</span>
              <span className="font-semibold text-slate-800">{uploadedResource.subject?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Semester &amp; Branch:</span>
              <span className="font-semibold text-slate-800">
                Semester {uploadedResource.semester} · {uploadedResource.branch}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Status:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-green-700 bg-green-100/80 px-2 py-0.5 rounded">
                <Check size={12} /> Published &amp; Active
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              to={`/resource/${uploadedResource.id}`}
              className="btn btn-primary flex items-center justify-center gap-2 py-2.5"
            >
              <Eye size={16} /> View Resource
            </Link>

            {filePreviewUrl ? (
              <a
                href={filePreviewUrl}
                download={file.name}
                className="btn btn-secondary flex items-center justify-center gap-2 py-2.5"
              >
                <Download size={16} /> Download File
              </a>
            ) : (
              <Link
                to="/semester-notes"
                className="btn btn-secondary flex items-center justify-center gap-2 py-2.5"
              >
                Browse All Notes
              </Link>
            )}
          </div>

          <div className="pt-2 flex items-center justify-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => {
                setUploadedResource(null)
                removeFile()
                setProgress(0)
              }}
              className="text-indigo-600 font-medium hover:underline flex items-center gap-1"
            >
              <FolderUp size={14} /> Upload another material
            </button>
            <span className="text-slate-300">|</span>
            <Link to="/dashboard" className="text-slate-500 hover:text-slate-800">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main Upload Form ────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto animate-fade-in space-y-5">
      {/* Header */}
      <div>
        <nav className="text-xs text-slate-400 mb-2 flex items-center gap-1">
          <Link to="/dashboard" className="hover:text-indigo-600">Home</Link>
          <span>/</span>
          <span className="text-slate-600">Upload Study Material</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-800">Upload Study Material</h1>
        <p className="text-sm text-slate-500 mt-1">
          Share chapter notes, previous exam papers, or lab manuals with your university community.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100/80 rounded-xl p-4 flex gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles size={16} />
        </div>
        <div className="text-xs sm:text-sm text-slate-700">
          <strong className="text-indigo-900 font-semibold">Earn +150 SyncCredits per upload!</strong>
          <p className="text-slate-500 mt-0.5 text-xs">
            Help fellow students prepare for exams. Uploaded resources are verified and credited to your contributor profile.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, (formErrors) => {
          const first = Object.values(formErrors)[0]?.message
          if (first) toast.error(first as string)
        })}
        className="card p-6 sm:p-7 space-y-5 shadow-md"
      >
        {/* Resource Title */}
        <div>
          <label className="form-label font-semibold text-slate-700">
            Resource Title <span className="text-red-500">*</span>
          </label>
          <input
            {...register('title')}
            className={`form-input ${errors.title ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="e.g. Unit 3 – Calculus Complete Hand-written Notes"
          />
          {errors.title && <p className="form-error text-xs text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        {/* Branch & Semester */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label font-semibold text-slate-700">
              Major / Branch <span className="text-red-500">*</span>
            </label>
            <select
              {...register('branch')}
              className={`form-select ${errors.branch ? 'border-red-400' : ''}`}
            >
              {BRANCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {errors.branch && <p className="form-error text-xs text-red-500 mt-1">{errors.branch.message}</p>}
          </div>

          <div>
            <label className="form-label font-semibold text-slate-700">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              {...register('semester', { valueAsNumber: true })}
              className={`form-select ${errors.semester ? 'border-red-400' : ''}`}
            >
              {SEMESTERS.map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
            {errors.semester && <p className="form-error text-xs text-red-500 mt-1">{errors.semester.message}</p>}
          </div>
        </div>

        {/* Subject Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label font-semibold text-slate-700">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="semester-subjects-list"
              {...register('subject_name')}
              onChange={e => {
                register('subject_name').onChange(e)
                const val = e.target.value.trim().toLowerCase()

                const found = subjects.find(s => s.name.toLowerCase() === val)
                if (found && found.subject_code) {
                  setValue('subject_code', found.subject_code)
                }
              }}
              placeholder="e.g. MATHEMATICS-I, PHYSICS"
              className={`form-input ${errors.subject_name ? 'border-red-400' : ''}`}
            />
            <datalist id="semester-subjects-list">
              {subjects
                .filter(s => s.semester === Number(watch('semester') || 1))
                .map(s => (
                  <option key={s.id} value={s.name}>
                    {s.subject_code ? `${s.subject_code} - ` : ''}{s.name}
                  </option>
                ))}
            </datalist>
            {errors.subject_name && <p className="form-error text-xs text-red-500 mt-1">{errors.subject_name.message}</p>}

            {/* Quick-Pick Subject Chips for the selected semester */}
            {subjects.filter(s => s.semester === Number(watch('semester') || 1)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {subjects
                  .filter(s => s.semester === Number(watch('semester') || 1))
                  .map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setValue('subject_name', s.name, { shouldValidate: true })
                        if (s.subject_code) setValue('subject_code', s.subject_code)
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                    >
                      {s.name} {s.subject_code ? `(${s.subject_code})` : ''}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div>
            <label className="form-label font-semibold text-slate-700">
              Subject Code <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              {...register('subject_code')}
              placeholder="e.g. MA201TBS01, PH201TBS02"
              className="form-input"
            />
          </div>
        </div>

        {/* Resource Type */}
        <div>
          <label className="form-label font-semibold text-slate-700">
            Resource Type <span className="text-red-500">*</span>
          </label>
          <select
            {...register('resource_type')}
            className={`form-select ${errors.resource_type ? 'border-red-400' : ''}`}
          >
            {RESOURCE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.resource_type && <p className="form-error text-xs text-red-500 mt-1">{errors.resource_type.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="form-label font-semibold text-slate-700">
            Description &amp; Key Topics <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            {...register('description')}
            className="form-textarea"
            placeholder="Describe what chapters, theorems, or solved questions are covered in this PDF…"
            rows={3}
          />
        </div>

        {/* Academic Year & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label font-semibold text-slate-700">
              Academic Year <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              {...register('academic_year')}
              className="form-input"
              placeholder="e.g. 2024-25 or 2023-24"
            />
          </div>

          <div>
            <label className="form-label font-semibold text-slate-700">
              Tags <span className="text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <input
              {...register('tags')}
              className="form-input"
              placeholder="matrices, calculus, mid-sem, unit-3"
            />
          </div>
        </div>

        {/* PDF File Upload Zone */}
        <div>
          <label className="form-label font-semibold text-slate-700">
            Upload PDF Document <span className="text-red-500">*</span>
          </label>

          {/* Hidden native input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            id="pdf-file-upload-input"
            onChange={handleFileChange}
          />

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click()
                }
              }}
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200 select-none ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01]'
                  : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 bg-slate-50/50'
              }`}
            >
              <div className="w-14 h-14 bg-indigo-100/70 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Upload size={26} />
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  Click to select PDF or drag and drop here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported format: <strong>.PDF</strong> (up to 25 MB)
                </p>
              </div>

              <span className="btn btn-secondary btn-sm pointer-events-none mt-1">
                Browse PDF File
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 shadow-sm animate-fade-in">
              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <FileText size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-200/80 text-indigo-800 uppercase">
                    PDF
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatBytes(file.size)} · Ready to submit
                </p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                title="Remove file"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {fileError && <p className="form-error text-xs text-red-500 mt-1.5">{fileError}</p>}
        </div>

        {/* Progress Bar during submit */}
        {isSubmitting && (
          <div className="space-y-1.5 animate-fade-in">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Uploading PDF document…</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-full py-3 text-sm font-semibold shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing Upload…</span>
            </>
          ) : (
            <>
              <Upload size={18} />
              <span>Submit Study Material (+150 Credits)</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
