import { useParams, useNavigate } from 'react-router-dom'
import { useLead } from '../hooks/useLeads'
import LeadPanel from '../components/LeadPanel'
import ChatPanel from '../../chat/components/ChatPanel'
import { SpinnerCentrado } from '../../../components/Spinner'
import { IconVolver } from '../../../components/icons'

export default function LeadDetailPage() {
  const { id } = useParams()
  const { data: lead, isLoading } = useLead(Number(id))
  const navigate = useNavigate()

  if (isLoading || !lead) {
    return (
      <div className="flex h-full items-center justify-center">
        <SpinnerCentrado />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden xl:flex-row">
      <div className="flex shrink-0 flex-col overflow-hidden border-b border-line bg-surface xl:h-full xl:border-r xl:border-b-0">
        <div className="shrink-0 px-5 pt-4">
          <button
            type="button"
            onClick={() => navigate('/leads')}
            className="btn btn-sm btn-quiet -ml-2"
          >
            <IconVolver className="size-4" />
            Volver
          </button>
        </div>
        <LeadPanel key={lead.id} lead={lead} />
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <ChatPanel lead={lead} />
      </div>
    </div>
  )
}
