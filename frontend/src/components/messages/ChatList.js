import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, User } from 'lucide-react';

export default function ChatList({ 
  conversations, 
  activeConversation, 
  setActiveConversation, 
  currentUser 
}) {
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'requests'
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to get the other participant
  const getOtherParticipant = (conv) => {
    return conv?.participants?.find(p => p._id !== currentUser?._id) || {};
  };

  // Debug log
  console.log('[DEBUG] ChatList: conversations', conversations, 'currentUser', currentUser?._id);

  // Filter conversations based on tab and search
  const filteredConversations = (conversations || []).filter(conv => {
    const other = getOtherParticipant(conv);
    const matchesSearch = other.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          other.startup?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status check for tabs
    // Note: If I am the initiator, a 'pending' conversation is just a sent request, I should probably see it in messages but maybe marked?
    // Or maybe 'requests' tab is ONLY for incoming requests.
    // Logic: 
    // - Accepted: Show in Messages
    // - Pending AND I am NOT initiator: Show in Requests
    // - Pending AND I AM initiator: Show in Messages (as sent request) or separate? Let's put in Messages for now.
    
    if (activeTab === 'messages') {
        // Show accepted OR (pending and I initiated it)
        const isAccepted = conv.status === 'accepted';
        const isMySentRequest = conv.status === 'pending' && conv.initiator === currentUser?._id;
        return matchesSearch && (isAccepted || isMySentRequest);
    } else {
        // Show pending AND I did NOT initiate it (Incoming requests)
        const isIncomingRequest = conv.status === 'pending' && conv.initiator !== currentUser?._id;
        return matchesSearch && isIncomingRequest;
    }
  });

  // Calculate unread requests count
  const requestsCount = conversations.filter(conv => 
    conv.status === 'pending' && conv.initiator !== currentUser?._id
  ).length;

  return (
    <div className="w-1/3 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-heading">Messages</h2>
            {/* Optional: New Message Button */}
        </div>

        {/* Search */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                suppressHydrationWarning
            />
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
                onClick={() => setActiveTab('messages')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
                    activeTab === 'messages' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Chats
            </button>
            <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition flex items-center justify-center gap-2 ${
                    activeTab === 'requests' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Requests
                {requestsCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {requestsCount}
                    </span>
                )}
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {searchQuery ? 'No results found.' : (activeTab === 'messages' ? 'No conversations yet.' : 'No new message requests.')}
          </div>
        ) : (
          filteredConversations.map(conv => {
            const isGroup = conv.type === 'group' || conv.isGroup;
            const other = getOtherParticipant(conv);
            const chatName = isGroup ? (conv.groupName || 'Group Chat') : (other.name || 'User');
            const isActive = activeConversation?._id === conv._id;
            const isUnread = conv.unreadCount?.[currentUser?._id] > 0;
            
            return (
              <div 
                key={conv._id}
                onClick={() => setActiveConversation(conv)}
                className={`p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${
                    isActive ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="relative h-12 w-12 flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                        {isGroup ? (
                            <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-750 font-bold text-sm">
                            {conv.groupName ? conv.groupName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase() : 'GP'}
                            </div>
                        ) : other.profileImage ? (
                            <img src={other.profileImage} alt={chatName} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-blue-100 text-primary font-bold">
                            {chatName?.charAt(0)}
                            </div>
                        )}
                    </div>
                    {/* Online Status Indicator */}
                    {!isGroup && other.isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {chatName}
                    </h3>
                    {conv.lastMessage?.createdAt && (
                      <span className={`text-xs flex-shrink-0 ${isUnread ? 'text-primary font-medium' : 'text-gray-400'}`} suppressHydrationWarning>
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate max-w-[85%] ${isUnread ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                        {conv.status === 'pending' && conv.initiator === currentUser?._id ? (
                            <span className="italic text-gray-400">Request sent</span>
                        ) : (
                            <>
                                {conv.lastMessage?.sender === currentUser?._id ? 'You: ' : ''}
                                {conv.lastMessage?.content || 'Start a conversation'}
                            </>
                        )}
                    </p>
                    {isUnread && (
                        <div className="h-2 w-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
