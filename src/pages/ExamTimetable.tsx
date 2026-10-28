import { Link } from 'react-router-dom'
import { Clock, Download, Maximize2, Calendar, BookOpen } from 'lucide-react'
import { MOCK_EVENTS } from '@/data/mockData'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const EVENT_COLORS: Record<string, string> = {
  exam: 'bg-red-50 text-red-700 border-red-200',
  holiday: 'bg-green-50 text-green-700 border-green-200',
  registration: 'bg-blue-50 text-blue-700 border-blue-200',
  academic: 'bg-violet-50 text-violet-700 border-violet-200',
}

const EXAM_SCHEDULE = [
  { date: '02 Dec 2024', day: 'Mon', subject: 'Engineering Mathematics-I', code: 'BAS-101', time: '10:00 AM – 1:00 PM', room: 'Block A, Hall 1' },
  { date: '04 Dec 2024', day: 'Wed', subject: 'Engineering Physics', code: 'BAS-102', time: '10:00 AM – 1:00 PM', room: 'Block A, Hall 1' },
  { date: '06 Dec 2024', day: 'Fri', subject: 'Basic Electrical Engineering', code: 'BEE-101', time: '10:00 AM – 1:00 PM', room: 'Block B, Hall 2' },
  { date: '09 Dec 2024', day: 'Mon', subject: 'Programming for Problem Solving', code: 'KCS-101', time: '10:00 AM – 1:00 PM', room: 'Block A, Hall 1' },
  { date: '11 Dec 2024', day: 'Wed', subject: 'Engineering Graphics and Design', code: 'KEE-101', time: '2:00 PM – 5:00 PM', room: 'Drawing Hall' },
  { date: '13 Dec 2024', day: 'Fri', subject: 'Communication Skills', code: 'KHU-101', time: '10:00 AM – 1:00 PM', room: 'Block B, Hall 3' },
  { date: '16 Dec 2024', day: 'Mon', subject: 'Environmental Science', code: 'KAN-101', time: '10:00 AM – 1:00 PM', room: 'Block A, Hall 2' },
]

export default function ExamTimetable() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in space-y-5">
      {/* Header */}
      <div>
        <nav className="text-xs text-slate-400 mb-2 flex items-center gap-1">
          <Link to="/dashboard" className="hover:text-indigo-600">Home</Link>
          <span>/</span>
          <span className="text-slate-700">Exam Timetable</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-800">Examination Timetable</h1>
        <p className="text-sm text-slate-500 mt-1">End-semester examination schedule for B.Tech CSE – Semester 1</p>
      </div>

      {/* Info Card */}
      <div className="card p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-md">
            <Clock size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-800">End-Semester Examinations 2024</h2>
            <p className="text-sm text-slate-600 mt-0.5">B.Tech – All Branches · Semester 1 · Academic Year 2024-25</p>
            <p className="text-xs text-slate-500 mt-1">Exam dates are subject to change by the university. Always verify with the official notice board.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => toast.success('Timetable PDF downloaded!')} className="btn btn-primary btn-sm">
              <Download size={14} /> Download PDF
            </button>
            <button className="btn btn-secondary btn-sm">
              <Maximize2 size={14} /> Full Screen
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <BookOpen size={16} className="text-amber-500" />
          <h2 className="font-semibold text-slate-700 text-sm">Exam Schedule</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Date</th>
                <th className="text-left px-5 py-3 font-semibold">Subject</th>
                <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">Code</th>
                <th className="text-left px-5 py-3 font-semibold">Time</th>
                <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Venue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {EXAM_SCHEDULE.map((exam, i) => (
                <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-800">{exam.date}</p>
                    <p className="text-xs text-slate-400">{exam.day}</p>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">{exam.subject}</td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="badge bg-amber-50 text-amber-700">{exam.code}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{exam.time}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs hidden md:table-cell">{exam.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Important Notes */}
      <div className="card p-5 border-amber-100 bg-amber-50/40">
        <h3 className="font-semibold text-slate-700 text-sm mb-3">📋 Important Instructions</h3>
        <ul className="space-y-1.5 text-sm text-slate-600 list-disc list-inside">
          <li>Report to the examination hall 30 minutes before the scheduled time.</li>
          <li>Carry your university admit card and valid student ID.</li>
          <li>Mobile phones and electronic devices are strictly prohibited.</li>
          <li>Only approved calculators are allowed for Mathematics.</li>
          <li>Any changes to this schedule will be notified via the official university portal.</li>
        </ul>
      </div>

      {/* Upcoming Events */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Calendar size={15} className="text-indigo-500" /> Upcoming Academic Events
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MOCK_EVENTS.slice(0, 4).map(ev => (
            <div key={ev.id} className="card p-4 flex items-start gap-3">
              <div className="text-center w-12 flex-shrink-0">
                <p className="text-xs text-slate-400">{new Date(ev.event_date).toLocaleString('en', { month: 'short' })}</p>
                <p className="text-xl font-bold text-slate-800">{new Date(ev.event_date).getDate()}</p>
              </div>
              <div className="border-l border-slate-200 pl-3 flex-1">
                <p className="font-semibold text-slate-700 text-sm">{ev.title}</p>
                {ev.description && <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>}
                <span className={`badge border mt-1.5 text-[10px] ${EVENT_COLORS[ev.category]}`}>{ev.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
