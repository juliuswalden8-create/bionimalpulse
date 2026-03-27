'use client'

export default function Sidebar({ unreadCount }: { unreadCount: number }) {
  return (
    <div className="w-64 bg-neutral-900 p-4">
      <h2 className="text-xl mb-6">Menu</h2>

      <div className="space-y-4">
        <div className="cursor-pointer hover:text-gray-300">
          Dashboard
        </div>

        <div className="cursor-pointer hover:text-gray-300">
          Tasks
        </div>

        <div className="cursor-pointer hover:text-gray-300 flex justify-between">
          <span>Inbox</span>
          {unreadCount > 0 && (
            <span className="bg-white text-black px-2 rounded">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
