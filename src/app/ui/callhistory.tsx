import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PhoneCall, PhoneOutgoing, PhoneMissed, Voicemail } from "lucide-react"

type CallHistoryItem = {
  id: number
  user: {
    name: string
    imageUrl: string
  }
  type: 'incoming' | 'outgoing' | 'missed' | 'voicemail'
  duration: string
  date: Date
}



export default function CallHistory() {
  const [filter, setFilter] = useState<'all' | 'missed' | 'voicemail'>('all')

  const filteredHistory = callHistory.filter(item => {
    if (filter === 'all') return true
    if (filter === 'missed') return item.type === 'missed'
    if (filter === 'voicemail') return item.type === 'voicemail'
    return true
  })

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-4 sm:px-4 flex justify-between items-center border-b">
      <h2 className="text-xl leading-6 font-semibold text-gray-900">Call History</h2>
      <div className="flex space-x-2">
          <button
            type="button"
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              filter === 'missed'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            onClick={() => setFilter('missed')}
          >
            Missed
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              filter === 'voicemail'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            onClick={() => setFilter('voicemail')}
          >
            Voicemail
          </button>
        </div>
    </div>
    <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
        <ul role="list" className="divide-y divide-gray-100 px-4 ">
          {filteredHistory.map((item) => (
            <CallHistoryItem key={item.id} item={item} />
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}


const callHistory: CallHistoryItem[] = [
  {
    id: 1,
    user: {
      name: 'Michael Foster',
      imageUrl: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'incoming',
    duration: '2m 15s',
    date: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
  {
    id: 2,
    user: {
      name: 'Lindsay Walton',
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'outgoing',
    duration: '1m 32s',
    date: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  },
  {
    id: 3,
    user: {
      name: 'Courtney Henry',
      imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'missed',
    duration: '',
    date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
  },
  {
    id: 4,
    user: {
      name: 'Whitney Francis',
      imageUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'voicemail',
    duration: '37s',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 5,
    user: {
      name: 'Whitney Francis',
      imageUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'voicemail',
    duration: '37s',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 6,
    user: {
      name: 'Whitney Francis',
      imageUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'voicemail',
    duration: '37s',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 7,
    user: {
      name: 'Whitney Francis',
      imageUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'voicemail',
    duration: '37s',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 8,
    user: {
      name: 'Whitney Francis',
      imageUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'voicemail',
    duration: '37s',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 9,
    user: {
      name: 'Whitney Francis',
      imageUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'voicemail',
    duration: '37s',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 10,
    user: {
      name: 'Courtney Henry',
      imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'missed',
    duration: '',
    date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
  },
  {
    id: 11,
    user: {
      name: 'Michael Foster',
      imageUrl: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    type: 'incoming',
    duration: '2m 15s',
    date: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
]

function CallHistoryItem({ item }: { item: CallHistoryItem }) {
  const getCallIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return <PhoneCall className="h-4 w-4 text-green-500" />
      case 'outgoing':
        return <PhoneOutgoing className="h-4 w-4 text-blue-500" />
      case 'missed':
        return <PhoneMissed className="h-4 w-4 text-red-500" />
      case 'voicemail':
        return <Voicemail className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getCallTypeName = (type: string) => {
    switch (type) {
      case 'incoming':
        return 'Incoming'
      case 'outgoing':
        return 'Outgoing'
      case 'missed':
        return 'Missed'
      case 'voicemail':
        return 'Voicemail'
      default:
        return ''
    }
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  return (
    <li className="py-3 sm:py-4">
      <div className="flex items-center space-x-1">
        <div className="flex-shrink-0">
          <img src={item.user.imageUrl} alt={item.user.name} className="h-8 w-8 flex-none rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {item.user.name}
          </p>
          <div className="flex items-center space-x-1 mt-1">
            {getCallIcon(item.type)}
            <span className="text-xs text-gray-500">{getCallTypeName(item.type)}</span>
          </div>
        </div>
        <div className="text-sm text-gray-500 text-right">
          {item.duration || 'N/A'}
        </div>
        <div className="text-sm text-gray-500 text-center">
          {getRelativeTime(item.date)}
        </div>
      </div>
    </li>
  )
}